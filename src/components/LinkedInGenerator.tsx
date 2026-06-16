import React, { useState } from 'react';
import { Globe, Sparkles, Copy, Check, RefreshCw, Layers, Linkedin, ThumbsUp } from 'lucide-react';

interface LinkedInGeneratorProps {
  token: string;
  onAddMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function LinkedInGenerator({ token, onAddMessage }: LinkedInGeneratorProps) {
  const [topic, setTopic] = useState('Cybersecurity');
  const [loading, setLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const topics = [
    'AWS', 
    'Linux', 
    'DevOps', 
    'Cybersecurity', 
    'Cloud Cost Optimization', 
    'Server Monitoring'
  ];

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setGeneratedPost('');

      const response = await fetch('/api/ai/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) throw new Error("LinkedIn content compilation failed.");

      const data = await response.json();
      setGeneratedPost(data.result);
      onAddMessage("LinkedIn pipeline post compiled.", 'success');
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    onAddMessage("LinkedIn draft copied successfully.", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in" id="linkedin-generator-root">
      
      {/* Parameter picker sidebar (2/5 size) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 h-[68vh] flex flex-col justify-between" id="linkedin-parameters">
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-205">
              <Linkedin className="w-5 h-5 text-sky-600 fill-sky-200/10" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Social pipeline helper</h2>
              <p className="text-xs text-slate-505 font-medium">Generate high-value B2B expert leadership post</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-2 font-mono">Select Core Post Pillar</label>
            <div className="space-y-1.5 scroll-y-auto max-h-[30vh] pr-1">
              {topics.map(tp => (
                <button
                  key={tp}
                  onClick={() => setTopic(tp)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    topic === tp
                      ? 'bg-sky-50 border-sky-305 text-sky-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  📡 {tp}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-600 leading-none">Drafting specifications</span>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Every curated post starts with a bold hook, contains 3 highly educational actionable tech insights, and finishes with a professional B2B StatLynk consulting guarantee.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
              Compiling post telemetry...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200 fill-sky-200/20" />
              Compile LinkedIn post
            </>
          )}
        </button>

      </div>

      {/* Editor preview sheet (3/5 size) */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 h-[68vh] flex flex-col justify-between" id="linkedin-preview">
        {generatedPost ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-2">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded">
                    B2B leadership draft compiled
                  </span>
                  <span className="text-xs text-slate-505 font-medium block mt-1">Pillar focus: {topic}</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-105 hover:border-slate-350 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Draft'}
                </button>
              </div>
            </div>

            {/* LinkedIn-styled Feed container */}
            <div className="flex-1 overflow-y-auto mb-4 bg-slate-50 border border-slate-200/80 p-5 rounded-xl text-left font-sans text-xs text-slate-800 leading-relaxed shadow-sm" id="linkedin-display-board">
              {/* Fake user badge */}
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-bold text-white text-[11px]">
                  SV
                </div>
                <div>
                  <div className="font-bold text-slate-900 leading-none">Srinivas</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Founder at StatLynk Solutions • Indian Air Force Veteran</div>
                </div>
              </div>

              <div className="whitespace-pre-wrap select-text pr-2 font-medium">
                {generatedPost}
              </div>

              {/* Interaction simulation */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-sky-600 transition cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5" /> Like
                </button>
                <div className="ml-auto font-mono text-[9px] tracking-normal text-slate-450">StatLynk social campaign tracker</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider text-center pt-1">
              📈 ready for publish on company profiles or srinivas' personal LinkedIn account
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl" id="empty-linkedin-splash">
            <Linkedin className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">FEED DRAFT BOARD OFF-LINE</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">Load potential digital pillars, set content themes, and compile LinkedIn feed items using Gemini 3.5.</p>
          </div>
        )}
      </div>

    </div>
  );
}
