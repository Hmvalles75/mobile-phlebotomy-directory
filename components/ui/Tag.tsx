import { cn } from '@/lib/utils'

interface TagProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  size?: 'sm' | 'md'
  className?: string
}

export function Tag({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className 
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          'px-2.5 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        },
        {
          'bg-primary-100 text-primary-800': variant === 'primary',
          'bg-gray-100 text-gray-800': variant === 'secondary',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
        },
        className
      )}
    >
      {children}
    </span>
  )
}