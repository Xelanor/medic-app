'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Patient, MedicalPhoto } from '@/types/database'
import { PageHeader } from '@/components/PageHeader'
import { FullPageLoading } from '@/components/ui/loading'

interface PhotoWithUrl extends MedicalPhoto {
  public_url?: string
}

interface PatientDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [patientId, setPatientId] = useState<string>('')
  const router = useRouter()

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
      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) {
        if (patientError.code === 'PGRST116') {
          setMessage('Patient not found')
        } else {
          setMessage('Error loading patient: ' + patientError.message)
        }
        setLoading(false)
        return
      }

      setPatient(patientData)

      // Fetch recent photos
      const { data: photosData, error: photosError } = await supabase
        .from('medical_photos')
        .select('*')
        .eq('patient_id', patientId)
        .order('taken_date', { ascending: false })
        .limit(4) // Show only recent 4 photos

      if (!photosError && photosData) {
        // Generate URLs for photos
        const photosWithUrls = await Promise.all(
          photosData.map(async (photo) => {
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
      setMessage('An error occurred while loading patient details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatient()
  }, [patientId])

  if (loading) {
    return <FullPageLoading message="Loading patient details..." />
  }

  if (message || !patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Patient Not Found">
          <Button onClick={() => router.push('/patients')} variant="outline">
            Back to Patients
          </Button>
        </PageHeader>
        <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{message || 'Patient not found'}</p>
                  <Button onClick={() => router.push('/patients')}>
                    Return to Patients List
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={patient.full_name}
        subtitle={`File Number: ${patient.file_number}`}
      >
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          Edit Patient
        </Button>
        <Button onClick={() => router.push('/patients')} variant="outline">
          Back to Patients
        </Button>
      </PageHeader>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  Basic details about the patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-lg font-semibold">{patient.full_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Age</label>
                    <p className="text-lg">{patient.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-lg">{patient.gender || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">File Number</label>
                  <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                    {patient.file_number}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="text-lg">
                    {new Date(patient.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Created By</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="font-medium text-blue-900">
                      {patient.created_by_doctor_name || 'Unknown Doctor'}
                    </p>
                    {patient.created_by_doctor_email && (
                      <p className="text-sm text-blue-700">
                        {patient.created_by_doctor_email}
                      </p>
                    )}
                  </div>
                </div>

                {patient.additional_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{patient.additional_notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Records */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Recent medical history and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No medical records found</p>
                  <Button onClick={() => router.push(`/patients/${patient.id}/records/add`)}>
                    Add Medical Record
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Medical Photos */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Medical Photos</CardTitle>
                    <CardDescription>
                      Patient medical images and documentation ({photos.length} total)
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/patients/${patient.id}/photos`)}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">No medical photos uploaded</p>
                    <Button onClick={() => router.push(`/patients/${patient.id}/photos/upload`)}>
                      Upload Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {photos.slice(0, 4).map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/patients/${patient.id}/photos`)}
                        >
                          {photo.public_url ? (
                            <img
                              src={photo.public_url}
                              alt={photo.description || 'Medical photo'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const placeholder = e.currentTarget.parentElement?.querySelector('.photo-placeholder')
                                if (placeholder) {
                                  placeholder.classList.remove('hidden')
                                }
                              }}
                            />
                          ) : null}
                          <div className="photo-placeholder w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Recent photos • {photos[0]?.photo_type} type
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/patients/${patient.id}/photos/upload`)}
                      >
                        Upload More
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/patients/${patient.id}/photos`)}
                      >
                        View Gallery
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for this patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/patients/${patient.id}/records/add`)}
                >
                  📝 Add Medical Record
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/patients/${patient.id}/photos/upload`)}
                >
                  📷 Upload Medical Photo
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/patients/${patient.id}/photos`)}
                >
                  🖼️ View Photo Gallery
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/patients/${patient.id}/edit`)}
                >
                  ✏️ Edit Patient Information
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}