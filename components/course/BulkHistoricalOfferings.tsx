'use client'

import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { Course, Professor } from '@/lib/types'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { showToast } from '@/components/ui/EnhancedToast'

interface BulkHistoricalOfferingsProps {
  isOpen: boolean
  onClose: () => void
  courses: Course[]
  professors: Professor[]
  onSuccess?: () => void
}

type SemesterPattern = 'both' | 'spring' | 'fall' | 'custom'
type ProfessorStrategy = 'leave_blank' | 'copy_recent' | 'manual'

interface CustomSchedule {
  [year: number]: ('Spring' | 'Fall')[]
}

interface PreviewOffering {
  courseId: string
  courseName: string
  courseNumber: string
  professorId: string | null
  professorName: string | null
  semester: string
  year: number
  season: 'Spring' | 'Fall'
}

export function BulkHistoricalOfferings({
  isOpen,
  onClose,
  courses,
  professors,
  onSuccess
}: BulkHistoricalOfferingsProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 5)
  const [endYear, setEndYear] = useState(new Date().getFullYear())
  const [semesterPattern, setSemesterPattern] = useState<SemesterPattern>('both')
  const [professorStrategy, setProfessorStrategy] = useState<ProfessorStrategy>('leave_blank')
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null)
  const [customSchedule, setCustomSchedule] = useState<CustomSchedule>({})
  const [showPreview, setShowPreview] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear - i)

  const previewOfferings = useMemo(() => {
    const offerings: PreviewOffering[] = []
    
    for (const courseId of selectedCourses) {
      const course = courses.find(c => c.id === courseId)
      if (!course) continue

      for (let year = startYear; year <= endYear; year++) {
        let seasons: ('Spring' | 'Fall')[] = []
        
        if (semesterPattern === 'both') {
          seasons = ['Spring', 'Fall']
        } else if (semesterPattern === 'spring') {
          seasons = ['Spring']
        } else if (semesterPattern === 'fall') {
          seasons = ['Fall']
        } else if (semesterPattern === 'custom') {
          seasons = customSchedule[year] || []
        }

        for (const season of seasons) {
          offerings.push({
            courseId: course.id,
            courseName: course.courseName,
            courseNumber: course.courseNumber,
            professorId: professorStrategy === 'manual' ? selectedProfessor : null,
            professorName: professorStrategy === 'manual' && selectedProfessor
              ? (() => {
                  const prof = professors.find(p => p.id === selectedProfessor);
                  return prof ? `${prof.firstName} ${prof.lastName}` : null;
                })() || null
              : null,
            semester: `${season} ${year}`,
            year,
            season
          })
        }
      }
    }

    return offerings.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      if (a.season !== b.season) return a.season === 'Fall' ? 1 : -1
      return a.courseNumber.localeCompare(b.courseNumber)
    })
  }, [selectedCourses, startYear, endYear, semesterPattern, professorStrategy, selectedProfessor, customSchedule, courses, professors])

  const handleCustomScheduleChange = (year: number, season: 'Spring' | 'Fall') => {
    setCustomSchedule(prev => {
      const yearSeasons = prev[year] || []
      const updated = yearSeasons.includes(season)
        ? yearSeasons.filter(s => s !== season)
        : [...yearSeasons, season]
      
      return {
        ...prev,
        [year]: updated
      }
    })
  }

  const handleCreate = async () => {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/course-offerings/bulk-historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerings: previewOfferings.map(({ courseId, professorId, year, season }) => ({
            courseId,
            professorId,
            year,
            season,
            semester: `${season} ${year}`
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create offerings')
      }

      showToast(
        'success',
        'Offerings Created',
        { message: `Successfully created ${data.created} offerings (${data.skipped} duplicates skipped)` }
      )
      
      onSuccess?.()
      setTimeout(onClose, 1500)
    } catch (error) {
      showToast(
        'error',
        'Error',
        { message: error instanceof Error ? error.message : 'Failed to create offerings' }
      )
    } finally {
      setIsCreating(false)
      setShowConfirmation(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Bulk Create Historical Offerings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showPreview ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courses
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {courses.map(course => (
                    <label key={course.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses([...selectedCourses, course.id])
                          } else {
                            setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        CSE {course.courseNumber} - {course.courseName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year
                  </label>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Year
                  </label>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {yearOptions.filter(year => year >= startYear).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester Pattern
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="both"
                      checked={semesterPattern === 'both'}
                      onChange={(e) => setSemesterPattern(e.target.value as SemesterPattern)}
                      className="mr-2"
                    />
                    Both Spring and Fall
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="spring"
                      checked={semesterPattern === 'spring'}
                      onChange={(e) => setSemesterPattern(e.target.value as SemesterPattern)}
                      className="mr-2"
                    />
                    Spring only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fall"
                      checked={semesterPattern === 'fall'}
                      onChange={(e) => setSemesterPattern(e.target.value as SemesterPattern)}
                      className="mr-2"
                    />
                    Fall only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="custom"
                      checked={semesterPattern === 'custom'}
                      onChange={(e) => setSemesterPattern(e.target.value as SemesterPattern)}
                      className="mr-2"
                    />
                    Custom schedule
                  </label>
                </div>
              </div>

              {semesterPattern === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Schedule
                  </label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map(year => (
                      <div key={year} className="flex items-center justify-between p-1">
                        <span className="text-sm font-medium">{year}:</span>
                        <div className="flex gap-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={customSchedule[year]?.includes('Spring') || false}
                              onChange={() => handleCustomScheduleChange(year, 'Spring')}
                              className="mr-1"
                            />
                            Spring
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={customSchedule[year]?.includes('Fall') || false}
                              onChange={() => handleCustomScheduleChange(year, 'Fall')}
                              className="mr-1"
                            />
                            Fall
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professor Assignment
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="leave_blank"
                      checked={professorStrategy === 'leave_blank'}
                      onChange={(e) => setProfessorStrategy(e.target.value as ProfessorStrategy)}
                      className="mr-2"
                    />
                    Leave blank (assign later)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="manual"
                      checked={professorStrategy === 'manual'}
                      onChange={(e) => setProfessorStrategy(e.target.value as ProfessorStrategy)}
                      className="mr-2"
                    />
                    Assign specific professor
                  </label>
                </div>
              </div>

              {professorStrategy === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Professor
                  </label>
                  <select
                    value={selectedProfessor || ''}
                    onChange={(e) => setSelectedProfessor(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a professor</option>
                    {professors.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.firstName} {prof.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Summary</h3>
                <p className="text-sm text-gray-600">
                  Creating {previewOfferings.length} offerings for {selectedCourses.length} courses
                  from {startYear} to {endYear}
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Course
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Semester
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Professor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewOfferings.map((offering, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">
                          CSE {offering.courseNumber}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {offering.semester}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {offering.professorName || 'TBD'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t">
          {!showPreview ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={selectedCourses.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Preview ({previewOfferings.length} offerings)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Offerings'}
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleCreate}
        onClose={() => setShowConfirmation(false)}
        title="Create Historical Offerings"
        message={`Are you sure you want to create ${previewOfferings.length} course offerings? Duplicate offerings will be automatically skipped.`}
        confirmText="Create"
        variant="info"
      />

    </div>
  )
}