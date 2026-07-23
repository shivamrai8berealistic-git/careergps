import Link from "next/link";
import { Rocket } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-50/50 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 lg:gap-16 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="font-headline font-bold text-xl tracking-tight">CareerPilot AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The world's first AI Career GPS. Navigate from where you are to where you want to be.
            </p>
            <div className="flex gap-3">
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
               </a>
               <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
               </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/signup" className="hover:text-primary transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Free Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/ats-scan" className="hover:text-primary transition-colors">Free ATS Scan</Link></li>
              <li><Link href="/tools/resume-rewrite" className="hover:text-primary transition-colors">Resume Rewriter</Link></li>
              <li><Link href="/tools/cover-letter" className="hover:text-primary transition-colors">Cover Letter Generator</Link></li>
              <li><Link href="/tools/salary-check" className="hover:text-primary transition-colors">Salary Insights</Link></li>
              <li><Link href="/tools/interview-practice" className="hover:text-primary transition-colors">Mock Interview</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/support" className="hover:text-primary transition-colors">Help Center & FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 border-t border-slate-200 md:flex-row">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {currentYear} CareerPilot AI. India's favorite job copilot.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
             <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
