'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
}

export default function StarRating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = false,
  label
}: StarRatingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={readonly}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-slate-300 dark:text-slate-600"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && value > 0 && (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}