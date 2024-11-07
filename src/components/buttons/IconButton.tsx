import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      className,
      variant = 'ghost',
      size = 'icon',
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'p-2',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          className
        )}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };