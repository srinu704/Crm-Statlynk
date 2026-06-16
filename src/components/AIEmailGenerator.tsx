import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, Copy, RefreshCw, Layers, Check, Edit3, Send } from 'lucide-react';
import { Lead } from '../types';

interface AIEmailGeneratorProps {
  token: string;
  presetLead: Lead | null;
  onAddMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function AIEmailGenerator({ token, presetLead, onAddMessage }: AIEmailGeneratorProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [emailType, setEmailType] = useState<string>('Intro Email');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');

  const emailTypes = ['Intro Email', 'Follow-up Email', 'Meeting Request Email', 'Proposal Follow-up'];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (presetLead) {
      setSelectedLeadId(presetLead.id);
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

  const currentLead = leads.find(l => l.id === selectedLeadId) || presetLead;

  const handleGenerate = async () => {
    if (!currentLead) {
      onAddMessage("Please select a target lead to personalize outreach.", "error");
      return;
    }

    try {
      setLoading(true);
      setGeneratedEmail('');
      setSubject('');
      setBodyText('');

      const response = await fetch('/api/ai/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: currentLead.companyName,
          industry: currentLead.industry,
          contactName: currentLead.contactPerson,
          designation: currentLead.designation,
          type_email: emailType,
          customPrompt
        }),
      });

      if (!response.ok) throw new Error("Email generation failed.");

      const data = await response.json();
      const rawText = data.result;
      setGeneratedEmail(rawText);

      // Extract subject line if present in format "Subject: ..."
      if (rawText.toLowerCase().startsWith('subject:')) {
        const lines = rawText.split('\n');
        const subj = lines[0].replace(/^[Ss]ubject:\s*/, '');
        setSubject(subj);
        setBodyText(lines.slice(1).join('\n').trim());
      } else {
        setSubject(`Secure Cloud Strategy for ${currentLead.companyName}`);
        setBodyText(rawText);
      }

      // Automatically log email activity on success!
      await fetch(`/api/leads/${currentLead.id}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'email',
          description: `Generated AI Outreach Email: '${emailType}' with preset context.`
        }),
      });

      onAddMessage(`AI outreach generated and logged for '${currentLead.companyName}'.`, 'success');
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = subject ? `Subject: ${subject}\n\n${bodyText}` : generatedEmail;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    onAddMessage("Email copied successfully.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in animate-scale-up" id="email-generator-container">
      
      {/* Parameters Panel (2/5 size) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 h-[70vh] flex flex-col justify-between" id="generator-leads-preset">
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-200">
              <Mail className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Personalizer</h2>
              <p className="text-xs text-slate-500 font-medium">Generate targeted cold emails using Gemini 3.5</p>
            </div>
          </div>

          {/* Select Lead */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Target Client Profile</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="" className="bg-white text-slate-800">Select a lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id} className="bg-white text-slate-800">{l.companyName} ({l.contactPerson})</option>
              ))}
            </select>
          </div>

          {/* Selected Lead details snippet */}
          {currentLead && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-sky-600 font-mono">Telemetry Context Loaded</span>
              <p className="text-xs font-bold text-slate-900">{currentLead.companyName}</p>
              <p className="text-[11px] text-slate-600">Contact: {currentLead.contactPerson} ({currentLead.designation})</p>
              <p className="text-[11px] text-slate-500">Industry: {currentLead.industry} | Region: {currentLead.city}</p>
            </div>
          )}

          {/* Email Type */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5 font-sans">Campaign Outreach Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {emailTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setEmailType(type)}
                  className={`py-2 px-3 border rounded-xl text-left text-xs transition font-medium cursor-pointer ${
                    emailType === type
                      ? 'bg-sky-50 border-sky-305 text-sky-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-850 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompts */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Tailor Content (Custom instructions)</label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on our custom AWS cost auditing program, or mention the veteran assurance SLA response times specifically."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-805 placeholder-slate-400 transition resize-none font-medium"
            ></textarea>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !currentLead}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
              Compiling outreach strategy...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200 fill-sky-200/20" />
              Generate personalized draft
            </>
          )}
        </button>

      </div>

      {/* Generated output editor (3/5 size) */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 h-[70vh] flex flex-col justify-between" id="generator-email-preview">
        {generatedEmail || subject ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Header metadata layout */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-200 font-mono">Dossier Generated Pitch</span>
                  <div className="text-xs text-slate-505">
                    SLA Agent: <span className="text-slate-800 font-bold">Srinivas (Founder)</span>
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-105 text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Draft'}
                </button>
              </div>

              {/* Email Content */}
              <div className="space-y-3 bg-slate-50 border border-slate-200/80 p-4 rounded-xl font-sans" id="email-text-box">
                {subject && (
                  <div className="text-xs text-slate-850 border-b border-slate-200 pb-3 font-mono">
                    <span className="text-slate-450 font-bold uppercase">Subject:</span> {subject}
                  </div>
                )}
                <pre className="text-xs text-slate-800 font-medium leading-relaxed font-sans whitespace-pre-wrap select-text pr-2">
                  {bodyText || generatedEmail}
                </pre>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-4 font-mono uppercase font-bold tracking-wider">
              Authenticated & logged dynamically under active CRM campaign tracking
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl" id="empty-email-splash">
            <Sparkles className="w-10 h-10 text-slate-350 mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">EMAIL OUTBOX EMPTY</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">Select an active potential client dossier on our left command center, configure campaign stages, and launch the Gemini compiler.</p>
          </div>
        )}
      </div>

    </div>
  );
}
