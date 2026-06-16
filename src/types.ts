export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up 1'
  | 'Follow-up 2'
  | 'Meeting Scheduled'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost';

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  industry: string;
  city: string;
  website: string;
  leadSource: string;
  status: LeadStatus;
  lastContactDate: string; // YYYY-MM-DD
  nextFollowUpDate: string; // YYYY-MM-DD
  notes: string;
  meetingOutcome: string;
  creatorId: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type ActivityType = 'email' | 'call' | 'meeting' | 'proposal';

export interface ActivityLog {
  id: string;
  leadId: string;
  companyName: string;
  type: ActivityType;
  description: string;
  performerName: string;
  date: string; // YYYY-MM-DD
}

export interface AIContentRequest {
  companyName?: string;
  industry?: string;
  contactName?: string;
  designation?: string;
  customPrompt?: string;
  topic?: string; // for LinkedIn content
  type?: string;  // for email/script/proposal types
}

export interface AIResult {
  title: string;
  content: string;
  sections?: { [key: string]: string };
}
