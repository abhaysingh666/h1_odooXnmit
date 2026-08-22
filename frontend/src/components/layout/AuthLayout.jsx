import { cn } from '@/lib/utils';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';

/**
 * Split-screen frame for the unauthenticated screens (login, complete
 * registration, first-run setup). The left panel is decorative and hidden on
 * small viewports; the form owns the full width there.
 */
export function AuthLayout({ children, panelTitle, panelSubtitle, highlights = [], footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-10 lg:flex lg:flex-col xl:p-14">
        <AuroraBackdrop />

        <div className="relative z-10 flex flex-1 flex-col">
          <Logo size="lg" />

          <div className="my-auto max-w-lg space-y-6 py-10">
            <h2 className="text-balance font-serif text-4xl leading-[1.15] tracking-tight xl:text-[2.75rem]">
              {panelTitle}
            </h2>
            {panelSubtitle && (
              <p className="text-pretty text-base leading-relaxed text-muted-foreground">
                {panelSubtitle}
              </p>
            )}

            {highlights.length > 0 && (
              <ul className="space-y-4 pt-2">
                {highlights.map((item, index) => (
                  <li
                    key={item.title}
                    className="flex animate-fade-up items-start gap-3.5 stagger"
                    style={{ '--i': index + 2 }}
                  >
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Accounts are provisioned by your HR administrator — Dayflow has no public sign-up.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <Logo size="sm" className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>

        {footer && (
          <div className="border-t border-border px-5 py-4 text-center sm:px-8">{footer}</div>
        )}
      </main>
    </div>
  );
}

/** Soft drifting colour wash built from the theme's own chart tokens. */
function AuroraBackdrop({ className }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute -left-24 -top-24 size-[26rem] animate-drift rounded-full bg-primary/25 blur-3xl" />
      <div
        className="absolute -bottom-32 -right-16 size-[24rem] animate-drift rounded-full bg-accent/30 blur-3xl"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute left-1/3 top-1/2 size-[18rem] animate-drift rounded-full bg-chart-5/20 blur-3xl"
        style={{ animationDelay: '-12s' }}
      />

      {/* Faint grid to keep the wash from feeling shapeless */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
    </div>
  );
}

/** Card header used inside the auth panel. */
export function AuthHeading({ title, description, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/12 text-primary ring-primary/15',
    accent: 'bg-accent/50 text-accent-foreground ring-accent/40',
    warning: 'bg-chart-4/25 text-[color-mix(in_oklab,var(--chart-4)_70%,var(--foreground))] ring-chart-4/30',
  };

  return (
    <div className="mb-7 space-y-3">
      {Icon && (
        <span className={cn('grid size-11 place-items-center rounded-xl ring-1', tones[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
