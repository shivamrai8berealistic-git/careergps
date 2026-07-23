import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SoftGateProps {
  isLocked: boolean;
  children: ReactNode;
  title?: string;
  description?: string;
  ctaText?: string;
}

export function SoftGate({ 
  isLocked, 
  children, 
  title = "Sign Up to Unlock", 
  description = "Create a free account to view the rest of this report, save your destination, and unlock your Career GPS.",
  ctaText = "Unlock Full Report"
}: SoftGateProps) {
  
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/10">
      {/* Blurred Content Container */}
      <div className="select-none pointer-events-none blur-sm opacity-60 transition-all duration-500">
        {children}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col items-center justify-end pb-12 px-6 text-center">
        <div className="bg-card shadow-2xl rounded-2xl p-6 max-w-md w-full border border-primary/20 animate-in slide-in-from-bottom-8 duration-700">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {description}
          </p>
          <Link href="/signup" passHref>
            <Button size="lg" className="w-full shadow-lg hover:scale-105 transition-transform">
              {ctaText}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Includes 20 free credits upon signup.
          </p>
        </div>
      </div>
    </div>
  );
}
