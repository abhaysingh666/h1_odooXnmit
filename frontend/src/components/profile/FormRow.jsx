import { cn } from '@/lib/utils';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

/**
 * The profile tabs are laid out as label-left forms (see the wireframes), and
 * every screen reuses the same row so the columns line up across tabs. A
 * colleague viewing someone else gets the identical layout with the controls
 * locked, which is what "view-only mode" means in the spec.
 */
export function FormRow({ label, htmlFor, hint, required, children, className }) {
  return (
    <div className={cn('grid gap-1.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start sm:gap-4', className)}>
      <Label htmlFor={htmlFor} required={required} className="sm:pt-2.5">
        {label}
      </Label>
      <div className="min-w-0 space-y-1">
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function TextRow({ label, name, value, onChange, editable = true, hint, ...props }) {
  const id = `field-${name}`;
  return (
    <FormRow label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange?.(name, event.target.value)}
        disabled={!editable}
        {...props}
      />
    </FormRow>
  );
}

export function SelectRow({
  label,
  name,
  value,
  onChange,
  options = [],
  editable = true,
  placeholder = 'Not set',
  hint,
}) {
  const id = `field-${name}`;
  return (
    <FormRow label={label} htmlFor={id} hint={hint}>
      <Select
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange?.(name, event.target.value)}
        disabled={!editable}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormRow>
  );
}

export function TextareaRow({ label, name, value, onChange, editable = true, hint, ...props }) {
  const id = `field-${name}`;
  return (
    <FormRow label={label} htmlFor={id} hint={hint}>
      <Textarea
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange?.(name, event.target.value)}
        disabled={!editable}
        {...props}
      />
    </FormRow>
  );
}
