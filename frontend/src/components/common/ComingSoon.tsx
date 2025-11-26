import { toast } from '@/hooks/use-toast';
import { Button, ButtonProps } from '@/components/ui/button';

export function comingSoonAction() {
  toast({ 
    title: "Coming soon", 
    description: "This feature is under development. Launching soon." 
  });
}

interface ComingSoonButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const ComingSoonButton = ({ children, disabled = true, ...rest }: ComingSoonButtonProps) => (
  <Button {...rest} disabled onClick={comingSoonAction}>
    {children}
  </Button>
);
