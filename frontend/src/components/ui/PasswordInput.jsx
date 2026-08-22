import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './Input';
import { Button } from './Button';

/** Password field with a reveal toggle. */
export const PasswordInput = forwardRef(function PasswordInput(
  { className, showIcon = true, icon = Lock, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      icon={showIcon ? icon : undefined}
      autoComplete={props.autoComplete ?? 'current-password'}
      className={cn(className)}
      trailing={
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      }
      {...props}
    />
  );
});
