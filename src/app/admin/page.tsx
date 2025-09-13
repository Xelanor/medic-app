'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PageHeader } from '@/components/PageHeader'
import { FullPageLoading, LoadingSpinner } from '@/components/ui/loading'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    role?: string
  }
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()

      if (error) {
        setMessage('Kullanıcılar yüklenirken hata: ' + error.message)
      } else {
        setUsers(data.users || [])
      }
    } catch (error) {
      setMessage('Kullanıcılar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUsers(prev => new Set(prev).add(userId))
    setMessage('')

    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`Kullanıcı rolü ${newRole} olarak güncellendi`)
        // Refresh users list
        await fetchUsers()
      } else {
        setMessage('Rol güncelleme hatası: ' + result.error)
      }
    } catch (error) {
      setMessage('Rol güncellenirken bir hata oluştu')
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (loading) {
    return <FullPageLoading message="Kullanıcılar yükleniyor..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Yönetici Paneli"
        subtitle="Doktor onayları ve kullanıcı rol yönetimi"
      />

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {message && (
            <div className={`mb-6 text-sm p-3 rounded-md ${
              message.includes('güncellendi')
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            }`}>
              {message}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Listesi</CardTitle>
              <CardDescription>
                Kayıtlı kullanıcıları görüntüleyin ve doktor rolü atayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz kayıtlı kullanıcı yok
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.user_metadata?.full_name || 'İsim belirtilmemiş'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.user_metadata?.role === 'doctor'
                                ? 'bg-green-100 text-green-800'
                                : user.user_metadata?.role === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.user_metadata?.role === 'doctor'
                                ? 'Doktor'
                                : user.user_metadata?.role === 'pending'
                                ? 'Onay Bekliyor'
                                : 'Belirsiz'
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.user_metadata?.role !== 'doctor' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateUserRole(user.id, 'doctor')}
                                  disabled={updatingUsers.has(user.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {updatingUsers.has(user.id) ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    'Doktor Yap'
                                  )}
                                </Button>
                              )}
                              {user.user_metadata?.role === 'doctor' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserRole(user.id, 'pending')}
                                  disabled={updatingUsers.has(user.id)}
                                >
                                  {updatingUsers.has(user.id) ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    'Doktor Rolünü Kaldır'
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rol Açıklamaları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Doktor
                    </span>
                    <span>Sisteme tam erişim hakkı olan onaylanmış doktorlar</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Onay Bekliyor
                    </span>
                    <span>Kayıt olmuş ancak henüz onaylanmamış kullanıcılar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}