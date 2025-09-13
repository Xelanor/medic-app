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
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [patientId, setPatientId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

  const deletePatient = async () => {
    if (!patient) return

    setDeleting(true)
    setMessage('')

    try {
      // First delete all related photos from storage and database
      const { data: patientPhotos } = await supabase
        .from('medical_photos')
        .select('file_path')
        .eq('patient_id', patient.id)

      if (patientPhotos && patientPhotos.length > 0) {
        // Delete photos from storage
        const filePaths = patientPhotos.map(photo => photo.file_path)
        await supabase.storage
          .from('medical-photos')
          .remove(filePaths)

        // Delete photo records from database
        await supabase
          .from('medical_photos')
          .delete()
          .eq('patient_id', patient.id)
      }

      // Delete medical records
      await supabase
        .from('medical_records')
        .delete()
        .eq('patient_id', patient.id)

      // Finally delete the patient
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id)

      if (error) {
        setMessage('Hasta silinirken hata oluştu: ' + error.message)
      } else {
        setMessage('Hasta başarıyla silindi')
        // Redirect to patients list after 1 second
        setTimeout(() => {
          router.push('/patients')
        }, 1000)
      }
    } catch (error) {
      setMessage('Hasta silinirken bir hata oluştu')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return <FullPageLoading message="Hasta detayları yükleniyor..." />
  }

  if (message || !patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Hasta Bulunamadı">
          <Button onClick={() => router.push('/patients')} variant="outline">
            Hastalara Geri Dön
          </Button>
        </PageHeader>
        <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{message || 'Hasta bulunamadı'}</p>
                  <Button onClick={() => router.push('/patients')}>
                    Hasta Listesine Dön
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
        subtitle={`Dosya Numarası: ${patient.file_number}`}
      >
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          Hastayı Düzenle
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          variant="destructive"
          disabled={deleting}
        >
          {deleting ? 'Siliniyor...' : 'Hastayı Sil'}
        </Button>
        <Button onClick={() => router.push('/patients')} variant="outline">
          Hastalara Geri Dön
        </Button>
      </PageHeader>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle>Hasta Bilgileri</CardTitle>
                <CardDescription>
                  Hasta hakkında temel bilgiler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
                  <p className="text-lg font-semibold">{patient.full_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Yaş</label>
                    <p className="text-lg">{patient.age} yaş</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
                    <p className="text-lg">{patient.gender || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Dosya Numarası</label>
                  <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                    {patient.file_number}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                  <p className="text-lg">
                    {new Date(patient.created_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Kaydeden Doktor</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="font-medium text-blue-900">
                      {patient.created_by_doctor_name || 'Bilinmeyen Doktor'}
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
                    <label className="text-sm font-medium text-gray-700">Ek Notlar</label>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600">Hastayı Sil</CardTitle>
              <CardDescription>
                Bu işlem geri alınamaz. Hasta ve tüm ilgili veriler silinecek.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Silinecek veriler:
                      </h4>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• Hasta bilgileri</li>
                        <li>• Tıbbi fotoğraflar ({photos.length} adet)</li>
                        <li>• Tıbbi kayıtlar</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  <strong>{patient.full_name}</strong> adlı hastayı silmek istediğinizden emin misiniz?
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={deletePatient}
                    variant="destructive"
                    disabled={deleting}
                    className="flex-1"
                  >
                    {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    disabled={deleting}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}