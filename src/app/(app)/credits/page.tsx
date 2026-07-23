'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, ArrowUpRight, ArrowDownRight, History, Sparkles } from 'lucide-react';
import { useUserUsage } from '@/hooks/useJobs';
import Link from 'next/link';

export default function CreditsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { usage: wallet, plan, isLoading: isWalletLoading } = useUserUsage();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const txQuery = query(
      collection(firestore, 'users', user.uid, 'transactions'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(txQuery, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txData);
      setIsTxLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  if (isWalletLoading || isTxLoading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Loading your wallet...</p>
      </div>
    );
  }

  const balance = wallet?.balance || 0;
  const lifetimeEarned = wallet?.lifetimeEarned || 0;
  const lifetimeSpent = wallet?.lifetimeSpent || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-headline text-primary tracking-tight">
            Credit Wallet
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage your AI credits and view your transaction history.</p>
        </div>
        <div className="flex gap-3">
          {plan === 'free' && (
            <Link href="/pricing" passHref>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg border-none">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-primary/5 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="h-8 w-8 text-primary" />
                  <h3 className="text-4xl font-bold tracking-tight text-primary">{balance}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lifetime Earned</p>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowDownRight className="h-6 w-6 text-green-500" />
                  <h3 className="text-2xl font-bold tracking-tight">{lifetimeEarned}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lifetime Spent</p>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowUpRight className="h-6 w-6 text-red-500" />
                  <h3 className="text-2xl font-bold tracking-tight">{lifetimeSpent}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ways to earn */}
      {plan === 'free' && (
         <Card className="border-primary/5 bg-blue-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Ways to earn more credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span>Complete your profile to 80%</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">+5 Credits</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Upload a new resume version</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">+3 Credits</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Monthly Free Recharge</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">+5 Credits</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction Ledger
          </CardTitle>
          <CardDescription>A complete history of your credit earnings and spending.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-primary/5">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.direction === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.direction === 'credit' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{tx.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${tx.direction === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{tx.amount}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground italic">
                No transactions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
