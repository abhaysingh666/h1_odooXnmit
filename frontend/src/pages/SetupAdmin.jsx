import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Rocket, ServerCog, ShieldCheck, Terminal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { AuthHeading, AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CopyField } from '@/components/ui/CopyField';

const HIGHLIGHTS = [
  {
    icon: ServerCog,
    title: 'Reads your backend .env',
    description:
      'The first administrator is created from FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD, FIRST_ADMIN_NAME and FIRST_ADMIN_COMPANY.',
  },
  {
    icon: ShieldCheck,
    title: 'Runs exactly once',
    description: 'Once any administrator exists, this endpoint refuses to create another.',
  },
  {
    icon: Terminal,
    title: 'Then invite your team',
    description: 'Everyone else is provisioned from the admin panel — there is no public sign-up.',
  },
];

/**
 * First-run screen for POST /api/auth/bootstrap-admin. The backend takes all
 * credentials from its own environment, so there is nothing to fill in here.
 */
export default function SetupAdmin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const { bootstrapAdmin } = useAuth();
  const navigate = useNavigate();

  const handleBootstrap = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await bootstrapAdmin();
      setCreated(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the first administrator.'));
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <AuthLayout
        panelTitle="Your workspace is live."
        panelSubtitle="You are signed in as the first administrator. Next, create accounts for your team."
        highlights={HIGHLIGHTS}
      >
        <AuthHeading
          icon={Rocket}
          title="Administrator created"
          description="Save this Login ID — it is how you sign in from now on."
        />

        <div className="space-y-4">
          <CopyField label="Your Login ID" value={created.user?.login_id ?? '—'} />

          <Alert tone="success" title="You're signed in">
            {created.message}
          </Alert>

          <Button size="lg" className="w-full" onClick={() => navigate('/admin/dashboard', { replace: true })}>
            Go to admin dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      panelTitle="Let's set up your workspace."
      panelSubtitle="Dayflow has no public sign-up. Create the first administrator here, then provision everyone else from the admin panel."
      highlights={HIGHLIGHTS}
      footer={
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthHeading
        icon={ServerCog}
        title="First-run setup"
        description="This creates one administrator using the credentials in your backend environment file."
      />

      <div className="space-y-5">
        <Alert tone="info" title="Nothing to type" icon={Info}>
          The backend reads the admin's name, email, password and company straight from{' '}
          <code className="font-mono text-[0.8125rem]">backend/.env</code>. Change them there before
          running this if you haven't already.
        </Alert>

        <ul className="space-y-2.5 rounded-lg border border-border bg-muted/35 p-4 text-xs">
          {[
            'FIRST_ADMIN_EMAIL',
            'FIRST_ADMIN_PASSWORD',
            'FIRST_ADMIN_NAME',
            'FIRST_ADMIN_COMPANY',
          ].map((key) => (
            <li key={key} className="flex items-center gap-2 font-mono text-muted-foreground">
              <span className="size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {key}
            </li>
          ))}
        </ul>

        {error && (
          <Alert tone="error" title="Setup could not continue">
            {error}
          </Alert>
        )}

        <Button size="lg" className="w-full" loading={loading} onClick={handleBootstrap}>
          {loading ? 'Creating administrator…' : 'Create first administrator'}
          {!loading && <Rocket />}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          If an administrator already exists this will fail safely and tell you the existing Login
          ID — nothing is overwritten.
        </p>
      </div>
    </AuthLayout>
  );
}
