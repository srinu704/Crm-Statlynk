import React, { useState } from 'react';
import { Shield, Key, Mail, User, Radio, Users2, Phone } from 'lucide-react';
import StatLynkLogo from './StatLynkLogo';

interface LoginProps {
  onLoginSuccess: (token: string, user: { id: string; email: string; name: string; role: 'admin' | 'sales' }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'sales'>('sales');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { email, password, name, role } 
      : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-sans" id="login-container">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative z-10" id="login-card">
        {/* StatLynk Logo Badge */}
        <div className="flex flex-col items-center mb-6">
          <StatLynkLogo mode="badge" size={240} className="shadow-2xl" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6 flex items-start gap-2 font-medium">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Srinivas"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="srinu.vas.sp@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System Access Level</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('sales')}
                  className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition ${
                    role === 'sales'
                      ? 'bg-sky-50 border-sky-300 text-sky-700 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Outreach Exec
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition ${
                    role === 'admin'
                      ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin / Founder
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-6 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing Operations...' : isRegister ? 'Confirm Commissioning' : 'Secure Entry'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition"
          >
            {isRegister 
              ? 'Already commissioned? Sign in here' 
              : "New team member? Complete commissioning roster"}
          </button>
        </div>

        {/* Quick entry panel for smooth onboarding */}
        {!isRegister && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold uppercase tracking-wider mb-2">
              <Users2 className="w-3.5 h-3.5 text-sky-600" />
              Pilot Credentials Check
            </span>

            <div className="space-y-2 mt-2">
              <button
                onClick={() => fillQuickCredentials('srinu.vas.sp@gmail.com', 'password123')}
                className="w-full text-left p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-750 font-medium transition flex justify-between items-center"
              >
                <span>🚀 Srinivas (Admin / Founder)</span>
                <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-mono uppercase border border-sky-100 font-semibold">Use</span>
              </button>
              <button
                onClick={() => fillQuickCredentials('executive@statlynk.com', 'password123')}
                className="w-full text-left p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-750 font-medium transition flex justify-between items-center"
              >
                <span>💼 Amit Kumar (Sales Executive)</span>
                <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-mono uppercase border border-sky-100 font-semibold">Use</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">Password for both accounts is <span className="font-mono text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded font-bold">password123</span></p>
          </div>
        )}

        {/* Corporate Helpdesk Directory */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center text-center space-y-2">
          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest block">ADMINISTRATIVE HELPDESK</span>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold justify-center font-mono hover:text-sky-600 transition">
            <Phone className="w-3.5 h-3.5 text-amber-500" />
            <a href="tel:+917014265717">+91 7014265717</a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-mono">
            <a href="mailto:info@statlynksolutions.com" className="hover:text-sky-500 transition">info@statlynksolutions.com</a>
            <span className="text-slate-300">|</span>
            <a href="mailto:srinivasaraop@statlynksolutions.com" className="hover:text-sky-500 transition">srinivasaraop@statlynksolutions.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
