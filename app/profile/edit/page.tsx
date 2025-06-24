"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUsers";
import { UpdateUserInput } from "@/lib/types";
import { showToast } from "@/components/ui/Toast";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, loading: isLoading, updateUser } = useUser(session?.user?.id || "");
  
  const [formData, setFormData] = useState<UpdateUserInput>({
    firstName: "",
    lastName: "",
    gradYear: undefined,
    degreeProgram: "",
    currentRole: "",
    location: "",
    linkedinUrl: "",
    personalSite: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gradYear: user.gradYear || undefined,
        degreeProgram: user.degreeProgram || "",
        currentRole: user.currentRole || "",
        location: user.location || "",
        linkedinUrl: user.linkedinUrl || "",
        personalSite: user.personalSite || "",
      });
    }
  }, [user]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (formData.gradYear && (formData.gradYear < 1900 || formData.gradYear > 2100)) {
      newErrors.gradYear = "Please enter a valid graduation year";
    }

    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = "Please enter a valid URL";
    }

    if (formData.personalSite && !isValidUrl(formData.personalSite)) {
      newErrors.personalSite = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(formData);
      router.push("/profile");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "gradYear" ? (value ? parseInt(value, 10) : undefined) : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
            
            {/* Profile Image Upload Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <ProfileImageUpload
                userId={session.user.id}
                currentImageUrl={user?.profileImageUrl}
              />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.firstName ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.lastName ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Academic Information
                </h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="gradYear"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      name="gradYear"
                      id="gradYear"
                      value={formData.gradYear || ""}
                      onChange={handleChange}
                      min="1900"
                      max="2100"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.gradYear ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.gradYear && (
                      <p className="mt-1 text-sm text-red-600">{errors.gradYear}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="degreeProgram"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Degree Program
                    </label>
                    <input
                      type="text"
                      name="degreeProgram"
                      id="degreeProgram"
                      value={formData.degreeProgram}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Professional Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentRole"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Role
                    </label>
                    <input
                      type="text"
                      name="currentRole"
                      id="currentRole"
                      value={formData.currentRole}
                      onChange={handleChange}
                      placeholder="e.g., Software Engineer at Google"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco, CA"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Online Presence */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Online Presence
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="linkedinUrl"
                      className="block text-sm font-medium text-gray-700"
                    >
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      id="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.linkedinUrl ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.linkedinUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="personalSite"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Personal Website
                    </label>
                    <input
                      type="url"
                      name="personalSite"
                      id="personalSite"
                      value={formData.personalSite}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.personalSite ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.personalSite && (
                      <p className="mt-1 text-sm text-red-600">{errors.personalSite}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/profile"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/profile"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to profile
          </Link>
        </div>
      </div>
    </div>
  );
}