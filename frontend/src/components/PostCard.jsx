import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import formatDate from '../utils/formatDate.js'

export default function PostCard({ post, onLike, onDelete, onComment, onEdit }) {
  const navigate = useNavigate()
  const isImage = (m) => m.type.startsWith('image')
  const isVideo = (m) => m.type.startsWith('video')
  const { user } = useContext(AuthContext)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  
  // Check if current user has liked this post
  const isLiked = post.likes && post.likes.includes(user?.id)
  const likeCount = post.likes ? post.likes.length : 0
  const commentCount = post.comments ? post.comments.length : 0

  // Get latest comment for preview (first comment since we sort descending)
  const latestComment = post.comments && post.comments.length > 0 ? post.comments[0] : null

  // Get comments to display based on showAllComments state
  const commentsToShow = showAllComments
    ? post.comments || []
    : (latestComment ? [latestComment] : [])

  // Handle avatar click to navigate to user profile
  const handleAvatarClick = (e) => {
    e.stopPropagation()
    if (post.author?._id) {
      navigate(`/profile/${post.author._id}`)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    await onComment(post._id, commentText.trim())
    setCommentText('')
    setShowCommentInput(false)
  }

  const handleCommentCancel = () => {
    setCommentText('')
    setShowCommentInput(false)
  }

  const toggleShowComments = () => {
    setShowAllComments(!showAllComments)
  }

  const handleDropdownToggle = (e) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  const handleDropdownAction = (action) => {
    switch (action) {
      case 'delete':
        if (onDelete) onDelete(post._id)
        break
      case 'edit':
        setIsEditing(true)
        setEditText(post.text)
        break
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: `Post by ${post.author?.name}`,
            text: post.text,
            url: window.location.href
          })
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(`${post.text} - ${window.location.href}`)
          alert('Post link copied to clipboard!')
        }
        break
      default:
        break
    }
    setShowDropdown(false)
  }

  const handleEditSave = async () => {
    if (!editText.trim()) return
    if (onEdit) {
      await onEdit(post._id, editText.trim())
    }
    setIsEditing(false)
    setEditText('')
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText(post.text)
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false)
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
      <div className="flex items-start gap-3">
        {/* Profile Photo Avatar (Clickable) */}
        <div
          onClick={handleAvatarClick}
          className="w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          title={`View ${post.author?.name}'s profile`}
        >
          {post.author?.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-gray-600">
              {post.author?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium cursor-pointer hover:underline text-xs md:text-sm" onClick={handleAvatarClick}>
                {post.author?.name}
              </div>
              <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
            </div>
            <div className="relative ml-2">
              {/* Three dots menu */}
              {(onDelete || onEdit) && (
                <button
                  onClick={handleDropdownToggle}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="More options"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              )}

              {/* Dropdown Menu */}
              {(onDelete || onEdit) && showDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {onEdit && (
                      <button
                        onClick={() => handleDropdownAction('edit')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Post
                      </button>
                    )}
                    <button
                      onClick={() => handleDropdownAction('share')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Post
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => handleDropdownAction('delete')}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Post
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='pr-12'>
            {/* Edit Mode */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Edit your post..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditSave}
                    disabled={!editText.trim() || editText.trim() === post.text}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.text}</p>
            )}
  
            {post.media && post.media.length > 0 && (
              <div className="mt-2 grid gap-1"
                   style={{ gridTemplateColumns: post.media.length === 1 ? '1fr' : '1fr 1fr' }}>
                {post.media.map((m, i) => (
                  <div key={i} className="rounded overflow-hidden">
                    {isImage(m) && <img src={m.url} alt="media" className="w-full object-cover max-h-full" />}
                    {isVideo(m) && (
                      <video controls className="w-full max-h-48">
                        <source src={m.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            )}
  
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <button
                onClick={() => onLike(post._id)}
                className={`hover:text-blue-600 flex items-center gap-1 ${isLiked ? 'text-blue-600' : ''}`}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <span>{likeCount}</span>
              </button>
              
              <button
                onClick={() => setShowCommentInput(!showCommentInput)}
                className="hover:text-blue-600 flex items-center gap-1"
              >
                <span>💬</span>
                <span>{commentCount}</span>
              </button>
            </div>
  
            {/* Inline Comment Input */}
            {showCommentInput && (
              <form onSubmit={handleCommentSubmit} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
                <button
                  type="button"
                  onClick={handleCommentCancel}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </form>
            )}
  
            {/* Comments Section */}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-3 border-t pt-2">
                {/* Show "View Comments" button if there are multiple comments and not all are shown */}
                {!showAllComments && post.comments.length > 1 && (
                  <button
                    onClick={toggleShowComments}
                    className="mb-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    View all {post.comments.length} comments
                  </button>
                )}
                
                {/* Show "Hide Comments" button if all comments are shown */}
                {showAllComments && (
                  <button
                    onClick={toggleShowComments}
                    className="mb-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    Hide comments
                  </button>
                )}
  
                <div className="space-y-1.5">
                  {commentsToShow.map((comment) => (
                    <div key={comment._id || `temp-${comment.createdAt}`} className="flex items-start gap-2 text-sm">
                      {/* Comment Avatar (Clickable) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          if (comment.author?._id) {
                            navigate(`/profile/${comment.author._id}`)
                          }
                        }}
                        className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                        title={`View ${comment.author?.name}'s profile`}
                      >
                        {comment.author?.avatarUrl ? (
                          <img
                            src={comment.author.avatarUrl}
                            alt={comment.author?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">
                            {comment.author?.name?.[0]?.toUpperCase() ?? 'U'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-medium text-sm cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (comment.author?._id) {
                                navigate(`/profile/${comment.author._id}`)
                              }
                            }}
                          >
                            {comment.author?.name}
                          </span>
                          <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
