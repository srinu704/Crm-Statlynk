import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Mail, Phone, Calendar, 
  MapPin, Globe, Award, Sparkles, Trash2, Edit2, 
  ChevronRight, CalendarCheck, FileText, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';
import { Lead, LeadStatus, ActivityLog, ActivityType } from '../types';

interface LeadManagementProps {
  token: string;
  selectedLeadId?: string; // If navigated to from dashboard
  initialActiveTab?: string;
  onNavigateToGenerators: (tab: string, lead: Lead) => void;
  onAddMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function LeadManagement({ token, selectedLeadId, onNavigateToGenerators, onAddMessage }: LeadManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [industryFilter, setIndustryFilter] = useState<string>('All');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivityType, setNewActivityType] = useState<ActivityType>('call');
  const [newActivityDesc, setNewActivityDesc] = useState('');

  // New Lead form fields
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    industry: 'Education',
    city: '',
    website: '',
    leadSource: 'Referral',
    status: 'New' as LeadStatus,
    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const industries = ['All', 'Education', 'Manufacturing', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Other'];
  const statuses: (LeadStatus | 'All')[] = [
    'All', 'New', 'Contacted', 'Follow-up 1', 'Follow-up 2', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      if (selectedLeadId) {
        const lead = leads.find(l => l.id === selectedLeadId);
        if (lead) {
          setActiveLead(lead);
          fetchLeadActivities(lead.id);
        }
      } else if (!activeLead) {
        setActiveLead(leads[0]);
        fetchLeadActivities(leads[0].id);
      }
    }
  }, [selectedLeadId, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadActivities = async (leadId: string) => {
    try {
      const res = await fetch('/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const filtered = data.filter((a: ActivityLog) => a.leadId === leadId);
      setActivities(filtered);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setActiveLead(lead);
    fetchLeadActivities(lead.id);
  };

  // Create new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create lead.");
      }

      const created = await response.json();
      setLeads(prev => [...prev, created]);
      setActiveLead(created);
      fetchLeadActivities(created.id);
      
      onAddMessage(`Lead '${created.companyName}' added successfully.`, 'success');
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        companyName: '',
        contactPerson: '',
        designation: '',
        email: '',
        phone: '',
        industry: 'Education',
        city: '',
        website: '',
        leadSource: 'Referral',
        status: 'New',
        nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    }
  };

  // Update lead status
  const handleUpdateStatus = async (status: LeadStatus) => {
    if (!activeLead) return;

    try {
      const response = await fetch(`/api/leads/${activeLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      const updated = await response.json();
      
      // Sync local state
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
      setActiveLead(updated);
      fetchLeadActivities(updated.id);
      
      onAddMessage(`Updated status of '${updated.companyName}' to ${status}.`, 'success');
    } catch (error: any) {
      onAddMessage(error.message, 'error');
    }
  };

  // Log custom manual activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newActivityDesc.trim()) return;

    try {
      setAddingActivity(true);
      const response = await fetch(`/api/leads/${activeLead.id}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: newActivityType, description: newActivityDesc }),
      });

      if (!response.ok) throw new Error("Could not log activity.");

      const logged = await response.json();
      setActivities(prev => [logged, ...prev]);
      setNewActivityDesc('');
      onAddMessage("Outreach task completed and logged in telemetry.", "success");
      
      // Update leads list lastContactDate
      setLeads(prev => prev.map(l => l.id === activeLead.id ? { ...l, lastContactDate: logged.date } : l));
    } catch (error: any) {
      onAddMessage(error.message, "error");
    } finally {
      setAddingActivity(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to remove this lead and delete all its activity history? This action is irreversible.")) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Could not delete lead");

      onAddMessage("Lead deleted successfully.", "success");
      const remaining = leads.filter(l => l.id !== id);
      setLeads(remaining);
      
      if (remaining.length > 0) {
        setActiveLead(remaining[0]);
        fetchLeadActivities(remaining[0].id);
      } else {
        setActiveLead(null);
        setActivities([]);
      }
    } catch (error: any) {
      onAddMessage(error.message, "error");
    }
  };

  // Filter computation
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesIndustry = industryFilter === 'All' || lead.industry === industryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const getStatusBadgeColor = (status: LeadStatus) => {
    switch (status) {
      case 'New': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Contacted': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Follow-up 1': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Follow-up 2': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Meeting Scheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Proposal Sent': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Won': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
      case 'Lost': return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call': return <Phone className="w-3.5 h-3.5 text-amber-600" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      case 'meeting': return <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'proposal': return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="crm-ledger-root">
      
      {/* Search & Left catalog Column (1 share) */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[75vh]" id="leads-list-panel">
        
        <div className="flex justify-between items-center mb-4">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 uppercase tracking-wider">
            <Users className="w-4 h-4 text-sky-600" />
            Lead Ledger ({filteredLeads.length})
          </span>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-700 font-bold transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Direct Add
          </button>
        </div>

        {/* Inputs stack */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company, person..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-sky-500"
              >
                {statuses.map(st => (
                  <option key={st} value={st} className="bg-white text-slate-800">{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Industry</label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-sky-500"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind} className="bg-white text-slate-800">{ind}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="scrolling-leads">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium font-mono">Retrieving operational records...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No matches. Try adjusting searches or filters.</p>
            </div>
          ) : (
            filteredLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className={`p-3 rounded-xl border transition text-left cursor-pointer ${
                  activeLead?.id === lead.id
                    ? 'bg-sky-50 border-sky-300 text-slate-950 font-medium shadow-sm'
                    : 'bg-slate-50/40 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{lead.companyName}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border leading-none font-bold ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between items-center">
                  <span>Contact: {lead.contactPerson}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">{lead.city}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail center Column (2 shares) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Lead display profile */}
        {activeLead ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Contact dossier panel */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{activeLead.companyName}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-705 font-semibold">
                      {activeLead.industry}
                    </span>
                  </div>
                  {activeLead.website && (
                    <a href={activeLead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 font-mono mt-1.5 inline-flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {activeLead.website}
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteLead(activeLead.id)}
                  className="p-2 text-slate-400 hover:text-red-650 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition cursor-pointer"
                  title="Purge Lead dossier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Dossier fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-slate-50 border border-slate-200/65 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Primary Contact</span>
                  <p className="text-xs font-bold text-slate-900">{activeLead.contactPerson}</p>
                  <span className="text-[10px] text-slate-500">{activeLead.designation}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/65 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1 font-bold">Contact Coordinates</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono text-slate-800 flex items-center gap-1 transform cursor-text select-all">
                      <Mail className="w-3 h-3 text-sky-600" />
                      {activeLead.email}
                    </p>
                    {activeLead.phone && (
                      <p className="text-xs font-mono text-slate-800 flex items-center gap-1 transform cursor-text select-all">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {activeLead.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/65 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Operational Region</span>
                  <p className="text-xs text-slate-800 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-indigo-500" />
                    {activeLead.city || "Not Provided"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/65 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Acquisition Source</span>
                  <p className="text-xs text-slate-800 flex items-center gap-1 font-medium">
                    <Award className="w-3 h-3 text-amber-500" />
                    {activeLead.leadSource}
                  </p>
                </div>
              </div>

              {/* CRM Schedule controls */}
              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">Lead Telemetry status</span>
                  <div className="flex flex-wrap gap-1">
                    {statuses.filter(s => s !== 'All').map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st as LeadStatus)}
                        className={`text-[9.5px] px-2.5 py-1.5 rounded-lg border transition font-medium cursor-pointer ${
                          activeLead.status === st
                            ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block mb-1">Outreach Schedule Lock</span>
                    <div className="text-xs text-amber-950 font-mono">
                      Next Follow-Up: <strong>{activeLead.nextFollowUpDate}</strong>
                    </div>
                  </div>
                  {activeLead.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Internal Log Notes</span>
                      <p className="text-xs text-slate-605 leading-relaxed font-sans font-medium">{activeLead.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Launcher panel to AI Assistants */}
              <div className="mt-8 pt-6 border-t border-slate-200 bg-gradient-to-r from-sky-500/[0.04] to-slate-500/[0.02] p-4 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1.5 text-xs text-sky-700 font-bold uppercase tracking-widest mb-3">
                  <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
                  StatLynk AI Outreach suite
                </span>
                <p className="text-xs text-slate-500 mb-4 font-medium">Launch our customized Gemini outreach generators directly, auto-loading this client's metrics.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => onNavigateToGenerators('email', activeLead)}
                    className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs text-sky-700 font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center"
                  >
                    <Mail className="w-4 h-4" />
                    AI Outreach Email
                  </button>
                  <button
                    onClick={() => onNavigateToGenerators('script', activeLead)}
                    className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center"
                  >
                    <Phone className="w-4 h-4" />
                    AI Call Script
                  </button>
                  <button
                    onClick={() => onNavigateToGenerators('proposal', activeLead)}
                    className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-xs text-purple-750 font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center"
                  >
                    <FileText className="w-4 h-4" />
                    AI Proposal Docs
                  </button>
                  <button
                    onClick={() => onNavigateToGenerators('linkedin', activeLead)}
                    className="py-2.5 px-3 bg-slate-105 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center"
                  >
                    <Globe className="w-4 h-4" />
                    LinkedIn Pipelines
                  </button>
                </div>
              </div>
            </div>

            {/* Right Activities audit trail log */}
            <div className="md:col-span-1 flex flex-col gap-6">
              
              {/* Manual activity tracker */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs text-slate-800 font-bold uppercase tracking-wider mb-3">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Log Outreach metrics
                </span>
                <form onSubmit={handleAddActivity} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Contact Method</label>
                    <select
                      value={newActivityType}
                      onChange={(e) => setNewActivityType(e.target.value as ActivityType)}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="call">Call Made</option>
                      <option value="email">Email Sent</option>
                      <option value="meeting">Meeting Booked</option>
                      <option value="proposal">Proposal Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Log brief notes</label>
                    <textarea
                      rows={3}
                      required
                      value={newActivityDesc}
                      onChange={(e) => setNewActivityDesc(e.target.value)}
                      placeholder="e.g. Sent client proposal via email, they seem highly receptive."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-xs text-slate-800 placeholder-slate-400 transition resize-none font-medium"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={addingActivity}
                    className="w-full py-2 bg-slate-900 text-white cursor-pointer hover:bg-slate-800 text-xs font-semibold rounded-lg border border-transparent transition"
                  >
                    {addingActivity ? "Saving telemetry..." : "Log Completed outreach"}
                  </button>
                </form>
              </div>

              {/* History telemetry log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1">
                <span className="text-xs text-slate-800 font-bold uppercase tracking-wider block mb-3">Contact audit trail</span>
                <div className="space-y-3 max-h-[25vh] overflow-y-auto pr-1">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium text-center py-4">No historic touchpoints logged.</p>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg relative">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {getActivityIcon(act.type)}
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">{act.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal font-medium">{act.description}</p>
                        <div className="text-[9px] text-slate-450 mt-2 flex justify-between font-mono font-medium">
                          <span>By: {act.performerName}</span>
                          <span>{act.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-700 font-bold font-mono uppercase tracking-widest ">NO ACTIVE LEAD SELECTED</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md font-medium">Please create or import a lead from our left desk catalog to inspect detailed SLA history, log activities, or launch outreach engines.</p>
          </div>
        )}

      </div>

      {/* Add Lead sliding modal/overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-sky-600" />
              Commission Potential Client to CRM Ledger
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Pragati Institutions"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    {industries.filter(i => i !== 'All').map(ind => (
                      <option key={ind} value={ind} className="bg-white text-slate-800">{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Dr. Raghavan"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="Principal / Director"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="raghavan@pragati.edu.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98450 12345"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">City Location</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Hyderabad"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Corporate Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://pragati.edu.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadSource: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Referral" className="bg-white text-slate-800">Referral Referral</option>
                    <option value="Cold Outreach" className="bg-white text-slate-800">Cold Outreach</option>
                    <option value="LinkedIn" className="bg-white text-slate-800">LinkedIn</option>
                    <option value="Website Form" className="bg-white text-slate-800">Website Form</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextFollowUpDate: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Strategic Project notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Need 24/7 automated alert configurations..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-xs text-slate-800 placeholder-slate-400 transition resize-none font-medium"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 border border-slate-200 hover:text-slate-850 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Commissions Lead
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
