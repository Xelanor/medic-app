'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Patient, MedicalPhoto } from '@/types/database'
import { PageHeader } from '@/components/PageHeader'
import { FullPageLoading } from '@/components/ui/loading'

interface PhotoGalleryPageProps {
  params: Promise<{
    id: string
  }>
}

interface PhotoWithUrl extends MedicalPhoto {
  public_url?: string
}

export default function PhotoGalleryPage({ params }: PhotoGalleryPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [patientId, setPatientId] = useState<string>('')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithUrl | null>(null)
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setPatientId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const fetchPatientAndPhotos = async () => {
    if (!patientId) return

    try {
      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) {
        setMessage('Patient not found')
        setLoading(false)
        return
      }

      setPatient(patientData)

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('medical_photos')
        .select('*')
        .eq('patient_id', patientId)
        .order('taken_date', { ascending: false })

      if (photosError) {
        setMessage('Error loading photos: ' + photosError.message)
      } else {
        // Try signed URLs first, fallback to public URLs
        const photosWithUrls = await Promise.all(
          (photosData || []).map(async (photo) => {
            // First try signed URL
            const { data: signedData, error: signedError } = await supabase.storage
              .from('medical-photos')
              .createSignedUrl(photo.file_path, 3600) // 1 hour

            if (!signedError && signedData) {
              return {
                ...photo,
                public_url: signedData.signedUrl
              }
            }

            // Fallback to public URL
            const { data: publicData } = supabase.storage
              .from('medical-photos')
              .getPublicUrl(photo.file_path)

            return {
              ...photo,
              public_url: publicData.publicUrl
            }
          })
        )

        setPhotos(photosWithUrls)
      }
    } catch (error) {
      setMessage('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientAndPhotos()
  }, [patientId])

  const deletePhoto = async (photo: PhotoWithUrl) => {
    if (!confirm(`Are you sure you want to delete this photo?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('medical-photos')
        .remove([photo.file_path])

      if (storageError) {
        throw new Error('Failed to delete file from storage')
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('medical_photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) {
        throw new Error('Failed to delete photo record')
      }

      // Remove from local state
      setPhotos(photos => photos.filter(p => p.id !== photo.id))
      setSelectedPhoto(null)
      setMessage('Photo deleted successfully')

    } catch (error) {
      setMessage(`Delete failed: ${error.message}`)
    }
  }

  const PhotoModal = ({ photo, onClose }: { photo: PhotoWithUrl, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Medical Photo</h3>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4">
          {photo.public_url ? (
            <img
              src={photo.public_url}
              alt={photo.description || 'Medical photo'}
              className="max-w-full max-h-96 object-contain mx-auto mb-4"
            />
          ) : (
            <div className="max-w-full h-96 flex items-center justify-center bg-gray-100 mx-auto mb-4">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p>Unable to load image</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Type:</strong> {photo.photo_type}
            </div>
            <div>
              <strong>Date:</strong> {new Date(photo.taken_date).toLocaleDateString()}
            </div>
            <div>
              <strong>File:</strong> {photo.file_name}
            </div>
            <div>
              <strong>Size:</strong> {photo.file_size ? (photo.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
            </div>
            {photo.description && (
              <div className="md:col-span-2">
                <strong>Description:</strong> {photo.description}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="destructive"
              onClick={() => deletePhoto(photo)}
            >
              Delete Photo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <FullPageLoading message="Loading photos..." />
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Patient Not Found">
          <Button onClick={() => router.push('/patients')} variant="outline">
            Back to Patients
          </Button>
        </PageHeader>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Medical Photos"
        subtitle={`Patient: ${patient.full_name} (File: ${patient.file_number}) - ${photos.length} photos`}
      >
        <Button onClick={() => router.push(`/patients/${patient.id}/photos/upload`)}>
          Upload Photos
        </Button>
        <Button onClick={() => router.push(`/patients/${patient.id}`)} variant="outline">
          Back to Patient
        </Button>
      </PageHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {message && (
            <div className={`mb-6 text-sm p-3 rounded-md ${
              message.includes('successfully')
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            }`}>
              {message}
            </div>
          )}

          {photos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No photos uploaded yet</h3>
                  <p className="text-gray-500 mb-4">
                    Upload medical photos for this patient to get started.
                  </p>
                  <Button onClick={() => router.push(`/patients/${patient.id}/photos/upload`)}>
                    Upload First Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card
                  key={photo.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {photo.public_url ? (
                        <img
                          src={photo.public_url}
                          alt={photo.description || 'Medical photo'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(photo.taken_date).toLocaleDateString()}
                      </div>
                      {photo.description && (
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {photo.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedPhoto && (
            <PhotoModal
              photo={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </div>
      </main>
    </div>
  )
}