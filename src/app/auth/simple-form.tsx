'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading'

export function SimpleAuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToggle = () => {
    setIsLogin(!isLogin)
    setMessage('')
    setFormData({
      fullName: '',
      email: '',
      password: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password)
      if (error) {
        setMessage(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Login failed')
      } else {
        router.push('/dashboard')
      }
    } else {
      const { error } = await signUp(formData.email, formData.password, formData.fullName)
      if (error) {
        setMessage(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Registration failed')
      } else {
        setMessage('Registration successful! Please wait for admin approval to access your account.')
      }
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? 'Sign In' : 'Register'}</CardTitle>
        <CardDescription>
          {isLogin
            ? 'Enter your credentials to access the system'
            : 'Create an account to access patient records'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Dr. John Smith"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="doctor@hospital.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </div>

          {message && (
            <div className={`text-sm text-center ${
              message.includes('successful') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            <div className="flex items-center space-x-2">
              {loading && <LoadingSpinner size="sm" />}
              <span>
                {loading
                  ? (isLogin ? 'Signing in...' : 'Creating account...')
                  : (isLogin ? 'Sign In' : 'Register')
                }
              </span>
            </div>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={handleToggle}
          >
            {isLogin
              ? "Don't have an account? Register here"
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </CardContent>
    </Card>
  )
}