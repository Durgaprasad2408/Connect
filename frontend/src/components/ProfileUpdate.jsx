// ProfileUpdate.jsx

import React, { useState } from 'react'
import api from '../services/api.js'

// Receives onCancel prop and no longer manages isEditing state
export default function ProfileUpdate({ user, onUpdate, onCancel }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to change password')
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match')
        return
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long')
        return
      }
    }

    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim()
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await api.put(`/users/${user._id}`, updateData)
      
      if (response.data.user) {
        onUpdate(response.data.user) // Notify parent of update
        // setIsEditing(false) // <-- Removed, parent handles this
        
        setSuccess('Profile updated successfully!')
        
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  // Simplified handleCancel, just notifies the parent
  const handleCancel = () => {
    onCancel()
  }

  // Removed the if (!isEditing) block
  // The return now starts with a React fragment, as the parent provides the card
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Edit Profile</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel} // Uses new handler
            disabled={isUpdating}
            className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
          >
            Cancel
          </button>
  _id     </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isUpdating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isUpdating}
          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>
        </div>

        {/* Password Change Section */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Change Password (Optional)</h4>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
color="red"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
    _id                 disabled={isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
message="Password updated successfully"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
content="This is a required field"
            {error}
          </div>
        )}
        
        {success && (
  _id       <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
      </form>
    </>
  )
}