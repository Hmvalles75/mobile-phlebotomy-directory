import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        {
          'bg-primary-100 text-primary-700 border border-primary-200': variant === 'primary',
          'bg-gray-100 text-gray-700 border border-gray-200': variant === 'secondary',
          'bg-green-100 text-green-700 border border-green-200': variant === 'success',
          'bg-yellow-100 text-yellow-700 border border-yellow-200': variant === 'warning',
          'bg-red-100 text-red-700 border border-red-200': variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  )
}