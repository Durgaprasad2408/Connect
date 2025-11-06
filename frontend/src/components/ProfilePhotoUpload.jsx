import React, { useState, useRef } from "react";
import api from "../services/api.js";

export default function ProfilePhotoUpload({ userId, currentAvatar, onAvatarUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await api.post(`/users/${userId}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.avatarUrl) {
        onAvatarUpdate(data.avatarUrl);
        setMessage({ type: "success", text: "Profile photo updated successfully!" });
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to upload photo",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const deleteAvatar = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      await api.delete(`/users/${userId}/avatar`);
      onAvatarUpdate(null);
      setMessage({ type: "success", text: "Profile photo deleted successfully!" });
    } catch (err) {
      console.error("Error deleting avatar:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to delete photo",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar Display */}
      <div className="flex items-center justify-center">
        <div className="relative group">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-5xl font-semibold text-gray-400 shadow-md transition-all duration-200 group-hover:scale-105">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-150"
        >
          {currentAvatar ? "Change Photo" : "Upload Photo"}
        </button>

        {currentAvatar && (
          <button
            onClick={deleteAvatar}
            disabled={isUploading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-150"
          >
            Delete
          </button>
        )}
      </div>

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Messages */}
      {message.text && (
        <div
          className={`text-center px-4 py-2 rounded-lg border ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
