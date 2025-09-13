'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tıbbi Kayıt Paneli
              </h1>
              <p className="text-sm text-gray-600">
                Hoş geldiniz, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Çıkış Yap
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hastalar</CardTitle>
                <CardDescription>
                  Hasta kayıtlarını ve bilgilerini yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push('/patients')}>
                  Hastaları Görüntüle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yeni Hasta Ekle</CardTitle>
                <CardDescription>
                  Sisteme yeni hasta kaydı yapın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push('/patients/add')}>
                  Hasta Ekle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tıbbi Fotoğraflar</CardTitle>
                <CardDescription>
                  Tıbbi fotoğrafları yükleyin ve yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Fotoğrafları Yönet
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>
                  En son hasta kayıtları ve güncellemeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Görüntülenecek son aktivite yok
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}