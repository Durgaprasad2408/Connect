// src/components/PostCard.jsx
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import formatDate from '../utils/formatDate.js'

export default function PostCard({ post, onLike, onDelete, onComment, onEdit }) {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  // Support both _id and id shape for user object
  const currentUserId = user?.id ?? user?._id ?? null
  const authorId = post.author?._id ?? post.author?.id ?? null

  const isImage = (m) => m?.type?.startsWith('image')
  const isVideo = (m) => m?.type?.startsWith('video')

  // local UI state
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text ?? '')

  const dropdownRef = useRef(null)

  // computed values
  const isLiked = post.likes && (post.likes.includes(currentUserId) || post.likes.includes(user?.id) || post.likes.includes(user?._id))
  const likeCount = post.likes ? post.likes.length : 0
  const commentCount = post.comments ? post.comments.length : 0
  const latestComment = post.comments && post.comments.length > 0 ? post.comments[0] : null
  const commentsToShow = showAllComments ? (post.comments || []) : (latestComment ? [latestComment] : [])

  // Navigate to profile (safe)
  const navigateToProfile = (id) => {
    if (!id) return
    navigate(`/profile/${id}`)
  }

  const handleAvatarClick = (e) => {
    e.stopPropagation()
    navigateToProfile(authorId)
  }

  // Comment handlers
  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (onComment) {
      await onComment(post._id, commentText.trim())
    }
    setCommentText('')
    setShowCommentInput(false)
  }

  const handleCommentCancel = () => {
    setCommentText('')
    setShowCommentInput(false)
  }

  const toggleShowComments = () => {
    setShowAllComments((s) => !s)
  }

  // Dropdown handlers
  const handleDropdownToggle = (e) => {
    e.stopPropagation()
    setShowDropdown((s) => !s)
  }

  const handleDropdownAction = async (action) => {
    // hide dropdown first
    setShowDropdown(false)

    switch (action) {
      case 'edit':
        setIsEditing(true)
        setEditText(post.text ?? '')
        break
      case 'delete':
        if (onDelete) await onDelete(post._id)
        break
      case 'share':
        if (navigator.share) {
          try {
            const postUrl = `${window.location.origin}/post/${post._id}`
            await navigator.share({
              title: `Post by ${post.author?.name ?? 'a user'}`,
              text: post.text ?? '',
              url: postUrl
            })
          } catch {
            // user cancelled or error — silently ignore
          }
        } else {
          try {
            const postUrl = `${window.location.origin}/post/${post._id}`
            await navigator.clipboard.writeText(`${post.text ?? ''} - ${postUrl}`)
            alert('Post text + link copied to clipboard.')
          } catch {
            alert('Could not copy to clipboard.')
          }
        }
        break
      default:
        break
    }
  }

  // Edit handlers
  const handleEditSave = async () => {
    if (!editText.trim()) return
    if (onEdit) {
      await onEdit(post._id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText(post.text ?? '')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('click', onDocClick)
      return () => document.removeEventListener('click', onDocClick)
    }
  }, [showDropdown])

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          onClick={handleAvatarClick}
          className="w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-semibold cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
          title={`View ${post.author?.name ?? 'user'}'s profile`}
        >
          {post.author?.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author?.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-600">
              {post.author?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div
                className="font-medium cursor-pointer hover:underline text-xs md:text-sm"
                onClick={() => navigateToProfile(authorId)}
              >
                {post.author?.name ?? 'Unknown'}
              </div>
              <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
            </div>

            {/* Three-dots and Dropdown: ALWAYS show three-dots, but menu contents vary */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={handleDropdownToggle}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                title="More options"
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {/* If current user is author -> show edit and delete (if handlers exist) */}
                    {currentUserId && currentUserId === authorId && (
                      <>
                        {onEdit && (
                          <button
                            onClick={() => handleDropdownAction('edit')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Post
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDropdownAction('delete')}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Post
                          </button>
                        )}
                      </>
                    )}

                    {/* Share is visible for everyone */}
                    <button
                      onClick={() => handleDropdownAction('share')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 10-2.83-4M8 12v6m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Share Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post text / edit UI */}
          <div className="pr-12">
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
                    disabled={!editText.trim() || editText.trim() === (post.text ?? '')}
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

            {/* Media */}
            {post.media && post.media.length > 0 && (
              <div
                className="mt-2 grid gap-2"
                style={{ gridTemplateColumns: post.media.length === 1 ? '1fr' : '1fr 1fr' }}
              >
                {post.media.map((m, i) => (
                  <div key={i} className="rounded overflow-hidden">
                    {isImage(m) && (
                      <img src={m.url} alt={`media-${i}`} className="w-full object-cover max-h-96" />
                    )}
                    {isVideo(m) && (
                      <video controls className="w-full max-h-64">
                        <source src={m.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions: Like & Comment */}
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <button
                onClick={() => onLike && onLike(post._id)}
                className={`hover:text-blue-600 flex items-center gap-1 ${isLiked ? 'text-blue-600' : ''}`}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <span>{likeCount}</span>
              </button>

              <button
                onClick={() => setShowCommentInput((s) => !s)}
                className="hover:text-blue-600 flex items-center gap-1"
              >
                <span>💬</span>
                <span>{commentCount}</span>
              </button>
            </div>

            {/* Inline comment input */}
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

            {/* Comments preview / list */}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-3 border-t pt-2">
                {!showAllComments && post.comments.length > 1 && (
                  <button
                    onClick={toggleShowComments}
                    className="mb-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    View all {post.comments.length} comments
                  </button>
                )}

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
                    <div key={comment._id ?? `temp-${comment.createdAt}`} className="flex items-start gap-2 text-sm">
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          const commenterId = comment.author?._id ?? comment.author?.id
                          if (commenterId) navigateToProfile(commenterId)
                        }}
                        className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                        title={`View ${comment.author?.name ?? 'user'}'s profile`}
                      >
                        {comment.author?.avatarUrl ? (
                          <img src={comment.author.avatarUrl} alt={comment.author?.name} className="w-full h-full object-cover" />
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
                              const commenterId = comment.author?._id ?? comment.author?.id
                              if (commenterId) navigateToProfile(commenterId)
                            }}
                          >
                            {comment.author?.name ?? 'Unknown'}
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
