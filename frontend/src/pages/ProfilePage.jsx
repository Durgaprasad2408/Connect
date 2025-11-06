import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import api from '../services/api.js'
import PostCard from '../components/PostCard.jsx'
import ProfilePhotoUpload from '../components/ProfilePhotoUpload.jsx'
import ProfileUpdate from '../components/ProfileUpdate.jsx'
import ShareProfile from '../components/ShareProfile.jsx'

export default function ProfilePage() {
  const { user: currentUser } = useContext(AuthContext)
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    if (!id || id === 'undefined' || typeof id !== 'string' || id.trim() === '') {
      setError('Invalid user ID provided')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const [{ data: userData }, { data: allPosts }] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/posts')
        ])

        if (!mounted) return
        setUser(userData)
        setPosts(Array.isArray(allPosts) ? allPosts.filter(p => p.author && (p.author._id === id || p.author === id || p.author._id === userData._id)) : [])
      } catch (err) {
        console.error('Error fetching profile:', err)
        if (!mounted) return
        if (err?.response?.status === 404) setError('User not found')
        else if (err?.response?.status === 400) setError('Invalid user ID')
        else setError('Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [id, navigate])

  const handleUserUpdate = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  const handleAvatarUpdate = (newAvatarUrl) => {
    setUser(prevUser => prevUser ? ({ ...prevUser, avatarUrl: newAvatarUrl }) : prevUser)
  }

  // Real-time socket listeners for post interactions
  useEffect(() => {
    if (!socket) return

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
      socket.off('postLiked')
      socket.off('postDeleted')
      socket.off('postUpdated')
      socket.off('commentAdded')
      socket.off('commentDeleted')
    }
  }, [socket])

  // Like handler
  const handleLike = async (postId) => {
    try {
      const currentPost = posts.find(p => p._id === postId)
      if (!currentPost) return

      const userIdStr = currentUser?.id?.toString()

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
      // Reload posts on error
      const { data: allPosts } = await api.get('/posts')
      setPosts(Array.isArray(allPosts) ? allPosts.filter(p => p.author && (p.author._id === id || p.author === id || p.author._id === user._id)) : [])
    }
  }

  // Comment handler
  const handleComment = async (postId, text) => {
    try {
      const tempComment = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: text.trim(),
        author: { _id: currentUser.id, name: currentUser.name },
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

  // Delete handler
  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${postId}`)
      setPosts(prev => prev.filter(p => p._id !== postId))
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  // Edit handler
  const handleEdit = async (postId, newText) => {
    try {
      // Optimistic update for immediate feedback
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, text: newText } : p
      ))

      await api.put(`/posts/${postId}`, { text: newText })
      // Socket event will handle real-time sync for other users
    } catch (err) {
      console.error(err)
      alert('Failed to edit post')
      // Reload posts on error
      const { data: allPosts } = await api.get('/posts')
      setPosts(Array.isArray(allPosts) ? allPosts.filter(p => p.author && (p.author._id === id || p.author === id || p.author._id === user._id)) : [])
    }
  }

  const isOwnProfile = (() => {
    if (!currentUser || !user) return false
    const currentIds = [currentUser._id, currentUser.id, currentUser.userId, currentUser?.uid].filter(Boolean)
    const userIds = [user._id, user.id, user.userId].filter(Boolean)
    const idMatch = currentIds.some(cid => userIds.some(uid => uid === cid))
    const emailMatch = currentUser.email && user.email && currentUser.email === user.email
    return idMatch || emailMatch
  })()

  if (loading) return <div className="text-center py-10">Loading profile…</div>

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/feed')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Feed
          </button>
        </div>
      </div>
    )
  }

  if (!user) return <div className="text-center py-10">User not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      
      {/* --- Card 1: Profile Header --- */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row gap-6">
        
        {/* Left: Avatar + Avatar Actions */}
        <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4">
          {isOwnProfile ? (
            // This component renders the avatar AND its own upload/delete buttons
            <ProfilePhotoUpload
              userId={user._id}
              currentAvatar={user.avatarUrl}
              onAvatarUpdate={handleAvatarUpdate}
            />
          ) : (
            // Static avatar display for other users
            <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl font-bold text-gray-400">
                  {user.name?.[0]?.toUpperCase() || '👤'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Profile Info + Stats + Share */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            {/* Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              <p className="text-sm text-gray-400 mt-2">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {/* Share Action Button */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <ShareProfile user={user} />
              {isOwnProfile && (
                <div>
                  <ProfileUpdate user={user} onUpdate={handleUserUpdate} />
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 flex gap-8 text-sm text-gray-700">
            <div>
              <div className="text-lg font-medium text-indigo-600">{posts.length}</div>
              <div className="text-sm text-gray-400">Posts</div>
            </div>
            {/* you can add followers/following later here */}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-4 text-gray-700">
              <p className="text-sm">{user.bio}</p>
            </div>
          )}
        </div>
      </div>


      {/* --- Card 3: Posts Section --- */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        
        <h3 className="text-lg font-medium mb-4">Recent Posts</h3>
        {posts.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {isOwnProfile ? "You haven't posted anything yet." : `${user.name} hasn't posted anything yet.`}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <PostCard
                key={p._id || p.id}
                post={p}
                onLike={handleLike}
                onDelete={p.author?._id === currentUser?.id ? handleDelete : null}
                onEdit={p.author?._id === currentUser?.id ? handleEdit : null}
                onComment={handleComment}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}