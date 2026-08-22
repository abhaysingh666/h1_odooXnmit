import { useRef, useState } from 'react';
import { Building2, Upload } from 'lucide-react';

import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/ui/Toast';

/**
 * Company Settings Page
 * 
 * Allows admin to upload company logo
 */
export default function CompanySettings() {
  const { user, refreshUser } = useAuth();
  const { success, error: notifyError } = useToast();
  const fileInput = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WEBP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      await adminAPI.uploadLogo(file);
      success('Logo updated', 'Company logo has been updated successfully');
      await refreshUser();
    } catch (err) {
      notifyError('Upload failed', errorMessage(err, 'Could not upload logo'));
      setError(errorMessage(err, 'Could not upload logo'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={Building2}
        title="Company Settings"
        description="Manage your company logo and branding"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload a logo that appears on employee accounts and registration pages.
            Recommended size: 200x200px. Max size: 2MB.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Logo Preview */}
          {user?.company_logo_url && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Logo</p>
              <div className="inline-flex rounded-lg border border-border bg-muted/50 p-4">
                <img
                  src={user.company_logo_url}
                  alt={user.company_name}
                  className="h-24 w-24 object-contain"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="space-y-4">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUpload}
              className="sr-only"
            />
            
            <Button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              {uploading ? 'Uploading...' : user?.company_logo_url ? 'Change Logo' : 'Upload Logo'}
            </Button>

            <p className="text-xs text-muted-foreground">
              Supported formats: PNG, JPG, WEBP (Max 2MB)
            </p>
          </div>

          {error && (
            <Alert tone="error" title="Upload failed">
              {error}
            </Alert>
          )}

          {/* Company Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">Company Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company Name:</span>
                <span className="font-medium">{user?.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Employees:</span>
                <span className="font-medium">Check Directory page</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
