import React, { useEffect, useState, useContext } from 'react'
import api from '../services/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import PostForm from '../components/PostForm.jsx'
import PostCard from '../components/PostCard.jsx'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, postId: null })
  const { user } = useContext(AuthContext)
  const { socket, connected } = useSocket()

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/posts')
      setPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ✅ Real-time socket listeners
  useEffect(() => {
    if (!socket) return

    socket.on('newPost', (newPost) => {
      console.log('🆕 New post received via Socket.IO:', newPost)
      // Avoid duplicate posts: don't add post if current user just created it
      const isCurrentUserPost = newPost.author?._id === user?.id
      if (isCurrentUserPost) {
        console.log('⚠️ Skipping duplicate post from current user')
        return
      }
      setPosts(prev => [newPost, ...prev])
    })

    socket.on('postLiked', ({ postId, likes }) => {
      console.log('👍 Post liked via Socket.IO:', { postId, likes })
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes } : p))
    })

    socket.on('postDeleted', ({ postId }) => {
      console.log('🗑️ Post deleted via Socket.IO:', postId)
      setPosts(prev => prev.filter(p => p._id !== postId))
    })

    socket.on('postUpdated', ({ postId, text, updatedAt }) => {
      console.log('✏️ Post updated via Socket.IO:', { postId, text, updatedAt })
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, text, updatedAt } : p
      ))
    })

    socket.on('commentAdded', ({ postId, comment }) => {
      console.log('💬 New comment via Socket.IO:', { postId, comment })
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const commentExists = (p.comments || []).some(c =>
            c._id === comment._id ||
            (c._id?.startsWith('temp-') && c.text === comment.text && c.author?._id === comment.author?._id)
          )
          if (!commentExists) {
            return { ...p, comments: [comment, ...(p.comments || [])] }
          }
        }
        return p
      }))
    })

    socket.on('commentDeleted', ({ postId, commentId }) => {
      console.log('🗑️ Comment deleted via Socket.IO:', { postId, commentId })
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return { ...p, comments: (p.comments || []).filter(c => c._id !== commentId) }
        }
        return p
      }))
    })

    return () => {
      socket.off('newPost')
      socket.off('postLiked')
      socket.off('postDeleted')
      socket.off('postUpdated')
      socket.off('commentAdded')
      socket.off('commentDeleted')
    }
  }, [socket])

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  // ✅ FIXED LIKE FUNCTION
  const handleLike = async (postId) => {
    try {
      const currentPost = posts.find(p => p._id === postId)
      if (!currentPost) return

      const userIdStr = user?.id?.toString()

      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const currentLikes = (p.likes || []).map(like =>
            typeof like === 'object' ? like._id?.toString?.() : like?.toString?.()
          )

          const isLiked = currentLikes.includes(userIdStr)
          let newLikes

          if (isLiked) {
            newLikes = currentLikes.filter(id => id !== userIdStr)
            console.log('💔 Unliked post', newLikes)
          } else {
            newLikes = [...currentLikes, userIdStr]
            console.log('❤️ Liked post', newLikes)
          }

          return { ...p, likes: newLikes }
        }
        return p
      }))

      // Sync with server
      const { data } = await api.post(`/posts/${postId}/like`)
      console.log('✅ Like API response:', data)

      // Ensure consistent data format after server response
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, likes: (data.likes || []).map(id => id?._id?.toString?.() || id?.toString?.()) }
          : p
      ))

    } catch (err) {
      console.error('❌ Error liking post:', err)
      load()
    }
  }

  const handleComment = async (postId, text) => {
    try {
      const tempComment = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: text.trim(),
        author: { _id: user.id, name: user.name },
        createdAt: new Date()
      }

      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, comments: [tempComment, ...(p.comments || [])] } : p
      ))

      const { data } = await api.post(`/posts/${postId}/comments`, { text: text.trim() })

      setPosts(prev => prev.map(p =>
        p._id === postId ? {
          ...p,
          comments: (p.comments || []).map(c =>
            c._id === tempComment._id ? data.comment : c
          )
        } : p
      ))
    } catch (err) {
      console.error(err)
      alert('Failed to add comment')
      setPosts(prev => prev.map(p =>
        p._id === postId ? {
          ...p,
          comments: (p.comments || []).filter(c => !c._id.startsWith('temp-'))
        } : p
      ))
    }
  }

  const handleDelete = async (postId) => {
    // Show confirmation state instead of blocking confirm()
    setDeleteConfirm({ show: true, postId })
  }

  const confirmDelete = async () => {
    const { postId } = deleteConfirm
    try {
      await api.delete(`/posts/${postId}`)
      setPosts(prev => prev.filter(p => p._id !== postId))
      setDeleteConfirm({ show: false, postId: null })
    } catch (err) {
      console.error(err)
      alert('Delete failed')
      setDeleteConfirm({ show: false, postId: null })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, postId: null })
  }

  const handleEdit = async (postId, newText) => {
    try {
      // Optimistic update for immediate feedback to the user who edited
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, text: newText } : p
      ))

      await api.put(`/posts/${postId}`, { text: newText })
      // Socket event will handle real-time sync for other users
    } catch (err) {
      console.error(err)
      alert('Failed to edit post')
      // Revert optimistic update on error by reloading
      load()
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      
      <PostForm onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="text-center py-10">Loading feed…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No posts yet.</div>
      ) : (
        posts.map(p => (
          <PostCard
            key={p._id}
            post={p}
            onLike={handleLike}
            onDelete={p.author?._id === user?.id ? handleDelete : null}
            onEdit={p.author?._id === user?.id ? handleEdit : null}
            onComment={handleComment}
          />
        ))
      )}

      {/* Custom Delete Confirmation Modal - Non-blocking */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-2 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Post</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
