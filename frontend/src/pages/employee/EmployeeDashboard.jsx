import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { User, Calendar, Clock, FileText, LayoutDashboard, DollarSign, Users, Settings } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { firstName } from '@/lib/utils';
import { CheckInWidget } from '@/components/CheckInWidget';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'My Profile',
      description: 'View and edit your personal information',
      icon: User,
      color: 'bg-primary/10 text-primary',
      onClick: () => navigate('/profile'),
    },
    {
      title: 'Attendance',
      description: 'Check-in/out and view attendance records',
      icon: Clock,
      color: 'bg-accent/10 text-accent',
      onClick: () => navigate('/attendance'),
    },
    {
      title: 'Time Off',
      description: 'Apply for leave and check balance',
      icon: Calendar,
      color: 'bg-secondary/10 text-secondary',
      onClick: () => navigate('/time-off'),
    },
    {
      title: 'Payroll',
      description: 'View salary structure and payslips',
      icon: DollarSign,
      color: 'bg-chart-3/10 text-chart-3',
      onClick: () => navigate('/payroll'),
    },
    {
      title: 'Employee Directory',
      description: 'Browse company employees',
      icon: Users,
      color: 'bg-chart-4/10 text-chart-4',
      onClick: () => navigate('/employees'),
    },
    {
      title: 'Reports',
      description: 'Download salary slips and reports',
      icon: FileText,
      color: 'bg-chart-5/10 text-chart-5',
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back, ${firstName(user?.name) || 'there'}!`}
        description="Your personal workspace for attendance, leave requests, and profile management."
      />

      {/* Check-in Widget */}
      <CheckInWidget />

      {/* Profile Summary Card */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Login ID</p>
            <p className="font-medium font-mono text-sm">{user?.login_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{user?.company_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{user?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium">{user?.department || '—'}</p>
          </div>
          {user?.designation && (
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{user?.designation}</p>
            </div>
          )}
        </CardContent>
        <div className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <Settings className="size-4" />
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Card
              key={action.title}
              className="animate-fade-up stagger cursor-pointer hover:shadow-lg transition-all"
              style={{ '--i': index + 1 }}
              onClick={action.onClick}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-xs">{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
