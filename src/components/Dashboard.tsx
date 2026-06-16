import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Mail, Phone, Calendar, FileText, Sparkles, 
  Clock, AlertCircle, ArrowUpRight, CheckCircle2, ChevronRight,
  Search, Plus, Filter, Users, Layers, Star, PlusCircle, Check, X,
  TrendingDown, Target
} from 'lucide-react';
import { 
  ValueType, 
  NameType 
} from 'recharts/types/component/DefaultTooltipContent';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Lead, ActivityLog } from '../types';

interface DashboardProps {
  token: string;
  onNavigateToLeads: (leadId?: string, openGeneratorTab?: string) => void;
  onTriggerEmailQuick: (lead: Lead) => void;
  onTriggerScriptQuick: (lead: Lead) => void;
}

type MetricType = 'revenue' | 'emails' | 'calls' | 'proposals' | 'meetings';

export default function Dashboard({ 
  token, 
  onNavigateToLeads, 
  onTriggerEmailQuick, 
  onTriggerScriptQuick 
}: DashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Metric Selection for the chart
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('revenue');

  // Logs stream states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeActivityTab, setActiveActivityTab] = useState<'all' | 'email' | 'call' | 'meeting' | 'proposal'>('all');
  
  // Quick Activity Dialog
  const [showLogModal, setShowLogModal] = useState(false);
  const [logFormLeadId, setLogFormLeadId] = useState('');
  const [logFormType, setLogFormType] = useState<'email' | 'call' | 'meeting' | 'proposal'>('email');
  const [logFormDesc, setLogFormDesc] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch('/api/dashboard/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setAnalytics(statsData);

      // Fetch normal leads
      const leadsRes = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const leadsData = await leadsRes.json();
      setLeads(leadsData);

      // Fetch all activities
      const activitiesRes = await fetch('/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        // Sort descending by date/id
        const sortedActivities = (activitiesData || []).sort((a: any, b: any) => b.id.localeCompare(a.id));
        setActivities(sortedActivities);
      }
    } catch (error) {
      console.error("Failed to load comprehensive dashboard datasets.", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFormLeadId || !logFormDesc.trim()) {
      return;
    }

    try {
      setSubmittingLog(true);
      const res = await fetch(`/api/leads/${logFormLeadId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: logFormType,
          description: logFormDesc.trim()
        })
      });

      if (res.ok) {
        setActionSuccessMsg('Activity logged successfully with veteran flight verification!');
        setLogFormDesc('');
        setTimeout(() => {
          setActionSuccessMsg('');
          setShowLogModal(false);
        }, 1500);
        // Refresh telemetry
        await fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to capture log.');
      }
    } catch (err) {
      console.error("Error logging outreach incident:", err);
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" id="dashboard-loader">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-t-sky-600 border-slate-200 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-mono mt-2 uppercase tracking-widest font-bold">ALIGNED FLIGHT CHECKLIST IN PROGRESS...</span>
        </div>
      </div>
    );
  }

  const m = analytics.metrics;
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters for priority columns
  const leadsToContactToday = leads.filter(l => l.nextFollowUpDate === todayStr && l.status !== "Won" && l.status !== "Lost");
  const pendingFollowups = leads.filter(l => l.nextFollowUpDate < todayStr && l.status !== "Won" && l.status !== "Lost");
  const meetingsScheduled = leads.filter(l => l.status === "Meeting Scheduled");

  // Funnel calculations
  const funnelStages = [
    { key: 'New', label: 'New', count: leads.filter(l => l.status === 'New').length, value: leads.filter(l => l.status === 'New').length * 5000, color: 'bg-slate-300' },
    { key: 'Contacted', label: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length, value: leads.filter(l => l.status === 'Contacted').length * 15000, color: 'bg-blue-300' },
    { key: 'Follow-ups', label: 'Follow-ups', count: leads.filter(l => l.status === 'Follow-up 1' || l.status === 'Follow-up 2').length, value: leads.filter(l => l.status === 'Follow-up 1' || l.status === 'Follow-up 2').length * 30000, color: 'bg-amber-300' },
    { key: 'Scheduled', label: 'Meetings Booked', count: leads.filter(l => l.status === 'Meeting Scheduled').length, value: leads.filter(l => l.status === 'Meeting Scheduled').length * 50000, color: 'bg-purple-300' },
    { key: 'Proposal', label: 'Proposals Sent', count: leads.filter(l => l.status === 'Proposal Sent').length, value: leads.filter(l => l.status === 'Proposal Sent').length * 85000, color: 'bg-teal-300' },
    { key: 'Won', label: 'Won (SLA Logged)', count: leads.filter(l => l.status === 'Won').length, value: leads.filter(l => l.status === 'Won').length * 150000, color: 'bg-emerald-400' }
  ];

  // Activities Filtered Stream
  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          act.performerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeActivityTab === 'all' || act.type === activeActivityTab;
    return matchesSearch && matchesTab;
  });

  // Dynamic Chart Trend Calculation based on Selected Metric Card
  const getSelectedMetricChartData = () => {
    switch (selectedMetric) {
      case 'emails':
        return [
          { name: "Jan", count: 12 },
          { name: "Feb", count: 18 },
          { name: "Mar", count: 25 },
          { name: "Apr", count: 32 },
          { name: "May", count: 48 },
          { name: "Jun", count: m.emailsSent }
        ];
      case 'calls':
        return [
          { name: "Jan", count: 8 },
          { name: "Feb", count: 14 },
          { name: "Mar", count: 19 },
          { name: "Apr", count: 28 },
          { name: "May", count: 36 },
          { name: "Jun", count: m.callsMade }
        ];
      case 'proposals':
        return [
          { name: "Jan", count: 1 },
          { name: "Feb", count: 3 },
          { name: "Mar", count: 2 },
          { name: "Apr", count: 4 },
          { name: "May", count: 5 },
          { name: "Jun", count: m.proposalsSent }
        ];
      case 'meetings':
        return [
          { name: "Jan", count: 2 },
          { name: "Feb", count: 4 },
          { name: "Mar", count: 6 },
          { name: "Apr", count: 8 },
          { name: "May", count: 11 },
          { name: "Jun", count: m.meetingsBooked }
        ];
      case 'revenue':
      default:
        return analytics.chartData; // uses base revenue projections
    }
  };

  // Metric visual configurations
  const metricConfigs: Record<MetricType, { label: string; textGradient: string; stroke: string; fillId: string; symbol: string; target: number; desc: string }> = {
    revenue: { 
      label: "Revenue Pipeline", 
      textGradient: "from-sky-500 to-blue-600",
      stroke: "#0ea5e9", 
      fillId: "colorRevenue", 
      symbol: "₹",
      target: 500000,
      desc: "Weighted contract estimations",
    },
    emails: { 
      label: "Emails Sent", 
      textGradient: "from-indigo-500 to-violet-600",
      stroke: "#6366f1", 
      fillId: "colorEmails", 
      symbol: "",
      target: 50,
      desc: "AI cold & followup transmissions",
    },
    calls: { 
      label: "Calls Logged", 
      textGradient: "from-amber-500 to-orange-600",
      stroke: "#f59e0b", 
      fillId: "colorCalls", 
      symbol: "",
      target: 40,
      desc: "Sales playbook calls completed",
    },
    proposals: { 
      label: "Proposals Sent", 
      textGradient: "from-emerald-500 to-teal-600",
      stroke: "#10b981", 
      fillId: "colorProposals", 
      symbol: "",
      target: 10,
      desc: "IT specs & SLAs generated",
    },
    meetings: { 
      label: "Meetings Booked", 
      textGradient: "from-pink-500 to-purple-600",
      stroke: "#ec4899", 
      fillId: "colorMeetings", 
      symbol: "",
      target: 15,
      desc: "Critical client kickoff briefings",
    },
  };

  const chartData = getSelectedMetricChartData();
  const currentCfg = metricConfigs[selectedMetric];

  // Calculated Progress Percentage
  const currentMetricValue = selectedMetric === 'revenue' ? m.revenuePipeline :
                             selectedMetric === 'emails' ? m.emailsSent :
                             selectedMetric === 'calls' ? m.callsMade :
                             selectedMetric === 'proposals' ? m.proposalsSent : m.meetingsBooked;

  const progressPercent = Math.min(100, Math.round((currentMetricValue / currentCfg.target) * 100));

  return (
    <div className="space-y-8 animate-fade-in text-left" id="comprehensive-dashboard">

      {/* Dynamic Motivation & Outreach Goal Meter */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden" id="goal-target-meter">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-indigo-500/5 opacity-50 z-0" />
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest bg-sky-950 text-sky-400 font-extrabold px-2.5 py-1 border border-sky-800/80 rounded">
              Command Station Quota
            </span>
            <span className="text-xs text-slate-400 font-mono">Operations tracking timeline 2026</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Active Campaign Progress Meter</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Srinivas, our Air Force Veteran pilot, sets strict military-precision limits. Track actual metrics against target flight quotas below. Click any metric card to explore analytics charts.
          </p>
        </div>

        {/* Dynamic score visualization */}
        <div className="flex-1 w-full md:max-w-xs z-10 bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono font-bold uppercase">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentCfg.label} Progress</span>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400">{progressPercent}% Achieved</span>
          </div>
          
          {/* Progress bar container */}
          <div className="h-2.5 bg-slate-800 rounded-full w-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${selectedMetric === 'revenue' ? 'from-sky-500 to-sky-400' : 
                                    selectedMetric === 'emails' ? 'from-indigo-500 to-indigo-400' :
                                    selectedMetric === 'calls' ? 'from-amber-500 to-amber-450' :
                                    selectedMetric === 'proposals' ? 'from-emerald-500 to-emerald-400' : 'from-pink-500 to-pink-400'} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>Score: {selectedMetric === 'revenue' ? '₹' : ''}{currentMetricValue.toLocaleString()}</span>
            <span>Target: {selectedMetric === 'revenue' ? '₹' : ''}{currentCfg.target.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Metrics Interactive Selection Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="metric-cards-group">
        
        {/* Metric 1 - Revenue Pipeline */}
        <button 
          onClick={() => setSelectedMetric('revenue')}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition h-36 flex flex-col justify-between cursor-pointer ${
            selectedMetric === 'revenue' 
              ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-100' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          id="metric-revenue"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Revenue Pipeline</span>
            <span className="text-[9px] text-sky-700 font-mono bg-sky-100/70 border border-sky-200 px-1.5 py-0.5 rounded font-bold leading-none">
              ACTIVE
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">₹{m.revenuePipeline.toLocaleString()}</p>
            <span className="text-[9.5px] text-slate-400 leading-none mt-1.5 block">SLA contract weighted total</span>
          </div>
        </button>

        {/* Metric 2 - Emails Sent */}
        <button 
          onClick={() => setSelectedMetric('emails')}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition h-36 flex flex-col justify-between cursor-pointer ${
            selectedMetric === 'emails' 
              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-100' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          id="metric-emails"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Emails Sent</span>
            <Mail className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">{m.emailsSent}</p>
            <span className="text-[9.5px] text-slate-400 leading-none mt-1.5 block">AI cold outreach transcepts</span>
          </div>
        </button>

        {/* Metric 3 - Calls Logged */}
        <button 
          onClick={() => setSelectedMetric('calls')}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition h-36 flex flex-col justify-between cursor-pointer ${
            selectedMetric === 'calls' 
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-100' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          id="metric-calls"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Calls Made</span>
            <Phone className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">{m.callsMade}</p>
            <span className="text-[9.5px] text-slate-400 leading-none mt-1.5 block">Playbook speech audits executed</span>
          </div>
        </button>

        {/* Metric 4 - Proposals Sent */}
        <button 
          onClick={() => setSelectedMetric('proposals')}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition h-36 flex flex-col justify-between cursor-pointer ${
            selectedMetric === 'proposals' 
              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-100' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          id="metric-proposals"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Proposals Sent</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">{m.proposalsSent}</p>
            <span className="text-[9.5px] text-slate-400 leading-none mt-1.5 block">IT scopes and SLA drafts filed</span>
          </div>
        </button>

        {/* Metric 5 - Meetings Scheduled */}
        <button 
          onClick={() => setSelectedMetric('meetings')}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition h-36 flex flex-col justify-between cursor-pointer ${
            selectedMetric === 'meetings' 
              ? 'bg-pink-50/70 border-pink-400 ring-2 ring-pink-100' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          id="metric-meetings"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Meetings Booked</span>
            <Calendar className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">{m.meetingsBooked}</p>
            <span className="text-[9.5px] text-slate-400 leading-none mt-1.5 block">{m.meetingsScheduledCount} remaining today</span>
          </div>
        </button>
      </div>

      {/* Primary Dynamic Chart Area & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-funnel">

        {/* Dynamic Metric Detail Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${selectedMetric === 'revenue' ? 'from-sky-500 to-sky-400' : 
                                    selectedMetric === 'emails' ? 'from-indigo-500 to-indigo-400' :
                                    selectedMetric === 'calls' ? 'from-amber-500 to-amber-450' :
                                    selectedMetric === 'proposals' ? 'from-emerald-500 to-emerald-400' : 'from-pink-500 to-pink-400'}`} />
                <h3 className="text-base font-bold text-slate-800">
                  {currentCfg.label} Progress Projections
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentCfg.desc} across current fiscal cycle</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">CURRENT ACTIVE MONTH</span>
              <span className="text-xs font-mono font-extrabold text-slate-800">JUN 2026 OUTLOOK</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id={currentCfg.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentCfg.stroke} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={currentCfg.stroke} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', textAlign: 'left' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value: ValueType) => {
                    const labelStr = currentCfg.symbol ? `${currentCfg.symbol}${value?.toLocaleString()}` : value;
                    return [labelStr, `${currentCfg.label} Level`];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric === 'revenue' ? "revenue" : "count"} 
                  stroke={currentCfg.stroke} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill={`url(#${currentCfg.fillId})`} 
                  name={selectedMetric} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Stages Vertical Funnel */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider font-mono">Revenue Funnel Pipeline</h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">Total estimated value in transit stages</p>
          </div>

          <div className="space-y-2.5 my-4">
            {funnelStages.map(stage => {
              // Percentage width based on max relative weight
              const maxLeads = Math.max(...funnelStages.map(s => s.count)) || 1;
              const widthMultiplier = Math.max(25, Math.round((stage.count / maxLeads) * 100));
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-sans">
                    <span className="font-bold text-slate-700">{stage.label}</span>
                    <span className="font-mono text-slate-500">{stage.count} leads (Est. ₹{stage.value.toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-lg h-3 overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-lg transition-all duration-700`}
                      style={{ width: `${widthMultiplier}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-400 font-mono uppercase block">Funnel Command Summary</span>
            <span className="text-[11px] font-bold text-slate-700 mt-1 block">
              ⭐ Total Leads in Funnel: {leads.length} | Target Success Index: High
            </span>
          </div>
        </div>
      </div>

      {/* Priority Tasks Leads and Followups columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-priorities-block">
        
        {/* Contact Today List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leads to Contact Today ({leadsToContactToday.length})</h3>
            </div>
            <button 
              onClick={() => onNavigateToLeads()} 
              className="text-xs text-sky-600 hover:text-sky-700 font-bold transition flex items-center gap-0.5 cursor-pointer"
            >
              Leads Ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {leadsToContactToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs text-slate-700 font-bold uppercase tracking-wide">All outreach scheduled with honor clear!</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm font-medium">No pending calendar-locked contacts for today. Review the main index.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
              {leadsToContactToday.map(lead => (
                <div key={lead.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 hover:bg-slate-100/50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{lead.companyName}</span>
                      <span className="text-[9px] text-sky-700 font-mono bg-sky-50 border border-sky-150 font-bold px-1.5 py-0.5 rounded uppercase select-none">
                        {lead.industry}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      Contact person: <strong className="text-slate-800">{lead.contactPerson}</strong> ({lead.designation})
                    </p>
                    {lead.notes && (
                      <p className="text-[10px] text-slate-400 mt-2 italic bg-white px-2 py-1 rounded inline-block">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onTriggerEmailQuick(lead)}
                      className="flex-1 sm:flex-none py-1.5 px-3 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-extrabold text-indigo-700 flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Email
                    </button>
                    <button
                      onClick={() => onTriggerScriptQuick(lead)}
                      className="flex-1 sm:flex-none py-1.5 px-3 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-extrabold text-amber-700 flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      Audited Script
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Follow-ups side board */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">Overdue follow-ups ({pendingFollowups.length})</h3>
              </div>
            </div>

            {pendingFollowups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl">
                <Check className="w-6 h-6 text-emerald-500" />
                <p className="text-[10px] uppercase font-mono font-bold text-slate-500 mt-2">Telemetry in spec</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {pendingFollowups.map(lead => (
                  <div key={lead.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/50 transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{lead.companyName}</span>
                      <span className="text-[8px] text-red-700 font-mono bg-red-105 border border-red-200 px-1.5 py-0.5 rounded font-extrabold leading-none shrink-0 flex items-center gap-0.5 uppercase">
                        <Clock className="w-2.5 h-2.5" />
                        OVERDUE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-505 mt-1.5 font-medium">Target date was: {lead.nextFollowUpDate}</p>
                    <button 
                      onClick={() => onNavigateToLeads(lead.id)}
                      className="text-[10px] text-sky-600 hover:text-sky-700 font-extrabold mt-2.5 flex items-center gap-0.5 cursor-pointer"
                    >
                      Process Lead Now <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-left mt-4 space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Follow-up Protocols</span>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Ensure you execute outreach within 24 hours of target dates to avoid lead cooling. Use custom generated AI templates.
            </p>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE OUTREACH LOGS STREAM SYSTEM FOOTBOARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="activity-telemetry-logs">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 font-mono uppercase font-extrabold bg-sky-50 text-sky-700 border border-sky-200 rounded">
                Unified Log Matrix
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-mono">Outreach Activity Stream</h3>
            </div>
            <p className="text-xs text-slate-400">Audit trail of outbound calls, emails, and generated contracts across all leads</p>
          </div>

          {/* Actions toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs/companies..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-44 md:w-56 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => {
                if (leads.length === 0) {
                  alert("No leads found in ledger. Please add a lead first.");
                  return;
                }
                setLogFormLeadId(leads[0]?.id || '');
                setShowLogModal(true);
              }}
              className="py-1.5 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-extrabold cursor-pointer hover:bg-slate-800 transition flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
              Log Custom Outreach
            </button>
          </div>
        </div>

        {/* Tab Filters for activity stream */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'All Operations' },
            { key: 'email', label: 'Emails' },
            { key: 'call', label: 'Calls Logged' },
            { key: 'meeting', label: 'Meetings' },
            { key: 'proposal', label: 'Proposals' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveActivityTab(tab.key as any)}
              className={`py-1.5 px-3 rounded-lg border text-[10.5px] uppercase font-bold tracking-wide transition cursor-pointer ${
                activeActivityTab === tab.key
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stream Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-150">
          <table className="min-w-full divide-y divide-slate-150 text-left">
            <thead className="bg-[#FAFBFD]">
              <tr>
                <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Outreach Date</th>
                <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Lead target</th>
                <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Action Segment</th>
                <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Incidence narrative</th>
                <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Operator</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-150 text-xs text-slate-800 bg-white">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-medium font-sans">
                    No matching activity log records detected. Change criteria or write a new custom report.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[10.5px] text-slate-500 font-bold">
                      {act.date}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900">{act.companyName}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold leading-none ${
                        act.type === 'email' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                        act.type === 'call' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                        act.type === 'proposal' ? 'bg-emerald-50 border border-emerald-205 text-emerald-700' :
                        'bg-purple-50 border border-purple-200 text-purple-700'
                      }`}>
                        {act.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium leading-relaxed max-w-sm font-sans text-slate-700">
                      {act.description}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-500 flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[9px]">
                        {act.performerName.charAt(0)}
                      </div>
                      <span className="text-[10px]">{act.performerName}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Log Modal Overlay */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="quick-log-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full relative space-y-4">
            
            <button 
              onClick={() => setShowLogModal(false)}
              className="p-1 border border-slate-150 bg-slate-50 hover:bg-slate-100 rounded-lg absolute right-4 top-4 text-slate-550 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-left space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-tight text-left">
                ✒️ Log Outreach Incident
              </h3>
              <p className="text-xs text-slate-500">Record a brief summary metrics of manual calls, emails or meetings</p>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-pulse">
                {actionSuccessMsg}
              </div>
            )}

            <form onSubmit={handleQuickLogActivity} className="space-y-4 text-left">
              
              {/* Select Lead */}
              <div>
                <label className="text-[10.5px] font-mono uppercase font-bold text-slate-500 block mb-1">Target Client Profile</label>
                <select
                  value={logFormLeadId}
                  onChange={(e) => setLogFormLeadId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 font-medium leading-none focus:outline-none focus:border-sky-500"
                >
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.companyName} ({lead.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Segment Type */}
              <div>
                <label className="text-[10.5px] font-mono uppercase font-bold text-slate-500 block mb-1">Action Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'email', label: 'Email', icon: Mail },
                    { type: 'call', label: 'Call', icon: Phone },
                    { type: 'meeting', label: 'Meeting', icon: Calendar },
                    { type: 'proposal', label: 'Specs/SLA', icon: FileText }
                  ].map(option => {
                    const Icon = option.icon;
                    const isSelected = logFormType === option.type;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => setLogFormType(option.type as any)}
                        className={`py-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1 font-extrabold uppercase text-[9px] cursor-pointer transition ${
                          isSelected 
                            ? 'bg-sky-50 border-sky-400 text-sky-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Narrative description */}
              <div>
                <label className="text-[10.5px] font-mono uppercase font-bold text-slate-500 block mb-1">Incident Narrative</label>
                <textarea
                  value={logFormDesc}
                  onChange={(e) => setLogFormDesc(e.target.value)}
                  rows={3}
                  maxLength={250}
                  placeholder="e.g. Discussed core database clustering latency and backup safety guarantees over call."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Limit: 250 characters max.</span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-55 rounded-xl text-xs font-bold cursor-pointer text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog || !logFormDesc.trim()}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-extrabold cursor-pointer hover:bg-slate-800 transition shadow-sm"
                >
                  {submittingLog ? 'Registering...' : 'Log Operation Record'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
