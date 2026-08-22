import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

import { leaveAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { leaveType, plainDate } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Input';
import { DetailRow } from '@/components/PageHeader';
import { useToast } from '@/components/ui/Toast';

/**
 * Approve or reject one request, with an optional comment the employee sees on
 * their own list. The decision takes effect immediately: approving a request
 * marks those days as leave in attendance.
 */
export function LeaveReviewDialog({ open, request, action, onClose, onReviewed }) {
  const { success, error: notifyError } = useToast();
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setComment('');
    setError('');
  }, [open, request?._id]);

  if (!request) return null;

  const approving = action === 'approve';
  const type = leaveType(request.leave_type);

  async function submit() {
    setSaving(true);
    setError('');
    try {
      const { data } = await leaveAPI.review(request._id, {
        action,
        comment: comment.trim() || null,
      });
      success(
        approving ? 'Request approved' : 'Request rejected',
        `${request.employee_name} — ${data.days} day(s) of ${type.label}.`
      );
      onReviewed?.(data);
    } catch (err) {
      const message = errorMessage(err, 'Could not record the decision.');
      setError(message);
      notifyError('Review failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={approving ? `Approve ${request.employee_name}'s time off?` : `Reject ${request.employee_name}'s request?`}
      description={
        approving
          ? 'The days are marked as leave in attendance straight away and the balance is consumed.'
          : 'The days are released back into their balance. A short reason helps them plan.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={approving ? 'default' : 'destructive'}
            onClick={submit}
            loading={saving}
            className={approving ? 'bg-chart-3 text-white hover:bg-[color-mix(in_oklab,var(--chart-3)_88%,black)]' : undefined}
          >
            {approving ? <Check /> : <X />}
            {approving ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="divide-y divide-border/60 rounded-lg border border-border px-4">
          <DetailRow label="Time off type" value={type.label} />
          <DetailRow
            label="Period"
            value={`${plainDate(request.start_date)} → ${plainDate(request.end_date)}`}
          />
          <DetailRow label="Allocation" value={`${request.days} day(s)`} />
          {request.remarks && <DetailRow label="Remarks" value={request.remarks} />}
          {request.attachment_url && (
            <DetailRow label="Attachment">
              <a
                href={request.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                Open document
              </a>
            </DetailRow>
          )}
        </div>

        <Field
          label="Comment"
          htmlFor="review-comment"
          hint={approving ? 'Optional' : 'Recommended'}
        >
          <Textarea
            id="review-comment"
            rows={3}
            maxLength={500}
            value={comment}
            placeholder={
              approving
                ? 'Enjoy the break — hand over the Acme report before you go.'
                : 'We already have two people out that week; could you shift by a few days?'
            }
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
