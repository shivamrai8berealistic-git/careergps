import { getPublicProfile } from '@/actions/proof-builder-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, PlayCircle, Briefcase, ExternalLink, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // optionally cache for 60 seconds

export default async function PublicProofPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const data = await getPublicProfile(slug);
  
  if (!data.success || !data.profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-bold font-headline mb-2">Profile Unavailable</h1>
        <p className="text-muted-foreground text-center">This profile does not exist or has been set to private.</p>
        <Link href="/" className="mt-8 text-primary hover:underline">
          Return to Career Pilot AI
        </Link>
      </div>
    );
  }

  const { profile, proofItems } = data;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        
        <header className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary text-2xl font-bold font-headline">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center justify-center gap-2">
              {profile.fullName}
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified Identity
              </Badge>
            </h1>
            <p className="text-muted-foreground text-lg mt-1">{profile.headline}</p>
          </div>
          
        </header>

        <div className="space-y-6 pt-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Career Proof & Projects
            </h2>
            <span className="text-sm font-medium text-muted-foreground">{proofItems?.length || 0} Items</span>
          </div>

          {!proofItems || proofItems.length === 0 ? (
            <Card className="bg-white border-dashed shadow-sm">
              <CardContent className="p-12 text-center text-muted-foreground">
                This user has not published any proof items yet.
              </CardContent>
            </Card>
          ) : (
            proofItems.map((item: any) => (
              <Card key={item.id} className="bg-white shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`h-1 w-full ${
                  item.status === 'complete' ? 'bg-green-500' :
                  item.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs uppercase tracking-wider">{item.projectType.replace('_', ' ')}</Badge>
                        <Badge variant="secondary" className="text-xs uppercase tracking-wider bg-slate-100">
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 shrink-0">
                      {item.githubUrl && (
                        <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      )}
                      {item.liveDemoUrl && (
                        <a href={item.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <PlayCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Project Overview</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                    
                    {item.relevanceToTarget && (
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">What this proves</h4>
                        <p className="text-sm text-blue-800/90 leading-relaxed">{item.relevanceToTarget}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <footer className="py-8 text-center text-sm text-muted-foreground border-t bg-white mt-12">
        Powered by <Link href="/" className="font-bold text-primary hover:underline">Career Pilot AI</Link> — The Career GPS
      </footer>
    </div>
  );
}
