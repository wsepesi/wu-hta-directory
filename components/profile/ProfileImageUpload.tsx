"use client";

import { useState } from "react";
import Image from "next/image";
import { showToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export default function ProfileImageUpload({
  userId,
  currentImageUrl,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const [imageLoading, setImageLoading] = useState(false);

  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Check if it's a valid image URL (basic check)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      );
      
      // Also accept URLs from common image hosting services
      const imageHosts = ['gravatar.com', 'githubusercontent.com', 'googleusercontent.com'];
      const isImageHost = imageHosts.some(host => urlObj.hostname.includes(host));
      
      return hasImageExtension || isImageHost;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setError("");
    
    // Update preview if valid URL
    if (url && validateImageUrl(url)) {
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!imageUrl) {
      setError("Please enter an image URL");
      return;
    }

    if (!validateImageUrl(imageUrl)) {
      setError("Please enter a valid image URL (jpg, png, gif, etc.)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (response.status === 501) {
        // Schema update needed
        showToast("info", "Profile image feature is not yet available. Database schema update required.");
      } else if (!response.ok) {
        setError(data.error || "Failed to update profile image");
      } else {
        showToast("success", "Profile image updated successfully!");
        onImageUpdate?.(imageUrl);
      }
    } catch (error) {
      console.error("Failed to update profile image:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Profile Image</h3>
      
      {/* Image Preview */}
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0 relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton variant="circular" width={96} height={96} />
            </div>
          )}
          {previewUrl && !imageLoading ? (
            <Image
              src={previewUrl}
              alt="Profile"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
              onLoadStart={() => setImageLoading(true)}
              onLoadingComplete={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setPreviewUrl("");
                setError("Failed to load image preview");
              }}
            />
          ) : (
            !imageLoading && (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )
          )}
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/your-image.jpg"
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  error ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a direct link to an image file (jpg, png, gif, etc.)
              </p>
            </div>
            
            {error && <ErrorMessage variant="error">{error}</ErrorMessage>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Image"}
            </button>
          </form>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Profile image functionality is currently limited. 
          In a future update, you&apos;ll be able to upload images directly from your device.
        </p>
      </div>
    </div>
  );
}