import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, LogOut, ChevronDown } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useOnClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const close = () => setIsOpen(false);

  const handleProfile = () => {
    close();
    navigate('/profile');
  };

  const handleLogout = async () => {
    close();
    await logout();
    toast.info('You have been logged out.');
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open account menu for ${user.name}`}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" />
        <ChevronDown
          size={15}
          className={`text-[var(--color-ink-faint)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account menu"
          className="animate-pop-in absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-[var(--color-line)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--color-ink-faint)]">{user.email}</p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-left text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <UserRound size={16} className="text-[var(--color-ink-soft)]" />
              My Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
