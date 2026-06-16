import React, { useState, useEffect } from 'react';
import { Phone, Sparkles, Copy, Check, ShieldCheck, RefreshCw, Layers, Headphones } from 'lucide-react';
import { Lead } from '../types';

interface AICallScriptProps {
  token: string;
  presetLead: Lead | null;
  onAddMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function AICallScript({ token, presetLead, onAddMessage }: AICallScriptProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  
  const [industry, setIndustry] = useState('Education');
  const [designation, setDesignation] = useState('Principal / Director');

  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'opening' | 'discovery' | 'objections' | 'closing'>('all');
  const [copied, setCopied] = useState(false);

  const industries = ['Education', 'Manufacturing', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Other'];
  const designations = ['Principal / Director', 'IT Executive', 'Operations Manager', 'CISO / Security Head', 'Founder / CEO'];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (presetLead) {
      setSelectedLeadId(presetLead.id);
      setIndustry(presetLead.industry);
      setDesignation(presetLead.designation || 'Principal / Director');
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
      setIndustry(found.industry);
      setDesignation(found.designation || 'Principal');
    }
  };

  const currentLead = leads.find(l => l.id === selectedLeadId) || presetLead;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setGeneratedScript('');

      const response = await fetch('/api/ai/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ industry, designation })
      });

      if (!response.ok) throw new Error("Script compilation failed.");

      const data = await response.json();
      setGeneratedScript(data.result);

      // Log activity automatically if generated from a lead!
      if (currentLead) {
        await fetch(`/api/leads/${currentLead.id}/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'call',
            description: `Generated AI calling playbook script tailored to ${designation} in ${industry}.`
          }),
        });
      }

      onAddMessage("Structured call script generated and logged.", 'success');
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    onAddMessage("Call script copied to clipboard.", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper selectors for quick-reading script components
  const parseSection = (raw: string, type: 'opening' | 'discovery' | 'objections' | 'closing') => {
    if (!raw) return '';
    const sections = raw.split(/####?\s*\d+\.\s*/i);
    if (sections.length < 5) return raw; // Return raw if format differs

    switch (type) {
      case 'opening': return sections[1] || '';
      case 'discovery': return sections[2] || '';
      case 'objections': return sections[3] || '';
      case 'closing': return sections[4] || '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in" id="script-generator-root">
      
      {/* Parameter sidebar column (2/5 size) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 h-[72vh] flex flex-col justify-between" id="script-sidebar">
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 animate-pulse">
              <Headphones className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Call Playbook Writer</h2>
              <p className="text-xs text-slate-500 font-medium">Indian Air Force veteran-disciplined script structures</p>
            </div>
          </div>

          {/* Quick Lead context loader */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5 font-mono">Sync with Active Client Dossier</label>
            <select
              value={selectedLeadId}
              onChange={(e) => handleSelectLeadChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="" className="bg-white text-slate-800">Load custom lead profile...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.companyName} ({l.contactPerson})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Target sector</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Contact Designation</label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              {designations.map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
          </div>

          {currentLead && (
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-amber-600 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Lead synchronized
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">{currentLead.companyName}</p>
              <p className="text-[10px] text-slate-500 font-medium font-sans">Representative: {currentLead.contactPerson}</p>
            </div>
          )}

        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
              Compiling call script guidelines...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200 fill-sky-200/20" />
              Generate battle-ready script
            </>
          )}
        </button>
      </div>

      {/* Playbook interactive readboard column (3/5 size) */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 h-[72vh] flex flex-col justify-between text-left" id="playbook-readboard">
        {generatedScript ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded animate-pulse">
                    Active calling board
                  </span>
                  <div className="text-xs text-slate-500 font-medium">Target: {designation} in {industry}</div>
                </div>

                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-850 hover:bg-slate-105 hover:border-slate-350 text-xs font-semibold cursor-pointer flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Full script'}
                </button>
              </div>

              {/* Dynamic script sectional tabs */}
              <div className="grid grid-cols-5 gap-1.5">
                {(['all', 'opening', 'discovery', 'objections', 'closing'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-1.5 text-center rounded-lg border text-[9.5px] uppercase font-bold tracking-wide transition cursor-pointer ${
                      activeTab === tab
                        ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Read board segment */}
            <div className="flex-1 overflow-y-auto my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {activeTab === 'all' ? (
                <div className="prose max-w-none text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap select-text pr-1 font-medium">
                  {generatedScript}
                </div>
              ) : (
                <div className="space-y-4" id={`script-segment-${activeTab}`}>
                  <h4 className="text-xs uppercase font-extrabold text-amber-700 tracking-wider">
                    👉 Segment: {activeTab} stage
                  </h4>
                  <pre className="text-xs text-slate-800 leading-relaxed font-medium font-sans whitespace-pre-wrap select-text pr-1">
                    {parseSection(generatedScript, activeTab as any) || "This playbook section is integrated in the main compile sheet."}
                  </pre>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider text-center pt-2">
              ⚠️ veteran protocol: listen actively and handle objections with structured benefits guarantees
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl" id="empty-playbook-splash">
            <Phone className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">PLAYBOOK ARCHIVE EMPTY</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">Load potential client parameters, lock and set corporate industry designations, and launch the battle playbook compilation.</p>
          </div>
        )}
      </div>

    </div>
  );
}
