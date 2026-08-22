import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSE_KEY = 'dayflow-sidebar-collapsed';

/**
 * Authenticated app frame: fixed sidebar + sticky topbar + scrolling content.
 * The collapsed state is remembered across sessions.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Close the drawer and scroll to top whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'
        )}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl animate-fade-up space-y-6">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
          <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
            Dayflow HRMS · Every workday, perfectly aligned
          </p>
        </footer>
      </div>
    </div>
  );
}
