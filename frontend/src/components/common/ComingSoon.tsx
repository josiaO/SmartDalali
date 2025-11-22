import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

/**
 * Standard action for disabled features  
 * Shows "Coming soon" toast notification
 */
export function comingSoonAction() {
    toast.info('Coming Soon', {
        description: 'This feature is under development. Launching soon.',
    });
}

interface ComingSoonButtonProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Button component for disabled features
 * Always disabled, shows "Coming soon" toast on click
 */
export function ComingSoonButton({
    children,
    className,
    variant = 'default',
    size = 'default',
}: ComingSoonButtonProps) {
    return (
        <Button
            disabled
            variant={variant}
            size={size}
            className={className}
            onClick={(e) => {
                e.preventDefault();
                comingSoonAction();
            }}
        >
            {children}
        </Button>
    );
}
