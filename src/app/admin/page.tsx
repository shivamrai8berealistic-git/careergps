'use client';

import { useUser, useFirestore } from '@/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Mail, User, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || !user) return;

    // Verify Admin Role
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsAdmin(true);
        fetchSubmissions();
      } else {
        setIsAdmin(false);
        setIsDataLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(firestore, 'contactSubmissions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  if (isUserLoading || isDataLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Authenticating Admin Access...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-6 bg-slate-50 px-4 text-center">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
            <h1 className="text-3xl font-bold font-headline">Access Restricted</h1>
            <p className="text-muted-foreground max-w-md">
                This area is reserved for CareerPilot AI administrators. If you believe this is an error, please contact the lead developer.
            </p>
        </div>
        <Link href="/dashboard">
            <Button size="lg">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Admin Panel</Badge>
                <span className="text-xs text-muted-foreground">Internal Operations</span>
            </div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">Platform Overview</h1>
            <p className="text-muted-foreground">Manage user inquiries and platform health.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost">Exit to App</Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{submissions.length}</div>
                    <p className="text-xs text-green-600 mt-1 font-medium">+12% from last week</p>
                </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground mt-1">Metrics coming soon</p>
                </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue (Pro)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground mt-1 tracking-tighter">Razorpay Sync Pending</p>
                </CardContent>
            </Card>
        </div>

        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    Recent Contact Submissions
                </h2>
                <Button variant="outline" size="sm" onClick={fetchSubmissions}>Refresh Data</Button>
            </div>
            
            <div className="grid gap-6">
                {submissions.length > 0 ? (
                    submissions.map((sub) => (
                        <Card key={sub.id} className="border-none shadow-md hover:shadow-lg transition-all">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none capitalize">{sub.subject}</Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-bold pt-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        {sub.name}
                                    </CardTitle>
                                    <div className="text-sm text-primary flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {sub.email}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 border-t border-slate-50 mt-4">
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border italic">
                                    "{sub.message}"
                                </p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                        <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">No submissions yet</h3>
                        <p className="text-muted-foreground">Inquiries from the Contact page will appear here.</p>
                    </div>
                )}
            </div>
        </section>
      </div>
    </div>
  );
}
