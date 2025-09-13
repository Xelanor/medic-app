import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ message = "Loading...", size = "lg", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <LoadingSpinner size={size} />
      <p className="text-gray-600 text-sm font-medium">{message}</p>
    </div>
  )
}

interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = "Loading..." }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingState message={message} />
    </div>
  )
}

interface ButtonLoadingProps {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  [key: string]: unknown
}

export function ButtonWithLoading({
  loading,
  children,
  loadingText,
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center space-x-2",
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
}