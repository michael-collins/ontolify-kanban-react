import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(({ 
  children, 
  isLoading, 
  icon, 
  className,
  variant = 'default',
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn('gap-2', className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon}
      {children}
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';

export { ActionButton };