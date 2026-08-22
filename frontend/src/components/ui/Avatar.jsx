import { initials } from '../../utils/formatters';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const PALETTE = [
  ['#0F4C46', '#E1EDEA'],
  ['#8F631F', '#F6ECD9'],
  ['#3560C9', '#E4EAFA'],
  ['#B3402F', '#F6E4E0'],
  ['#5C6460', '#EFEEE7'],
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
