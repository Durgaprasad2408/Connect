import React, { useState, useContext } from 'react'
import api from '../services/api.js'
import { AuthContext } from '../context/AuthContext.jsx'

export default function PostForm({ onPostCreated }) {
  const { user } = useContext(AuthContext)
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files).slice(0, 4) // max 4
    setFiles(newFiles)
    setError(null) // Clear any previous errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() && files.length === 0) return

    const formData = new FormData()
    formData.append('text', text)
    files.forEach(f => formData.append('media', f))

    try {
      setLoading(true)
      setError(null)
      
      console.log('Submitting post with:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        filesCount: files.length
      })
      
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('Post created successfully:', data.post)
      setText('')
      setFiles([])
      if (onPostCreated) onPostCreated(data.post)
    } catch (err) {
      console.error('Post upload failed:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create post'
      const details = err.response?.data?.details
      setError(details ? `${errorMessage}: ${details}` : errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-semibold">
          {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
            <img
              src={user.avatarUrl}
              alt={user?.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it and show fallback
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span
            className="text-sm font-semibold text-gray-600"
            style={{ display: user?.avatarUrl && user.avatarUrl.trim() !== '' ? 'none' : 'flex' }}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            className="w-full border rounded-md p-3 resize-none h-24 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
                Add media
              </label>
              <div className="text-sm text-gray-500">
                {files.length > 0 ? `${files.length} selected` : 'No files'}
              </div>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear files
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
