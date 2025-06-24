"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { MissingTAIndicator } from "@/components/course/MissingTAIndicator";
import type { Course, CourseOfferingWithRelations, InvitationWithRelations } from "@/lib/types";

interface InviteFormData {
  email: string;
  message: string;
  suggestedCourseId?: string;
  courseOfferingId?: string;
}

export default function InviteForm() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const courseOfferingId = searchParams.get('courseOfferingId');
  
  const [formData, setFormData] = useState<InviteFormData>({
    email: "",
    message: "",
    suggestedCourseId: "",
    courseOfferingId: courseOfferingId || "",
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseOffering, setCourseOffering] = useState<CourseOfferingWithRelations | null>(null);
  const [invitationHistory, setInvitationHistory] = useState<InvitationWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Load courses and invitation history on mount
  useEffect(() => {
    loadCourses();
    loadInvitationHistory();
    if (courseOfferingId) {
      loadCourseOffering(courseOfferingId);
    }
  }, [courseOfferingId]);

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const loadCourseOffering = async (offeringId: string) => {
    try {
      const response = await fetch(`/api/course-offerings/${offeringId}?include=relations`);
      if (response.ok) {
        const data = await response.json();
        setCourseOffering(data.data);
        // Pre-populate course ID if available
        if (data.data?.courseId) {
          setFormData(prev => ({ ...prev, suggestedCourseId: data.data.courseId }));
        }
      }
    } catch (error) {
      console.error("Failed to load course offering:", error);
    }
  };

  const loadInvitationHistory = async () => {
    try {
      const response = await fetch("/api/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitationHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load invitation history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setInviteLink("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          message: formData.message,
          suggestedCourseId: formData.suggestedCourseId || undefined,
          courseOfferingId: formData.courseOfferingId || undefined,
          targetedForTA: !!formData.courseOfferingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send invitation");
        return;
      }

      setSuccess(true);
      setInviteLink(data.inviteLink);
      setFormData({ 
        email: "", 
        message: "", 
        suggestedCourseId: courseOffering?.courseId || "", 
        courseOfferingId: courseOfferingId || "" 
      });
      
      // Reload invitation history
      loadInvitationHistory();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invitation link copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      {/* Show course offering info if inviting for a specific course */}
      {courseOffering && (
        <Card variant="secondary" className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <Typography variant="h3" className="mb-2">
                Inviting for: {courseOffering.course?.courseNumber} - {courseOffering.course?.courseName}
              </Typography>
              <Typography variant="small" className="text-gray-600">
                {courseOffering.semester} • Professor: {
                  courseOffering.professor 
                    ? `${courseOffering.professor.firstName} ${courseOffering.professor.lastName}`
                    : 'Not assigned'
                }
              </Typography>
              <div className="mt-2">
                <MissingTAIndicator
                  currentTAs={courseOffering.taAssignments?.length || 0}
                  requiredTAs={1}
                  size="sm"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCourseOffering(null);
                setFormData(prev => ({ ...prev, courseOfferingId: "", suggestedCourseId: "" }));
                window.history.replaceState(null, '', '/auth/invite');
              }}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="colleague@wustl.edu"
          helperText="The person you're inviting will receive an email with a registration link."
          disabled={isLoading}
        />

        <div>
          <label htmlFor="suggestedCourseId" className="block text-sm font-medium text-charcoal mb-1">
            Suggest a Course (Optional)
          </label>
          <select
            id="suggestedCourseId"
            name="suggestedCourseId"
            value={formData.suggestedCourseId}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-sans text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent transition-colors duration-200"
            disabled={isLoading}
          >
            <option value="">No course suggestion</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseNumber} - {course.courseName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Suggest a course this person might have been a Head TA for.
          </p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-1">
            Personal Message (Optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-sans text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent transition-colors duration-200 placeholder:text-gray-400"
            placeholder={
              courseOffering 
                ? `Hi! We're looking for a Head TA for ${courseOffering.course?.courseNumber} (${courseOffering.semester}). I thought you might be interested...`
                : "Hey! I'd like to invite you to join the WU Head TA Directory..."
            }
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            {courseOffering 
              ? "This person will be notified about the specific TA opportunity."
              : "Add a personal note to be included in the invitation email."}
          </p>
        </div>

        {error && (
          <ErrorMessage variant="error">
            {error}
          </ErrorMessage>
        )}

        {success && (
          <ErrorMessage variant="info">
            <div>
              <p className="mb-2">Invitation sent successfully!</p>
              {inviteLink && (
                <div className="mt-3">
                  <p className="text-sm mb-2">Share this link with the invitee:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 text-sm bg-white border border-blue-300 rounded px-2 py-1"
                    />
                    <Button
                      type="button"
                      onClick={copyToClipboard}
                      variant="secondary"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ErrorMessage>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : "Send Invitation"}
        </Button>
      </form>

      {/* Invitation History */}
      <div className="border-t pt-8">
        <Typography variant="h3" className="mb-4">
          Your Invitation History
        </Typography>
        
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : invitationHistory.length === 0 ? (
          <Card variant="secondary" className="text-center py-8">
            <Typography variant="body" className="text-gray-500">
              You haven't sent any invitations yet.
            </Typography>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitationHistory.map((invitation) => (
              <Card key={invitation.id} variant="secondary">
                <div className="flex justify-between items-start">
                  <div>
                    <Typography variant="body" className="font-medium">
                      {invitation.email}
                    </Typography>
                    <Typography variant="small" className="text-gray-500 mt-1">
                      Sent on {new Date(invitation.createdAt).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="text-right">
                    {invitation.usedAt ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    ) : new Date(invitation.expiresAt) < new Date() ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* About Invitations */}
      <div className="border-t pt-8">
        <Typography variant="h3" className="mb-3">
          About Invitations
        </Typography>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Invitations are valid for 7 days</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Each email can only have one active invitation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The invitee will need to create an account using the invitation link</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You'll be recorded as the person who invited them</span>
          </li>
        </ul>
      </div>
    </div>
  );
}