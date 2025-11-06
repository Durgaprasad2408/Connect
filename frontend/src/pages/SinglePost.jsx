import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import PostCard from '../components/PostCard.jsx'

const SinglePost = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useContext(AuthContext)
  const { socket } = useSocket()

  const loadPost = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get(`/posts/${id}`)
      setPost(data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadPost()
    }
  }, [id])

  // ✅ Real-time socket listeners for single post
  useEffect(() => {
    if (!socket || !post) return

    socket.on('postLiked', ({ postId, likes }) => {
      if (postId === id) {
        setPost(prev => prev ? { ...prev, likes } : prev)
      }
    })

    socket.on('postUpdated', ({ postId, text, updatedAt }) => {
      if (postId === id) {
        setPost(prev => prev ? { ...prev, text, updatedAt } : prev)
      }
    })

    socket.on('commentAdded', ({ postId, comment }) => {
      if (postId === id) {
        setPost(prev => {
          if (!prev) return prev
          const commentExists = (prev.comments || []).some(c =>
            c._id === comment._id ||
            (c._id?.startsWith('temp-') && c.text === comment.text && c.author?._id === comment.author?._id)
          )
          if (!commentExists) {
            return { ...prev, comments: [comment, ...(prev.comments || [])] }
          }
          return prev
        })
      }
    })

    socket.on('commentDeleted', ({ postId, commentId }) => {
      if (postId === id) {
        setPost(prev => {
          if (!prev) return prev
          return { 
            ...prev, 
            comments: (prev.comments || []).filter(c => c._id !== commentId) 
          }
        })
      }
    })

    return () => {
      socket.off('postLiked')
      socket.off('postUpdated')
      socket.off('commentAdded')
      socket.off('commentDeleted')
    }
  }, [socket, post, id])

  const handleLike = async (postId) => {
    try {
      if (!post || post._id !== postId) return

      const userIdStr = user?.id?.toString()

      // Optimistic update
      setPost(prev => {
        if (!prev) return prev
        const currentLikes = (prev.likes || []).map(like =>
          typeof like === 'object' ? like._id?.toString?.() : like?.toString?.()
        )
        const isLiked = currentLikes.includes(userIdStr)
        let newLikes

        if (isLiked) {
          newLikes = currentLikes.filter(id => id !== userIdStr)
        } else {
          newLikes = [...currentLikes, userIdStr]
        }

        return { ...prev, likes: newLikes }
      })

      // Sync with server
      const { data } = await api.post(`/posts/${postId}/like`)

      // Ensure consistent data format after server response
      setPost(prev => {
        if (!prev) return prev
        return { 
          ...prev, 
          likes: (data.likes || []).map(id => id?._id?.toString?.() || id?.toString?.()) 
        }
      })

    } catch (err) {
      console.error('❌ Error liking post:', err)
      loadPost()
    }
  }

  const handleComment = async (postId, text) => {
    try {
      if (!post || post._id !== postId) return

      const tempComment = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: text.trim(),
        author: { _id: user.id, name: user.name },
        createdAt: new Date()
      }

      setPost(prev => prev ? {
        ...prev,
        comments: [tempComment, ...(prev.comments || [])]
      } : prev)

      const { data } = await api.post(`/posts/${postId}/comments`, { text: text.trim() })

      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: (prev.comments || []).map(c =>
            c._id === tempComment._id ? data.comment : c
          )
        }
      })
    } catch (err) {
      console.error(err)
      alert('Failed to add comment')
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: (prev.comments || []).filter(c => !c._id.startsWith('temp-'))
        }
      })
    }
  }

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${postId}`)
      // Redirect to feed after deleting
      navigate('/feed')
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  const handleEdit = async (postId, newText) => {
    try {
      // Optimistic update for immediate feedback
      setPost(prev => prev ? { ...prev, text: newText } : prev)

      await api.put(`/posts/${postId}`, { text: newText })
      // Socket event will handle real-time sync for other users
    } catch (err) {
      console.error(err)
      alert('Failed to edit post')
      loadPost()
    }
  }

  const handleGoBack = () => {
    navigate('/feed')
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="text-center py-10">Loading post...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="text-center py-10">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back to Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">Post not found</div>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back to Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Feed
        </button>
      </div>

      {/* Single post */}
      <PostCard
        post={post}
        onLike={handleLike}
        onDelete={post.author?._id === user?.id ? handleDelete : null}
        onEdit={post.author?._id === user?.id ? handleEdit : null}
        onComment={handleComment}
      />
    </div>
  )
}

export default SinglePost