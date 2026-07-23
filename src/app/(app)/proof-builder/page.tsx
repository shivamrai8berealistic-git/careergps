'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Briefcase, ExternalLink, Eye, EyeOff, Loader2, PenLine, Plus, Save, Sparkles, Trash2, ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { getProofItems, saveProofItem, deleteProofItem, updatePublicSlug, ProofItem, pushProofToMasterResume } from '@/actions/proof-builder-actions';
import { fetchEmployerConfidence } from '@/actions/proof-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProofBuilderPage() {
  const { user, isUserLoading } = useUser();
  const [items, setItems] = useState<ProofItem[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [isSlugLoading, setIsSlugLoading] = useState(false);
  const router = useRouter();
  
  const [editingItem, setEditingItem] = useState<Partial<ProofItem> | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const [proofRes, itemsRes] = await Promise.all([
          fetchEmployerConfidence(token),
          getProofItems(token)
        ]);

        if (itemsRes.success) setItems(itemsRes.items);
        if (proofRes.success && proofRes.proof?.projectRecommendations) {
          setRecommendations(proofRes.proof.projectRecommendations);
        }
      } catch (error) {
        console.error("Failed to load proof data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSaveSlug = async () => {
    if (!user || !slug) return;
    setIsSlugLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await updatePublicSlug(token, slug);
      if (res.success) {
        toast.success(`Public URL updated to /p/${res.slug}`);
        setSlug(res.slug);
      } else {
        toast.error(res.error || 'Failed to update URL');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setIsSlugLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!user || !editingItem) return;
    try {
      const token = await user.getIdToken();
      const payload = {
        ...editingItem,
        title: editingItem.title || 'Untitled Project',
        projectType: editingItem.projectType || 'project',
        description: editingItem.description || '',
        relevanceToTarget: editingItem.relevanceToTarget || '',
        status: editingItem.status || 'in_progress',
        visibility: editingItem.visibility || 'public'
      };
      
      const res = await saveProofItem(token, payload);
      if (res.success) {
        toast.success('Project saved.');
        setEditingItem(null);
        // Reload items
        const newItemsRes = await getProofItems(token);
        if (newItemsRes.success) setItems(newItemsRes.items);
      }
    } catch (e) {
      toast.error('Failed to save project.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await deleteProofItem(token, id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Project removed.');
    } catch (e) {
      toast.error('Failed to remove project.');
    }
  };

  const handlePushToResume = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await pushProofToMasterResume(token, id);
      if (res.success) {
        toast.success('Successfully pushed to Master Resume!');
      } else {
        toast.error(res.error || 'Failed to push to Master Resume.');
      }
    } catch (e) {
      toast.error('An error occurred while syncing.');
    }
  };

  const addRecommendation = (rec: any) => {
    setEditingItem({
      title: rec.title,
      description: rec.problemSolved,
      relevanceToTarget: rec.relevanceToTarget,
      projectType: 'project',
      status: 'forthcoming',
      visibility: 'public'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading Proof Builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-in fade-in duration-500">
      
      <Button variant="ghost" className="text-muted-foreground -ml-4" onClick={() => router.push(`/dashboard`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 mt-2">
        <div>
          <h2 className="text-3xl font-bold font-headline">Career Proof Builder</h2>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Manage the projects, portfolios, and repos that prove you can solve real problems for employers.
          </p>
        </div>
        <div className="bg-muted/50 p-4 rounded-xl border max-w-xs w-full">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Your Public Proof Link</label>
          <div className="flex gap-2">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/p/</span>
              <Input 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
                className="pl-9 bg-background" 
                placeholder="username" 
              />
            </div>
            <Button onClick={handleSaveSlug} disabled={isSlugLoading || !slug.trim()}>
              {isSlugLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
          {slug && (
             <div className="flex items-center gap-4 mt-2">
               <p className="text-xs font-medium">
                 <Link href={`/p/${slug}`} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                   View Live Page <ExternalLink className="w-3 h-3" />
                 </Link>
               </p>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
                   toast.success('Link copied to clipboard!');
                 }}
                 className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
               >
                 Copy Link
               </button>
             </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Management */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-headline flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Your Proof Items
            </h3>
            <Button onClick={() => setEditingItem({})} variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Button>
          </div>

          {editingItem && (
            <Card className="border-primary/50 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">Edit Project Details</h4>
                  <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-sm font-semibold">Project Title</label>
                    <Input value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} placeholder="E.g., Automated Lead Tracker" />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-sm font-semibold">Type</label>
                    <Select value={editingItem.projectType || 'project'} onValueChange={v => setEditingItem({...editingItem, projectType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                        <SelectItem value="github_repo">GitHub Repo</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold">Problem Solved / Description</label>
                  <Textarea value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="What does this project do?" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Relevance to Target Role (Proof Value)</label>
                  <Textarea value={editingItem.relevanceToTarget || ''} onChange={e => setEditingItem({...editingItem, relevanceToTarget: e.target.value})} placeholder="Why should an employer care? E.g., 'Proves I can handle real-time data flow...'" className="min-h-[80px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Status</label>
                    <Select value={editingItem.status || 'in_progress'} onValueChange={v => setEditingItem({...editingItem, status: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="forthcoming">Forthcoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Visibility</label>
                    <Select value={editingItem.visibility || 'public'} onValueChange={v => setEditingItem({...editingItem, visibility: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public Page</SelectItem>
                        <SelectItem value="private">Private (Only Me)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">GitHub URL</label>
                    <Input value={editingItem.githubUrl || ''} onChange={e => setEditingItem({...editingItem, githubUrl: e.target.value})} placeholder="https://github.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Live Demo URL</label>
                    <Input value={editingItem.liveDemoUrl || ''} onChange={e => setEditingItem({...editingItem, liveDemoUrl: e.target.value})} placeholder="https://..." />
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={handleSaveItem}>
                  <Save className="w-4 h-4 mr-2" /> Save Proof Item
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {items.length === 0 && !editingItem ? (
              <EmptyState
                icon={<Briefcase className="h-6 w-6" />}
                title="No proof items yet"
                description="Add your first project or pick from the AI recommendations to start building your career proof."
                className="min-h-[250px]"
                action={
                  <Button onClick={() => setEditingItem({})} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Project
                  </Button>
                }
              />
            ) : (
              items.map(item => (
                <Card key={item.id} className="relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    item.status === 'complete' ? 'bg-green-500' :
                    item.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <CardContent className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs uppercase tracking-wider">{item.projectType.replace('_', ' ')}</Badge>
                          {item.visibility === 'public' ? (
                            <span className="text-xs text-green-600 flex items-center gap-1"><Eye className="w-3 h-3" /> Public</span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><EyeOff className="w-3 h-3" /> Private</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'complete' && (
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handlePushToResume(item.id!)}>
                            <Briefcase className="w-4 h-4 mr-1" /> To Resume
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteItem(item.id!)}><Trash className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{item.description}</p>
                    
                    {(item.githubUrl || item.liveDemoUrl) && (
                      <div className="flex gap-4 mt-4">
                        {item.githubUrl && <a href={item.githubUrl} target="_blank" className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><LinkIcon className="w-3 h-3" /> GitHub</a>}
                        {item.liveDemoUrl && <a href={item.liveDemoUrl} target="_blank" className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Live Demo</a>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI Recommendations */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold font-headline flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" /> AI Recommended Projects
          </h3>
          <p className="text-sm text-muted-foreground">Based on your Career Twin and Target Role gaps.</p>
          
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec, i) => (
              <Card key={i} className={`border-primary/10 bg-gradient-to-br from-primary/5 to-transparent ${rec.isPrimary ? 'border-primary/40 shadow-sm' : ''}`}>
                <CardHeader className="p-4 pb-2">
                  {rec.isPrimary && <Badge className="w-fit mb-2 bg-primary/20 text-primary hover:bg-primary/30">Highest ROI</Badge>}
                  <CardTitle className="text-base leading-tight">{rec.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.problemSolved}</p>
                  
                  <div className="p-2 bg-background/50 rounded text-xs border border-border/50">
                    <strong className="text-primary block mb-1">Proof Value:</strong>
                    {rec.relevanceToTarget}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold" onClick={() => addRecommendation(rec)}>
                    <Plus className="w-3 h-3 mr-1" /> Add to Portfolio
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card className="border-dashed bg-transparent p-6 text-center text-muted-foreground text-sm">
                No recommendations found. Ensure your Career Twin is up to date and you have set a target role.
              </Card>
            )}
          </div>
          
          {/* Quick Links */}
          <Card className="border-border mt-8">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-bold text-sm mb-2">Next Steps</h4>
              <Link href="/resume-builder">
                <Button variant="outline" size="sm" className="w-full text-xs bg-primary/5 hover:bg-primary/10 border-primary/20">
                  <Briefcase className="w-3 h-3 mr-2 text-primary" /> Update Resume
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
