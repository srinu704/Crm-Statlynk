import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Mail, Phone, FileText, Linkedin, 
  LogOut, Shield, User, Bell, ChevronRight, Menu, X, Activity, MessageSquare
} from 'lucide-react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LeadManagement from './components/LeadManagement';
import AIEmailGenerator from './components/AIEmailGenerator';
import AICallScript from './components/AICallScript';
import ProposalGenerator from './components/ProposalGenerator';
import LinkedInGenerator from './components/LinkedInGenerator';
import StatLynkLogo from './components/StatLynkLogo';
import { Lead } from './types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales';
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('statlynk_crm_token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'email' | 'script' | 'proposal' | 'linkedin'>('dashboard');
  const [selectedLeadForGenerator, setSelectedLeadForGenerator] = useState<Lead | null>(null);
  const [selectedLeadIdForManagement, setSelectedLeadIdForManagement] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      validateSession();
    }
  }, [token]);

  const validateSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLoginSuccess = (newToken: string, loggedUser: UserInfo) => {
    localStorage.setItem('statlynk_crm_token', newToken);
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab('dashboard');
    addToast(`Mission-Secure Logged in. Welcome back Pilot ${loggedUser.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('statlynk_crm_token');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Navigations triggered from items inside views
  const handleNavigateToLeads = (leadId?: string, openGeneratorTab?: string) => {
    setSelectedLeadIdForManagement(leadId);
    setActiveTab('leads');
    if (leadId && openGeneratorTab) {
      // Find lead details in management child component
    }
  };

  const handleNavigateToGenerators = (tab: string, lead: Lead) => {
    setSelectedLeadForGenerator(lead);
    setActiveTab(tab as any);
    addToast(`Draft parameters preselected for lead '${lead.companyName}'`, 'success');
  };

  const handleTriggerEmailQuick = (lead: Lead) => {
    setSelectedLeadForGenerator(lead);
    setActiveTab('email');
  };

  const handleTriggerScriptQuick = (lead: Lead) => {
    setSelectedLeadForGenerator(lead);
    setActiveTab('script');
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: BarChart3 },
    { id: 'leads', label: 'Lead Ledger', icon: Users },
    { id: 'email', label: 'AI Email Personalizer', icon: Mail },
    { id: 'script', label: 'AI Call Playbook', icon: Phone },
    { id: 'proposal', label: 'Proposal Room', icon: FileText },
    { id: 'linkedin', label: 'LinkedIn Pipelines', icon: Linkedin },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans" id="statlynk-app-root">
      
      {/* Toast notifications portal */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none" id="toasts-drawer">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-2 backdrop-blur-xl animate-scale-up pointer-events-auto transition duration-300 ${
              toast.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300 animate-fade-in' 
                : 'bg-red-950/95 border-red-500/30 text-red-300 animate-fade-in'
            }`}
          >
            {toast.type === 'success' ? (
              <Shield className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-xs font-medium leading-normal">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Main Corporate Header */}
      <header className="bg-white border-b border-slate-200 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between text-slate-900" id="app-header">
        
        {/* Left identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1 px-2 border border-slate-200 rounded-lg lg:hidden hover:bg-slate-50 cursor-pointer"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <StatLynkLogo mode="icon" size={32} className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 shadow-sm" />
            <div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-none uppercase font-mono">StatLynk Solutions</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">Outreach CRM Operations</p>
            </div>
          </div>
        </div>

        {/* Right Session dossier info */}
        <div className="flex items-center gap-4">
          
          {/* Active status */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-mono leading-none">ACTIVE OUTREACH SPECIALIST</div>
              <div className="text-xs font-bold text-slate-800 leading-none mt-1">{user.name}</div>
            </div>
            <div className="text-[9px] text-sky-700 bg-sky-50 font-mono px-2 py-0.5 rounded leading-none uppercase ml-2 select-none border border-sky-200">
              {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-500 rounded-xl hover:bg-red-50 transition cursor-pointer"
            title="Log out from Outreach Operations"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* Primary Workspace screen */}
      <div className="flex-1 flex" id="workspace-layout">
        
        {/* Navigation Sidebar (Drawer on mobile, list on desktop) */}
        <aside className={`bg-slate-900 border-r border-slate-800 lg:block fixed lg:sticky top-[64px] h-[calc(100vh-64px)] z-30 transition-all duration-300 shadow-xl p-4 flex flex-col justify-between ${
          mobileMenuOpen ? 'w-[260px] left-0 bg-slate-900' : 'w-0 lg:w-[260px] lg:left-0 -left-[260px]'
        }`} id="navigation-sidebar">
          
          <div className="space-y-6">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-2 leading-none">
              CRM NAVIGATION
            </span>
            
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 text-xs font-semibold cursor-pointer border justify-start transition ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/5 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* SLA banner footer inside menu */}
          <div className="space-y-3">
            <div className="p-3 bg-[#111928]/40 border border-slate-800/60 rounded-xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400 animate-pulse flex-shrink-0" />
              <div className="text-left">
                <span className="text-[9px] text-slate-500 font-mono uppercase block leading-none">SYSTEM TELEMETRY</span>
                <span className="text-[10px] text-slate-300 font-mono mt-1 font-bold leading-none block">SLA HEALTH 100%</span>
              </div>
            </div>

            {/* Official Directory Card */}
            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-left">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">OFFICIAL SUPPORT CONTACTS</span>
              
              <div className="flex items-center gap-2 text-[10.5px] text-slate-300 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <a href="tel:+917014265717" className="font-mono font-bold">+91 7014265717</a>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800/50">
                <span className="text-[8px] text-slate-500 font-mono uppercase block">AUTHORIZED CORRESPONDENCE</span>
                <div className="space-y-1 font-mono text-[9.5px] text-slate-400 max-w-full">
                  <div className="flex items-center gap-1.5 hover:text-sky-300 transition shrink-0">
                    <Mail className="w-3 h-3 text-sky-500 flex-shrink-0" />
                    <a href="mailto:info@statlynksolutions.com" className="truncate block" title="info@statlynksolutions.com">info@statlynksolutions.com</a>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-sky-300 transition shrink-0">
                    <Mail className="w-3 h-3 text-sky-500 flex-shrink-0" />
                    <a href="mailto:srinivasaraop@statlynksolutions.com" className="truncate block" title="srinivasaraop@statlynksolutions.com">srinivasaraop@statlynksolutions.com</a>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-sky-300 transition shrink-0">
                    <Mail className="w-3 h-3 text-sky-500 flex-shrink-0" />
                    <a href="mailto:srinivasarao.p230883@gmail.com" className="truncate block" title="srinivasarao.p230883@gmail.com">srinivasarao.p230883@gmail.com</a>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-sky-300 transition shrink-0">
                    <Mail className="w-3 h-3 text-sky-500 flex-shrink-0" />
                    <a href="mailto:statlynksolutions@gmail.com" className="truncate block" title="statlynksolutions@gmail.com">statlynksolutions@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* Content canvas (Scroll board) */}
        <main className="flex-1 p-6 overflow-x-hidden" id="workspace-canvas">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Context breadcrumb info */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="text-left">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider leading-none">Operational Workspace / outreach</div>
                <h2 className="text-lg font-bold text-slate-800 mt-1.5 leading-none uppercase font-mono tracking-wide">
                  {activeTab === 'dashboard' && 'Command Center Operations'}
                  {activeTab === 'leads' && 'Global CRM Leads Ledger'}
                  {activeTab === 'email' && 'Gemini Outreach Email Generator'}
                  {activeTab === 'script' && 'Interactive Calling Playbooks'}
                  {activeTab === 'proposal' && 'Commercial SLA Proposal Room'}
                  {activeTab === 'linkedin' && 'Thought Leadership Pipelines'}
                </h2>
              </div>
            </div>

            {/* Render Tab Views */}
            {activeTab === 'dashboard' && (
              <Dashboard 
                token={token} 
                onNavigateToLeads={handleNavigateToLeads}
                onTriggerEmailQuick={handleTriggerEmailQuick}
                onTriggerScriptQuick={handleTriggerScriptQuick}
              />
            )}

            {activeTab === 'leads' && (
              <LeadManagement 
                token={token}
                selectedLeadId={selectedLeadIdForManagement}
                onNavigateToGenerators={handleNavigateToGenerators}
                onAddMessage={addToast}
              />
            )}

            {activeTab === 'email' && (
              <AIEmailGenerator 
                token={token}
                presetLead={selectedLeadForGenerator}
                onAddMessage={addToast}
              />
            )}

            {activeTab === 'script' && (
              <AICallScript 
                token={token}
                presetLead={selectedLeadForGenerator}
                onAddMessage={addToast}
              />
            )}

            {activeTab === 'proposal' && (
              <ProposalGenerator 
                token={token}
                presetLead={selectedLeadForGenerator}
                onAddMessage={addToast}
              />
            )}

            {activeTab === 'linkedin' && (
              <LinkedInGenerator 
                token={token}
                onAddMessage={addToast}
              />
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
