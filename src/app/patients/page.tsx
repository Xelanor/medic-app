'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/database'
import { PageHeader } from '@/components/PageHeader'
import { FullPageLoading } from '@/components/ui/loading'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setMessage('Error loading patients: ' + error.message)
      } else {
        setPatients(data || [])
      }
    } catch (error) {
      setMessage('An error occurred while loading patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.file_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  if (loading) {
    return <FullPageLoading message="Loading patients..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Patients"
        subtitle={`Manage patient records (${patients.length} total patients)`}
      >
        <Button onClick={() => router.push('/patients/add')}>
          Add New Patient
        </Button>
      </PageHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {message && (
            <div className="mb-6 text-sm text-red-600 bg-red-100 p-3 rounded-md">
              {message}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Patient Directory</CardTitle>
              <CardDescription>
                Search and view all registered patients
              </CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search by name or file number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? `No patients found matching "${searchTerm}"`
                    : 'No patients registered yet'
                  }
                  <div className="mt-4">
                    <Button onClick={() => router.push('/patients/add')}>
                      Add First Patient
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Number</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow
                          key={patient.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handlePatientClick(patient.id)}
                        >
                          <TableCell className="font-medium">
                            {patient.file_number}
                          </TableCell>
                          <TableCell>{patient.full_name}</TableCell>
                          <TableCell>{patient.age} years</TableCell>
                          <TableCell>{patient.gender || 'Not specified'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {patient.created_by_doctor_name || 'Unknown Doctor'}
                              </div>
                              <div className="text-gray-500">
                                {patient.created_by_doctor_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(patient.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePatientClick(patient.id)
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}