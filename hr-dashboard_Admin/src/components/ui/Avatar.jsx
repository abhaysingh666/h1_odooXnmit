import { initials } from '../../utils/formatters';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const PALETTE = [
  ['#6E4AA8', '#EAE1F7'],
  ['#914D77', '#F6E5EF'],
  ['#5C6FD9', '#E6E8FA'],
  ['#B3455A', '#F6E1E6'],
  ['#6B5E7D', '#ECE4F6'],
];

function paletteFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const [ink, bg] = paletteFor(name || 'employee');

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile picture` : 'Profile picture'}
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name ? `${name}'s profile picture` : 'Profile picture'}
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{ backgroundColor: bg, color: ink }}
    >
      {initials(name) || '?'}
    </div>
  );
}
