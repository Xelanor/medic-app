'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { SimpleAuthForm } from './simple-form'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: ''
    }
  })

  // Reset forms and message when switching between login/register
  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    setMessage('')
    // Only reset the forms if they exist and have values
    if (loginForm) {
      loginForm.reset({
        email: '',
        password: ''
      })
    }
    if (registerForm) {
      registerForm.reset({
        fullName: '',
        email: '',
        password: ''
      })
    }
  }

  const onLogin = async (values: LoginFormValues) => {
    setLoading(true)
    setMessage('')

    const { error } = await signIn(values.email, values.password)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  const onRegister = async (values: RegisterFormValues) => {
    setLoading(true)
    setMessage('')

    const { error } = await signUp(values.email, values.password, values.fullName)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Registration successful! Please wait for admin approval to access your account.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Medical Records System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Register as a healthcare professional'}
          </p>
        </div>

        <SimpleAuthForm />
      </div>
    </div>
  )
}