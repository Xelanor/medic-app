'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/ui/loading'

export default function AddPatientPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    file_number: '',
    gender: '',
    additional_notes: ''
  })
  const router = useRouter()
  const { user } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate required fields
      if (!formData.full_name || !formData.age || !formData.file_number) {
        setMessage('Lütfen tüm zorunlu alanları doldurun (Ad Soyad, Yaş, Dosya Numarası)')
        setLoading(false)
        return
      }

      // Convert age to number
      const ageNumber = parseInt(formData.age)
      if (isNaN(ageNumber) || ageNumber <= 0) {
        setMessage('Lütfen geçerli bir yaş girin')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('patients')
        .insert([
          {
            full_name: formData.full_name,
            age: ageNumber,
            file_number: formData.file_number,
            gender: formData.gender || null,
            additional_notes: formData.additional_notes || null,
            created_by_doctor_id: user?.id,
            created_by_doctor_name: user?.user_metadata?.full_name || 'Unknown Doctor',
            created_by_doctor_email: user?.email
          }
        ])
        .select()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setMessage('Dosya numarası zaten mevcut. Lütfen farklı bir dosya numarası kullanın.')
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage('Hasta başarıyla eklendi!')
        // Reset form
        setFormData({
          full_name: '',
          age: '',
          file_number: '',
          gender: '',
          additional_notes: ''
        })
        // Redirect to patients list after 1 second
        setTimeout(() => {
          router.push('/patients')
        }, 1000)
      }
    } catch (error) {
      setMessage('Hasta eklenirken bir hata oluştu')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Yeni Hasta Ekle"
        subtitle="Sisteme yeni hasta kaydı yapın"
      >
        <Button onClick={() => router.push('/patients')} variant="outline">
          Tüm Hastaları Görüntüle
        </Button>
      </PageHeader>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Hasta Bilgileri</CardTitle>
              <CardDescription>
                Aşağıda hasta bilgilerini girin. * ile işaretli alanlar zorunludur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Ad Soyad *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Hastanın ad soyadını girin"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Yaş *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Hastanın yaşını girin"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      min="0"
                      max="150"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file_number">Dosya Numarası *</Label>
                    <Input
                      id="file_number"
                      type="text"
                      placeholder="Benzersiz dosya numarası girin"
                      value={formData.file_number}
                      onChange={(e) => handleInputChange('file_number', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">Cinsiyet seçin</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Ek Notlar</Label>
                  <Textarea
                    id="additional_notes"
                    placeholder="Hasta hakkında ek notlar girin"
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                    rows={4}
                  />
                </div>

                {message && (
                  <div className={`text-sm text-center p-3 rounded-md ${
                    message.includes('successfully')
                      ? 'text-green-700 bg-green-100'
                      : 'text-red-700 bg-red-100'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <div className="flex items-center space-x-2">
                      {loading && <LoadingSpinner size="sm" />}
                      <span>{loading ? 'Hasta ekleniyor...' : 'Hasta Ekle'}</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/patients')}
                    disabled={loading}
                  >
                    Tüm Hastaları Görüntüle
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}