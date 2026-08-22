import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * The "+ Add Skills" / "+ Add Certification" panels on the résumé tab.
 *
 * Values are plain strings; duplicates are dropped here as well as on the server
 * so the chip list never shows the same skill twice.
 */
export function TagListEditor({
  values = [],
  onChange,
  editable = false,
  placeholder = 'Add an item…',
  addLabel = 'Add',
  emptyLabel = 'Nothing added yet.',
  className,
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim().slice(0, 60);
    if (!value) return;
    const exists = values.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...values, value]);
    setDraft('');
  }

  function remove(index) {
    onChange(values.filter((_, position) => position !== index));
  }

  return (
    <div className={cn('space-y-3', className)}>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Badge key={`${value}-${index}`} variant="subtle" className="gap-1.5 py-1 pl-2.5 pr-1.5">
              {value}
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="grid size-4 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive"
                  aria-label={`Remove ${value}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}

      {editable && (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            maxLength={60}
          />
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
