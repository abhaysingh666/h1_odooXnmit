import { useState } from 'react';
import { ShieldCheck, UserCog } from 'lucide-react';

import { adminAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/Toast';

/**
 * Roles & Access Management
 * 
 * Allows admin to promote employees to admin role
 */
export default function RolesAccess() {
  const { success, error: notifyError } = useToast();

  const [email, setEmail] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');

  async function handlePromote(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setPromoting(true);
    setError('');

    try {
      await adminAPI.promoteToAdmin(email.trim());
      success('Access granted', `${email} has been promoted to administrator`);
      setEmail('');
    } catch (err) {
      const msg = errorMessage(err, 'Could not promote user');
      notifyError('Promotion failed', msg);
      setError(msg);
    } finally {
      setPromoting(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Roles & Access"
        description="Manage administrator access and permissions"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="size-5" />
            Grant Admin Access
          </CardTitle>
          <CardDescription>
            Promote an existing employee to administrator by entering their email address.
            Admins can manage employees, approve leave requests, and access all HR features.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handlePromote} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Employee Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
                disabled={promoting}
              />
              <p className="text-xs text-muted-foreground">
                The employee must already exist in the system
              </p>
            </div>

            {error && (
              <Alert tone="error" title="Promotion failed">
                {error}
              </Alert>
            )}

            <Button type="submit" disabled={promoting}>
              <ShieldCheck className="size-4" />
              {promoting ? 'Promoting...' : 'Grant Admin Access'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Permission Info */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Permission Levels</CardTitle>
          <CardDescription>What each role can do in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Administrator
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Create and manage employee accounts</li>
                <li>• View and edit all employee profiles</li>
                <li>• Approve/reject leave requests</li>
                <li>• View all attendance records</li>
                <li>• Manage payroll and salary structures</li>
                <li>• Upload company logo</li>
                <li>• Promote other employees to admin</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 font-semibold">Employee</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• View and edit own profile (limited fields)</li>
                <li>• Check-in/Check-out for attendance</li>
                <li>• View own attendance records</li>
                <li>• Apply for leave</li>
                <li>• View own salary and payslips</li>
                <li>• Browse employee directory</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
