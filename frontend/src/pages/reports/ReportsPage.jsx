import { useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

/**
 * Reports & Analytics page
 * 
 * Generates and downloads various reports:
 * - Salary slips (monthly payroll)
 * - Attendance reports (daily/monthly)
 * - Leave reports
 */
export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('payroll');

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description={
          isAdmin
            ? 'Generate and download reports for payroll, attendance, and leave management.'
            : 'Access your salary slips and attendance reports.'
        }
        icon={BarChart3}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="payroll">Salary Slips</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
          {isAdmin && <TabsTrigger value="leave">Leave Reports</TabsTrigger>}
        </TabsList>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Salary Slip Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReportCard
                  title="My Salary Slips"
                  description="Download your monthly salary slips"
                  icon={FileText}
                  onDownload={() => console.log('Download my payslips')}
                />
                {isAdmin && (
                  <ReportCard
                    title="All Employee Payslips"
                    description="Generate payslips for all employees"
                    icon={FileText}
                    onDownload={() => console.log('Download all payslips')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReportCard
                  title="My Attendance"
                  description="Download your attendance records"
                  icon={FileText}
                  onDownload={() => console.log('Download my attendance')}
                />
                {isAdmin && (
                  <>
                    <ReportCard
                      title="Daily Attendance"
                      description="Today's attendance for all employees"
                      icon={FileText}
                      onDownload={() => console.log('Download daily attendance')}
                    />
                    <ReportCard
                      title="Monthly Attendance"
                      description="Monthly attendance summary"
                      icon={FileText}
                      onDownload={() => console.log('Download monthly attendance')}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="leave">
            <Card>
              <CardHeader>
                <CardTitle>Leave Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReportCard
                    title="Leave Summary"
                    description="Overall leave statistics"
                    icon={FileText}
                    onDownload={() => console.log('Download leave summary')}
                  />
                  <ReportCard
                    title="Leave Balance Report"
                    description="Employee leave balances"
                    icon={FileText}
                    onDownload={() => console.log('Download leave balances')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

function ReportCard({ title, description, icon: Icon, onDownload }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button size="sm" onClick={onDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
