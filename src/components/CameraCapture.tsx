'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CameraCaptureProps {
  onPhotoCapture: (file: File) => void
  onClose: () => void
}

export function CameraCapture({ onPhotoCapture, onClose }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setError('')
      setIsStreaming(false)
      console.log('Starting camera...')

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Request camera access with simpler constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      })

      console.log('Camera stream obtained:', stream)
      console.log('Stream tracks:', stream.getVideoTracks())

      // Store the stream reference
      streamRef.current = stream

      if (videoRef.current) {
        console.log('Setting video srcObject...')
        videoRef.current.srcObject = stream

        // Set up event listeners
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          if (videoRef.current?.videoWidth && videoRef.current?.videoHeight) {
            setIsStreaming(true)
          }
        }

        videoRef.current.onplay = () => {
          console.log('Video started playing')
          setIsStreaming(true)
        }

        // Try to play the video
        try {
          const playPromise = videoRef.current.play()
          if (playPromise !== undefined) {
            await playPromise
            console.log('Video play promise resolved')
          }
        } catch (playError) {
          console.error('Video play error:', playError)
          // Still try to set streaming if stream is available
          if (stream && stream.getVideoTracks().length > 0) {
            setIsStreaming(true)
          }
        }

        // Fallback: set streaming after a short delay if stream is active
        setTimeout(() => {
          if (stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].readyState === 'live') {
            console.log('Fallback: Setting streaming to true')
            setIsStreaming(true)
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setIsStreaming(false)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and try again.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.')
        } else {
          setError('Could not access camera: ' + err.message)
        }
      } else {
        setError('Could not access camera: Unknown error')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    setCapturedPhoto(null)
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get the image as data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhoto(dataURL)
  }, [])

  const savePhoto = async () => {
    if (!capturedPhoto) return

    try {
      // Convert data URL to File
      const response = await fetch(capturedPhoto)
      const blob = await response.blob()
      const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })

      onPhotoCapture(file)
      stopCamera()
      onClose()
    } catch (err) {
      setError('Failed to save photo. Please try again.')
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-full overflow-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Take Photo</CardTitle>
              <CardDescription>
                Capture a medical photo using your device camera
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => { stopCamera(); onClose(); }}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs space-y-1">
            <div>Camera State: <span className="font-mono">{isStreaming ? 'Streaming' : 'Not Streaming'}</span></div>
            <div>Captured Photo: <span className="font-mono">{capturedPhoto ? 'Yes' : 'No'}</span></div>
            <div>Stream Available: <span className="font-mono">{streamRef.current ? 'Yes' : 'No'}</span></div>
            {streamRef.current && (
              <div>Stream Tracks: <span className="font-mono">{streamRef.current.getVideoTracks().length}</span></div>
            )}
            {streamRef.current && streamRef.current.getVideoTracks().length > 0 && (
              <div>Track State: <span className="font-mono">{streamRef.current.getVideoTracks()[0].readyState}</span></div>
            )}
            {videoRef.current && (
              <div>Video Dimensions: <span className="font-mono">{videoRef.current.videoWidth}x{videoRef.current.videoHeight}</span></div>
            )}
          </div>

          {!isStreaming && !capturedPhoto && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Camera Not Started</h3>
              <p className="text-gray-600 mb-4">Click the button below to access your camera</p>
              <div className="space-y-3">
                <Button onClick={startCamera} size="lg">
                  📷 Start Camera
                </Button>
                {streamRef.current && !isStreaming && (
                  <Button onClick={() => setIsStreaming(true)} variant="outline" size="sm">
                    🔧 Force Show Stream
                  </Button>
                )}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Make sure to allow camera permissions when prompted
              </div>
            </div>
          )}

          {isStreaming && !capturedPhoto && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto min-h-[300px] bg-gray-900"
                  style={{ aspectRatio: '16/9' }}
                />
                <div className="absolute bottom-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  Camera Active
                </div>
              </div>
              <div className="text-center text-sm text-gray-600 mb-4">
                Position your camera and click capture when ready
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={capturePhoto} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  📸 Capture Photo
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Cancel
                </Button>
              </div>
              <div className="text-xs text-center text-gray-500">
                Camera stream status: {isStreaming ? 'Active' : 'Inactive'}
              </div>
            </div>
          )}

          {capturedPhoto && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedPhoto}
                  alt="Captured photo"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={savePhoto} size="lg">
                  ✅ Save Photo
                </Button>
                <Button onClick={retakePhoto} variant="outline">
                  🔄 Retake
                </Button>
                <Button onClick={() => { stopCamera(); onClose(); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  )
}