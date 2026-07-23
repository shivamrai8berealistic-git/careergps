'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Rocket } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!isUserLoading && user) {
      console.log("[Auth Flow] User detected, redirecting to /dashboard");
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    console.log("[Auth Flow] User clicked Google Sign-In");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      console.log("[Auth Flow] Opening Google sign-in popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("[Auth Flow] Google sign-in successful! UID:", result.user.uid);
      toast.success('Signed in successfully!');
      // Redirect is handled by the useEffect above when user state updates
    } catch (error: any) {
      console.error("[Auth Flow] Google sign-in error:", error);
      // Don't show error for user-closed popup
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast.error(error.message || 'Failed to sign in with Google');
      }
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      // Redirect is handled by the useEffect above when user state updates
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth state or if user is already logged in
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background space-y-4">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-r-primary/60 animate-[spin_1.5s_reverse_infinite]"></div>
          <Rocket className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground font-semibold animate-pulse tracking-widest uppercase">
            {isUserLoading ? "Loading Profile" : "Entering Dashboard"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      <Card className="w-full max-w-md shadow-xl border-primary/10 glass relative z-10">
        <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
            </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline text-center">CareerPilot AI</CardTitle>
            <CardDescription className="text-muted-foreground text-sm text-center">
                {isSignUp ? 'Create an account to start your journey' : 'Sign in to access your dashboard'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-300 text-sm font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-background/40 border-primary/10 h-11 focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-background/40 border-primary/10 h-11 focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/20 transition-all rounded-lg mt-2" type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 text-center text-sm text-muted-foreground pt-2">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-bold hover:underline underline-offset-4"
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
          {!isSignUp && (
            <Link href="/forgot-password" title="Forgot Password" className="text-xs hover:text-foreground transition-colors">
              Forgot your password?
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
