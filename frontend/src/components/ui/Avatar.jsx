import { useState } from 'react';
import { cn, initials } from '@/lib/utils';

const sizes = {
  sm: 'size-8 text-xs',
  default: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
  '2xl': 'size-24 text-2xl',
};

/**
 * Avatar with an initials fallback. `src` is optional — company logos come from
 * Cloudinary and may be null, and employees have no photo field at all.
 */
export function Avatar({ src, name, size = 'default', className, ring = false, alt }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        'bg-primary/12 font-semibold text-primary',
        ring && 'ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden={!!name}>{initials(name)}</span>
      )}
      {name && !showImage && <span className="sr-only">{name}</span>}
    </span>
  );
}
