import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Copy, Check, Download, RefreshCw, FileCheck, ShieldAlert } from 'lucide-react';
import { Lead } from '../types';

interface ProposalGeneratorProps {
  token: string;
  presetLead: Lead | null;
  onAddMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function ProposalGenerator({ token, presetLead, onAddMessage }: ProposalGeneratorProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [companyName, setCompanyName] = useState('ABC Engineering');
  const [industry, setIndustry] = useState('Manufacturing');
  const [proposalType, setProposalType] = useState('IT Support Proposal');

  const [loading, setLoading] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const proposalTypes = [
    'IT Support Proposal', 
    'AWS Consulting Proposal', 
    'VAPT Proposal', 
    'Cloud Migration Proposal'
  ];

  const industries = ['Education', 'Manufacturing', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Other'];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (presetLead) {
      setSelectedLeadId(presetLead.id);
      setCompanyName(presetLead.companyName);
      setIndustry(presetLead.industry);
    }
  }, [presetLead]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const handleSelectLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    const found = leads.find(l => l.id === leadId);
    if (found) {
      setCompanyName(found.companyName);
      setIndustry(found.industry);
    }
  };

  const currentLead = leads.find(l => l.id === selectedLeadId) || presetLead;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setGeneratedProposal('');

      const response = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ companyName, industry, type: proposalType })
      });

      if (!response.ok) throw new Error("Proposal generation failed");

      const data = await response.json();
      setGeneratedProposal(data.result);

      // Log activity automatically in CRM dossier
      if (currentLead) {
        await fetch(`/api/leads/${currentLead.id}/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'proposal',
            description: `Generated customized pricing and roadmap proposal: '${proposalType}'.`
          }),
        });
      }

      onAddMessage("Custom commercial proposal compiled and registered.", 'success');
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedProposal);
    setCopied(true);
    onAddMessage("Proposal document copied to clipboard successfully.", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMockDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Create a markdown blob for client side download simulation!
      const blob = new Blob([generatedProposal], { type: 'text/markdown' });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `StatLynk_Proposal_${companyName.replace(/\s+/g, "_")}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setDownloading(false);
      onAddMessage("Proposal simulation download complete as styled Markdown file.", 'success');
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in" id="proposal-generator-root">
      
      {/* Scope parameter side screen (2/5 size) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 h-[72vh] flex flex-col justify-between" id="proposal-inputs">
        <div className="space-y-4">
          
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 rounded-xl border border-purple-200">
              <FileCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Commercial Proposal Room</h2>
              <p className="text-xs text-slate-500 font-medium">Generate high-tier IT specs & SLA commitments</p>
            </div>
          </div>

          {/* Target input hook */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">CRM Target Hook</label>
            <select
              value={selectedLeadId}
              onChange={(e) => handleSelectLeadChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="" className="bg-white text-slate-800">Load custom lead profile...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id} className="bg-white text-slate-800">{l.companyName} ({l.contactPerson})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Company Corporate Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Pragati Institutions"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Corporate Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind} className="bg-white text-slate-800">{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Scope Formula</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              >
                {proposalTypes.map(pr => (
                  <option key={pr} value={pr} className="bg-white text-slate-800">{pr}</option>
                ))}
              </select>
            </div>
          </div>

          {currentLead && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
              <span className="text-[9px] uppercase font-bold text-purple-600 font-mono tracking-wider block">Loaded CRM parameters</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{currentLead.companyName}</p>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-2">Notes: {currentLead.notes || 'None logged yet'}</p>
            </div>
          )}

        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
              Compiling comprehensive proposal details...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-200 fill-purple-200/20 animate-pulse" />
              Generate printable proposal
            </>
          )}
        </button>
      </div>

      {/* Corporate Letterboard (3/5 size) */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 h-[72vh] flex flex-col justify-between" id="proposals-letterhead">
        {generatedProposal ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-purple-50 border border-purple-205 text-purple-700 rounded">
                  Formatted scope pitch
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-1">Client: {companyName}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-605 text-xs font-bold hover:text-slate-900 hover:bg-slate-105 hover:border-slate-350 cursor-pointer flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Plain'}
                </button>
                <button
                  onClick={handleMockDownload}
                  disabled={downloading}
                  className="p-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-xs font-bold hover:bg-purple-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Downloading...' : 'Download .md'}
                </button>
              </div>
            </div>

            {/* Document display board simulating high-quality letterhead */}
            <div className="flex-1 overflow-y-auto mb-4 bg-white text-slate-950 p-8 rounded-xl text-left border border-slate-200 relative font-sans shadow-md" id="proposals-canvas-print">
              
              {/* Fake Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[90px] text-slate-100/40 font-bold uppercase tracking-widest font-sans pointer-events-none -rotate-45">
                STATLYNK
              </div>

              {/* Corporate Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6 relative z-10">
                <div>
                  <h3 className="text-base font-bold text-sky-950 tracking-wider font-mono">STATLYNK SOLUTIONS</h3>
                  <p className="text-[10px] text-slate-500 italic block mt-0.5">Reliable Enterprise Systems & SLA Guarantees</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 leading-normal font-mono">
                  <div>Bangalore Head Office</div>
                  <div>technical@statlynk.com</div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-wrap relative z-10 selection:bg-sky-100" id="proposal-compiled-text">
                {generatedProposal}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest text-center pt-2">
              🔒 STATLYNK SOLUTIONS SECURE AND LEGALLY COMPLIANT SLAS APPROVED BY VETERAN LEADERSHIP
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl" id="empty-proposals-splash">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">PROPOSAL BOARD OFF-LINE</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">Load potential client parameters, choose contract formulas, and compile print-ready documents in real-time.</p>
          </div>
        )}
      </div>

    </div>
  );
}
