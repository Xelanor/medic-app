'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Patient } from '@/types/database'
import { CameraCapture } from '@/components/CameraCapture'
import { PageHeader } from '@/components/PageHeader'
import { FullPageLoading, LoadingSpinner } from '@/components/ui/loading'

interface PhotoUploadPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PhotoUploadPage({ params }: PhotoUploadPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [patientId, setPatientId] = useState<string>('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [photoData, setPhotoData] = useState({
    description: '',
    photo_type: 'general'
  })
  const [showCamera, setShowCamera] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setPatientId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const fetchPatient = async () => {
    if (!patientId) return

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (error) {
        setMessage('Patient not found')
      } else {
        setPatient(data)
      }
    } catch (error) {
      setMessage('Error loading patient')
    }
  }

  useEffect(() => {
    fetchPatient()
  }, [patientId])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length !== acceptedFiles.length) {
      setMessage('Only image files are allowed')
      return
    }

    setUploadedFiles(imageFiles)
    setMessage('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const uploadPhotos = async () => {
    if (!patient || uploadedFiles.length === 0) {
      setMessage('Please select at least one photo to upload')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const uploadPromises = uploadedFiles.map(async (file) => {
        // Generate unique filename
        const fileExtension = file.name.split('.').pop()
        const fileName = `${patient.file_number}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
        const filePath = `medical-photos/${patient.id}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('medical-photos')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`)
        }

        // Save metadata to database
        const { data: photoRecord, error: dbError } = await supabase
          .from('medical_photos')
          .insert({
            patient_id: patient.id,
            file_name: fileName,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            description: photoData.description || null,
            photo_type: photoData.photo_type,
            uploaded_by: user?.id
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(`Database error for ${file.name}: ${dbError.message}`)
        }

        return photoRecord
      })

      await Promise.all(uploadPromises)

      setMessage(`Successfully uploaded ${uploadedFiles.length} photo(s)!`)
      setUploadedFiles([])
      setPhotoData({ description: '', photo_type: 'general' })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/patients/${patient.id}`)
      }, 2000)

    } catch (error) {
      setMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(files => files.filter((_, index) => index !== indexToRemove))
  }

  const handleCameraCapture = (file: File) => {
    setUploadedFiles(files => [...files, file])
    setMessage('')
  }

  if (!patient) {
    return <FullPageLoading message="Loading patient..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Upload Medical Photos"
        subtitle={`Patient: ${patient.full_name} (File: ${patient.file_number})`}
      >
        <Button onClick={() => router.push(`/patients/${patient.id}`)} variant="outline">
          Back to Patient
        </Button>
      </PageHeader>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Photo Input Options */}
          <Card>
            <CardHeader>
              <CardTitle>Add Photos</CardTitle>
              <CardDescription>
                Upload photos from your device or take photos with your camera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload from Files */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-10 w-10 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">
                      {isDragActive ? 'Drop the files here' : 'Upload from Device'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Drag & drop or click to select files
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Option */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-3">OR</div>
                <Button
                  onClick={() => setShowCamera(true)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  📷 Take Photo with Camera
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Use your device&apos;s camera to capture photos directly
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({uploadedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Details */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photo Details</CardTitle>
                <CardDescription>
                  Add description and categorization for the uploaded photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photo_type">Photo Type</Label>
                  <select
                    id="photo_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={photoData.photo_type}
                    onChange={(e) => setPhotoData(prev => ({ ...prev, photo_type: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="x-ray">X-Ray</option>
                    <option value="wound">Wound</option>
                    <option value="skin-condition">Skin Condition</option>
                    <option value="surgical">Surgical</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="treatment">Treatment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes about these photos (optional)"
                    value={photoData.description}
                    onChange={(e) => setPhotoData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-4">
              <Button
                onClick={uploadPhotos}
                disabled={loading}
                className="flex-1"
              >
                <div className="flex items-center space-x-2">
                  {loading && <LoadingSpinner size="sm" />}
                  <span>{loading ? 'Uploading...' : `Upload ${uploadedFiles.length} Photo(s)`}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadedFiles([])}
                disabled={loading}
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`text-sm text-center p-3 rounded-md ${
              message.includes('Successfully')
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            }`}>
              {message}
            </div>
          )}

          {/* Camera Modal */}
          {showCamera && (
            <CameraCapture
              onPhotoCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          )}
        </div>
      </main>
    </div>
  )
}