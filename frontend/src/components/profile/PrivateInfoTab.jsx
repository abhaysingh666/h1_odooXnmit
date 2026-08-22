import { Landmark, Lock, ShieldCheck, UserRound } from 'lucide-react';

import { GENDERS, MARITAL_STATUSES } from '@/lib/hrms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SelectRow, TextRow, TextareaRow } from './FormRow';

/**
 * Private Info tab.
 *
 * Personal details are self-service; the bank and statutory block underneath is
 * HR-only because payroll pays out against it.
 */
export function PrivateInfoTab({ form, setField, editable, canEditAll }) {
  const private_ = form.private ?? {};

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" aria-hidden="true" />
            Personal details
          </CardTitle>
          <CardDescription>Visible to you and your HR team only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextRow
            label="Date of Birth"
            name="private.date_of_birth"
            type="date"
            value={private_.date_of_birth}
            onChange={setField}
            editable={editable}
          />
          <TextareaRow
            label="Residing Address"
            name="private.residing_address"
            value={private_.residing_address}
            onChange={setField}
            editable={editable}
            rows={3}
            maxLength={300}
            placeholder="Flat, street, city, postcode"
          />
          <TextRow
            label="Nationality"
            name="private.nationality"
            value={private_.nationality}
            onChange={setField}
            editable={editable}
            maxLength={60}
          />
          <TextRow
            label="Personal Email"
            name="private.personal_email"
            type="email"
            value={private_.personal_email}
            onChange={setField}
            editable={editable}
            placeholder="you@example.com"
          />
          <SelectRow
            label="Gender"
            name="private.gender"
            value={private_.gender}
            onChange={setField}
            options={GENDERS}
            editable={editable}
          />
          <SelectRow
            label="Marital Status"
            name="private.marital_status"
            value={private_.marital_status}
            onChange={setField}
            options={MARITAL_STATUSES}
            editable={editable}
          />
          <TextRow
            label="Date of Joining"
            name="date_of_joining"
            type="date"
            value={form.date_of_joining}
            onChange={setField}
            editable={canEditAll}
            hint={canEditAll ? undefined : 'Set by HR — it feeds your Login ID and leave accrual.'}
          />
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-primary" aria-hidden="true" />
              Bank Details
            </CardTitle>
            <CardDescription>
              {canEditAll
                ? 'Salary is credited to this account.'
                : 'Ask HR to update these — payroll pays out against them.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextRow
              label="Account Number"
              name="private.account_number"
              value={private_.account_number}
              onChange={setField}
              editable={canEditAll}
              maxLength={30}
              className="font-mono"
            />
            <TextRow
              label="Bank Name"
              name="private.bank_name"
              value={private_.bank_name}
              onChange={setField}
              editable={canEditAll}
              maxLength={100}
            />
            <TextRow
              label="IFSC Code"
              name="private.ifsc_code"
              value={private_.ifsc_code}
              onChange={setField}
              editable={canEditAll}
              maxLength={20}
            />
            <TextRow
              label="PAN No"
              name="private.pan_no"
              value={private_.pan_no}
              onChange={setField}
              editable={canEditAll}
              maxLength={20}
            />
            <TextRow
              label="UAN No"
              name="private.uan_no"
              value={private_.uan_no}
              onChange={setField}
              editable={canEditAll}
              maxLength={20}
              hint="Universal Account Number for provident fund."
            />
            <TextRow
              label="ESIC / Resp Code"
              name="private.esic_no"
              value={private_.esic_no}
              onChange={setField}
              editable={canEditAll}
              maxLength={20}
            />

            {!canEditAll && (
              <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                Statutory and bank fields are locked to HR.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Emergency contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextRow
              label="Name"
              name="private.emergency_contact_name"
              value={private_.emergency_contact_name}
              onChange={setField}
              editable={editable}
              maxLength={100}
            />
            <TextRow
              label="Phone"
              name="private.emergency_contact_phone"
              value={private_.emergency_contact_phone}
              onChange={setField}
              editable={editable}
              maxLength={20}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
