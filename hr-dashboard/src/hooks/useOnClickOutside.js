import { useEffect } from 'react';

export function useOnClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    function handleClick(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    }

    function handleEscape(event) {
      if (event.key === 'Escape') handler(event);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, handler, active]);
}
