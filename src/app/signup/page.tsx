'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, ChevronLeft } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { SITE_CONFIG } from "@/lib/config";
import { processSignupReward } from '@/actions/credit-rewards';
import { convertGuestSession } from '@/actions/guest-handoff';

export default function SignupPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill out all fields.",
      });
      return;
    }

    if (!captchaToken && SITE_CONFIG.security.recaptchaSiteKey) {
        toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please complete the reCAPTCHA to proceed.",
        });
        return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Create the user profile document in Firestore
      const firestore = getFirestore(getApp());
      const profileDocRef = doc(firestore, 'users', newUser.uid, 'profile', 'main-profile');
      
      const newProfile = {
        id: profileDocRef.id,
        userId: newUser.uid,
        fullName: fullName,
        email: newUser.email,
        role: 'user', // Default role
        yearsOfExperience: 0,
        currentOrLastJobTitle: "",
        keySkills: [],
        workModePreference: "remote",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profileCompletenessScore: 20
      };
      
      // 3. Save the document
      await setDoc(profileDocRef, newProfile);
      
      // 4. Award signup credits
      try {
          const token = await newUser.getIdToken();
          await processSignupReward(token);
          
          const guestContext = sessionStorage.getItem('guestContext');
          const guestResume = sessionStorage.getItem('guestResume');
          const guestJob = sessionStorage.getItem('guestJob');
          
          if (guestContext) {
             const context = JSON.parse(guestContext);
             await convertGuestSession(token, guestResume || '', guestJob || '', context);
             sessionStorage.removeItem('guestContext');
          }
          // Note: We deliberately DO NOT remove guestResume and guestJob here.
          // The Onboarding flow relies on these being in sessionStorage to auto-skip steps.
          sessionStorage.removeItem('guestIntent');
      } catch (rewardError) {
          console.error("Failed to process signup reward or context:", rewardError);
      }

      toast({
        title: "Account Created!",
        description: "Welcome to CareerPilot AI. You will be redirected.",
      });
      // Redirection is handled by the useEffect hook

    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code) {
          switch (error.code) {
              case 'auth/email-already-in-use':
                  description = "An account with this email address already exists. Please login instead.";
                  break;
              case 'auth/weak-password':
                  description = "The password is too weak. It must be at least 6 characters long.";
                  break;
              case 'auth/invalid-email':
                  description = "The email address is not valid. Please check and try again.";
                  break;
          }
      }
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const firestore = getFirestore(getApp());
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const profileDocRef = doc(firestore, 'users', user.uid, 'profile', 'main-profile');
        const docSnap = await getDoc(profileDocRef);

        if (!docSnap.exists()) {
            // This is a new user, create their profile
            const newProfile = {
                id: profileDocRef.id,
                userId: user.uid,
                fullName: user.displayName || 'New User',
                email: user.email,
                role: 'user', // Default role
                yearsOfExperience: 0,
                currentOrLastJobTitle: "",
                keySkills: [],
                workModePreference: "remote",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                profileCompletenessScore: 20
            };
            await setDoc(profileDocRef, newProfile);
            
            // Award signup credits
            try {
                const token = await user.getIdToken();
                await processSignupReward(token);
                
                const guestContext = sessionStorage.getItem('guestContext');
                const guestResume = sessionStorage.getItem('guestResume');
                const guestJob = sessionStorage.getItem('guestJob');
                
                if (guestContext) {
                   const context = JSON.parse(guestContext);
                   await convertGuestSession(token, guestResume || '', guestJob || '', context);
                   sessionStorage.removeItem('guestContext');
                }
                // Note: We deliberately DO NOT remove guestResume and guestJob here.
                // The Onboarding flow relies on these being in sessionStorage.
                sessionStorage.removeItem('guestIntent');
            } catch (rewardError) {
                console.error("Failed to process signup reward or context:", rewardError);
            }

            toast({
                title: "Account Created!",
                description: "Welcome to CareerPilot AI.",
            });
        } else {
             toast({
                title: "Welcome Back!",
                description: "You've been successfully logged in.",
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message || "Could not sign in with Google. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };


  // Don't render the form if we are still checking auth state
  if (isUserLoading || user) {
    return null; 
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      <Card className="mx-auto max-w-sm w-full shadow-xl border-primary/10 glass relative z-10">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Get Started</CardTitle>
          <CardDescription className="text-sm">
            Join thousands of professionals using CareerPilot AI.
          </CardDescription>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mt-2 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full w-fit mx-auto">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input 
                  id="full-name" 
                  placeholder="Ada Lovelace" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/40 border-primary/10 h-11 focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary/30 transition-all duration-300"
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-background/40 border-primary/10 h-11 focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-background/40 border-primary/10 h-11 focus-visible:ring-2 focus-visible:ring-primary/50 hover:border-primary/30 transition-all duration-300"
              />
            </div>

            {SITE_CONFIG.security.recaptchaSiteKey && (
                <div className="flex justify-center pt-2">
                    <ReCAPTCHA
                        sitekey={SITE_CONFIG.security.recaptchaSiteKey}
                        onChange={onCaptchaChange}
                    />
                </div>
            )}

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/20 transition-all rounded-lg mt-2" disabled={isLoading || (!!SITE_CONFIG.security.recaptchaSiteKey && !captchaToken)}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or continue with Google</span>
            </div>
          </div>

          <Button variant="outline" className="w-full flex items-center justify-center gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-300 text-sm font-medium" type="button" onClick={handleGoogleSignup} disabled={isLoading}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
