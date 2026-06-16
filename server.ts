import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "statlynk-outreach-secret-2026-key";

// Setup server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found or using placeholder. Running in dynamic preview simulation mode.");
}

// Setup server-side Firebase configuration
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let db_firestore: any = null;

if (fs.existsSync(CONFIG_PATH)) {
  try {
    const rawConfig = fs.readFileSync(CONFIG_PATH, "utf8");
    const firebaseConfig = JSON.parse(rawConfig);
    const firebaseApp = initializeApp(firebaseConfig);
    db_firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore initialized successfully as primary database store.");
  } catch (error) {
    console.error("Failed to initialize Firebase client:", error);
  }
} else {
  console.log("No firebase-applet-config.json found. Running in offline file-storage mode.");
}

// Ensure local fallback database folders exist
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Database initial state
interface Database {
  users: any[];
  leads: any[];
  activities: any[];
}

function getInitialDatabase(): Database {
  const defaultSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync("password123", defaultSalt);
  const salesPasswordHash = bcrypt.hashSync("password123", defaultSalt);

  return {
    users: [
      {
        id: "usr_1",
        email: "srinu.vas.sp@gmail.com",
        name: "Srinivas",
        role: "admin",
        passwordHash: adminPasswordHash,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_2",
        email: "executive@statlynk.com",
        name: "Amit Kumar",
        role: "sales",
        passwordHash: salesPasswordHash,
        createdAt: new Date().toISOString(),
      }
    ],
    leads: [
      {
        id: "ld_1",
        companyName: "Pragati Educational Institutions",
        contactPerson: "Dr. K. Raghavan",
        designation: "Principal / Director",
        email: "raghavan@pragati.edu.in",
        phone: "+91 98450 12345",
        industry: "Education",
        city: "Hyderabad",
        website: "https://pragati.edu.in",
        leadSource: "Referral",
        status: "New",
        lastContactDate: new Date().toISOString().split('T')[0],
        nextFollowUpDate: new Date().toISOString().split('T')[0],
        notes: "Principal wants high-reliability LMS setup to handle peak exams load, and cybersecurity hardening. Prefers a veteran's direct service guarantee.",
        meetingOutcome: "",
        creatorId: "usr_1",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ld_2",
        companyName: "Zenith Automotive Parts",
        contactPerson: "Anil Sharma",
        designation: "IT Operations Manager",
        email: "anil.s@zenithauto.com",
        phone: "+91 88765 43210",
        industry: "Manufacturing",
        city: "Chennai",
        website: "https://zenithautoparts.com",
        leadSource: "Cold Outreach",
        status: "Contacted",
        lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Discussed critical Linux server monitoring. They experienced 3 hours downtime last week causing supply line hiccups.",
        meetingOutcome: "Warm call, sent AWS catalog.",
        creatorId: "usr_1",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ld_3",
        companyName: "FinEdge Wealth Advisors",
        contactPerson: "Meera Nair",
        designation: "Chief Information Security Officer",
        email: "meera.nair@finedge.com",
        phone: "+91 94440 99887",
        industry: "Finance",
        city: "Bangalore",
        website: "https://finedgewealth.com",
        leadSource: "LinkedIn",
        status: "Meeting Scheduled",
        lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "CISO agreed to schedule a complete VAPT and cybersecurity review presentation with veteran Founder Srinivas.",
        meetingOutcome: "Agreed to 30 min security scan kickoff.",
        creatorId: "usr_2",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ld_4",
        companyName: "Apex Retail Solutions",
        contactPerson: "Rohan Das",
        designation: "Founder / CEO",
        email: "rohan@apexretail.io",
        phone: "+91 99001 55667",
        industry: "Retail",
        city: "Mumbai",
        website: "https://apexretail.io",
        leadSource: "Website Form",
        status: "Proposal Sent",
        lastContactDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Delivered AWS Consulting and Cloud Cost Optimization proposal with transparent SLA guarantees. Expecting reply next week.",
        meetingOutcome: "",
        creatorId: "usr_1",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    activities: [
      {
        id: "act_1",
        leadId: "ld_2",
        companyName: "Zenith Automotive Parts",
        type: "call",
        description: "Initial cold call with IT Manager Anil Sharma. Discussed server reliability.",
        performerName: "Srinivas",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: "act_2",
        leadId: "ld_4",
        companyName: "Apex Retail Solutions",
        type: "proposal",
        description: "Delivered detailed AWS Consulting Proposal including cloud optimization audit.",
        performerName: "Srinivas",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: "act_3",
        leadId: "ld_3",
        companyName: "FinEdge Wealth Advisors",
        type: "email",
        description: "Sent customized Security VAPT checklist and pre-meeting deck.",
        performerName: "Amit Kumar",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
    ]
  };
}

// Local File Database helper functions
function readLocalDb(): Database {
  if (!fs.existsSync(DB_FILE)) {
    const fresh = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file, resetting:", err);
    const fresh = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

function writeLocalDb(data: Database): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Seeder logic to hydrate Cloud Firestore with original data representation automatically
async function seedFirestoreIfNeeded() {
  if (!db_firestore) return;
  try {
    const usersCol = collection(db_firestore, "users");
    const snapshot = await getDocs(usersCol);
    if (snapshot.empty) {
      console.log("🚀 Firestore is empty. Hydrating StatLynk CRM original telemetry records...");
      const initial = getInitialDatabase();
      
      for (const u of initial.users) {
        await setDoc(doc(db_firestore, "users", u.id), u);
      }
      for (const l of initial.leads) {
        await setDoc(doc(db_firestore, "leads", l.id), l);
      }
      for (const a of initial.activities) {
        await setDoc(doc(db_firestore, "activities", a.id), a);
      }
      console.log("✅ Beautiful! Firestore seeding completed with honor.");
    } else {
      console.log("📊 Firestore records validated. Skipped seeding.");
    }
  } catch (err) {
    console.error("❌ Warning: Firestore seeding failed (likely security rules or network).", err);
  }
}

// Secondary unified read/write abstractions that switch seamlessly to cloud or fall back to file
async function fetchAllUsers(): Promise<any[]> {
  if (db_firestore) {
    try {
      const snap = await getDocs(collection(db_firestore, "users"));
      const items: any[] = [];
      snap.forEach(d => items.push(d.data()));
      return items;
    } catch (e) {
      console.error("Failed to read users from Firestore, using local cache:", e);
    }
  }
  return readLocalDb().users;
}

async function writeUser(user: any): Promise<void> {
  if (db_firestore) {
    try {
      await setDoc(doc(db_firestore, "users", user.id), user);
      return;
    } catch (e) {
      console.error("Failed to write user to Firestore:", e);
    }
  }
  const db = readLocalDb();
  db.users.push(user);
  writeLocalDb(db);
}

async function fetchAllLeads(): Promise<any[]> {
  if (db_firestore) {
    try {
      const snap = await getDocs(collection(db_firestore, "leads"));
      const items: any[] = [];
      snap.forEach(d => items.push(d.data()));
      return items;
    } catch (e) {
      console.error("Failed to read leads from Firestore, using local cache:", e);
    }
  }
  return readLocalDb().leads;
}

async function writeLead(lead: any): Promise<void> {
  if (db_firestore) {
    try {
      await setDoc(doc(db_firestore, "leads", lead.id), lead);
      return;
    } catch (e) {
      console.error("Failed to write lead to Firestore:", e);
    }
  }
  const db = readLocalDb();
  const idx = db.leads.findIndex(l => l.id === lead.id);
  if (idx >= 0) db.leads[idx] = lead;
  else db.leads.push(lead);
  writeLocalDb(db);
}

async function deleteLeadFromStore(leadId: string): Promise<void> {
  if (db_firestore) {
    try {
      await deleteDoc(doc(db_firestore, "leads", leadId));
      
      const actSnap = await getDocs(collection(db_firestore, "activities"));
      actSnap.forEach(async d => {
        const item = d.data();
        if (item.leadId === leadId) {
          await deleteDoc(doc(db_firestore, "activities", d.id));
        }
      });
      return;
    } catch (e) {
      console.error("Failed to delete lead from Firestore:", e);
    }
  }
  const db = readLocalDb();
  db.leads = db.leads.filter(l => l.id !== leadId);
  db.activities = db.activities.filter(a => a.leadId !== leadId);
  writeLocalDb(db);
}

async function fetchAllActivities(): Promise<any[]> {
  if (db_firestore) {
    try {
      const snap = await getDocs(collection(db_firestore, "activities"));
      const items: any[] = [];
      snap.forEach(d => items.push(d.data()));
      return items;
    } catch (e) {
      console.error("Failed to read activities from Firestore, using local cache:", e);
    }
  }
  return readLocalDb().activities;
}

async function writeActivity(activity: any): Promise<void> {
  if (db_firestore) {
    try {
      await setDoc(doc(db_firestore, "activities", activity.id), activity);
      return;
    } catch (e) {
      console.error("Failed to write activity to Firestore:", e);
    }
  }
  const db = readLocalDb();
  db.activities.push(activity);
  writeLocalDb(db);
}

app.use(express.json());

// Enable basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Authentication middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'sales';
  };
}

function authMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired authorization token." });
  }
}

// ------------------------- AUTH API -------------------------

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const users = await fetchAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Sign token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed with error: " + err.message });
  }
});

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  const selectedRole = role === "admin" ? "admin" : "sales";

  try {
    const users = await fetchAllUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      name,
      role: selectedRole,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await writeUser(newUser);

    // Sign token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed with error: " + err.message });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ------------------------- LEAD API -------------------------

// GET /api/leads
app.get("/api/leads", authMiddleware, async (req, res) => {
  try {
    const leads = await fetchAllLeads();
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: "Leads retrieval failed: " + err.message });
  }
});

// POST /api/leads
app.post("/api/leads", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const {
    companyName,
    contactPerson,
    designation,
    email,
    phone,
    industry,
    city,
    website,
    leadSource,
    status,
    notes,
    nextFollowUpDate,
  } = req.body;

  if (!companyName || !contactPerson || !email) {
    return res.status(400).json({ error: "Company Name, Contact Person, and Email are required." });
  }

  try {
    const newLead = {
      id: "ld_" + Math.random().toString(36).substr(2, 9),
      companyName,
      contactPerson,
      designation: designation || "Contact Person",
      email,
      phone: phone || "",
      industry: industry || "Other",
      city: city || "",
      website: website || "",
      leadSource: leadSource || "Cold Outreach",
      status: status || "New",
      lastContactDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: nextFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: notes || "",
      meetingOutcome: "",
      creatorId: req.user?.id || "unknown",
      createdAt: new Date().toISOString(),
    };

    await writeLead(newLead);

    // Add auto activity log
    const activity = {
      id: "act_" + Math.random().toString(36).substr(2, 9),
      leadId: newLead.id,
      companyName: newLead.companyName,
      type: "call",
      description: `Added lead to system. Initial Status: ${newLead.status}`,
      performerName: req.user?.name || "System",
      date: new Date().toISOString().split('T')[0],
    };
    await writeActivity(activity);

    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(500).json({ error: "Lead creation failed: " + err.message });
  }
});

// PUT /api/leads/:id
app.put("/api/leads/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const leads = await fetchAllLeads();
    const oldLead = leads.find(l => l.id === id);

    if (!oldLead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    const oldStatus = oldLead.status;

    // Track status transitions of activities
    const leadUpdated = {
      ...oldLead,
      ...updateFields,
      id: oldLead.id,
      creatorId: oldLead.creatorId,
      createdAt: oldLead.createdAt,
    };

    // If status changed, record as activity
    if (updateFields.status && updateFields.status !== oldStatus) {
      const activity = {
        id: "act_" + Math.random().toString(36).substr(2, 9),
        leadId: leadUpdated.id,
        companyName: leadUpdated.companyName,
        type: "meeting", // Generic follow-up status change
        description: `Status changed from '${oldStatus}' to '${updateFields.status}'`,
        performerName: req.user?.name || "System",
        date: new Date().toISOString().split('T')[0],
      };
      await writeActivity(activity);
      leadUpdated.lastContactDate = new Date().toISOString().split('T')[0];
    }

    await writeLead(leadUpdated);
    res.json(leadUpdated);
  } catch (err: any) {
    res.status(500).json({ error: "Lead update failed: " + err.message });
  }
});

// DELETE /api/leads/:id
app.delete("/api/leads/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const leads = await fetchAllLeads();
    const exists = leads.some(l => l.id === id);

    if (!exists) {
      return res.status(404).json({ error: "Lead not found." });
    }

    await deleteLeadFromStore(id);
    res.json({ success: true, message: "Lead and associated activity records successfully deleted." });
  } catch (err: any) {
    res.status(500).json({ error: "Lead deletion failed: " + err.message });
  }
});

// POST /api/leads/:id/activity
app.post("/api/leads/:id/activity", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { type, description } = req.body;

  if (!type || !description) {
    return res.status(400).json({ error: "Activity type and description are required." });
  }

  try {
    const leads = await fetchAllLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    const activity = {
      id: "act_" + Math.random().toString(36).substr(2, 9),
      leadId: id,
      companyName: lead.companyName,
      type: type, // 'email' | 'call' | 'meeting' | 'proposal'
      description: description,
      performerName: req.user?.name || "System",
      date: new Date().toISOString().split('T')[0],
    };

    await writeActivity(activity);
    
    // Also update lead's lastContactDate
    lead.lastContactDate = new Date().toISOString().split('T')[0];
    await writeLead(lead);

    res.status(201).json(activity);
  } catch (err: any) {
    res.status(500).json({ error: "Activity logging failed: " + err.message });
  }
});

// GET /api/activities
app.get("/api/activities", authMiddleware, async (req, res) => {
  try {
    const activities = await fetchAllActivities();
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: "Activities retrieval failed: " + err.message });
  }
});

// ------------------------- AI GENERATORS -------------------------

// Helper for simulated fallback content (if no API Key is added yet)
const Fallbacks = {
  email: {
    "Intro Email": `Subject: Secure and Reliable IT Foundation for [COMPANY] - Veteran-backed

Dear [NAME],

I hope this email finds you well. 

I am Srinivas, an Indian Air Force veteran and the founder of StatLynk Solutions. Having spent decades ensuring extreme mission-readiness and technical reliability in security-critical environments, I now lead a team helping [INDUSTRY] companies resolve high-latency bottlenecks, mitigate cybersecurity vulnerabilities, and optimize AWS clouds.

For [INDUSTRY] clients, a standard 2-hour server downtime can lock out critical processes, disrupt supply lines, or compromise confidential accounts. We provide a customized Server Monitoring & 24/7 Support suite that guarantees absolute continuity.

I would appreciate a brief 10-minute introductory call next Tuesday or Wednesday to discuss your current infrastructure resilience. Would either of these days work for you?

With honor and respect,

Srinivasarao P
Founder & Principal, StatLynk Solutions
Indian Air Force Veteran
Mobile: +91 7014265717
Email: info@statlynksolutions.com | srinivasaraop@statlynksolutions.com`,

    "Follow-up Email": `Subject: Quick Follow-Up: Bulletproof IT & Cloud hosting for [COMPANY]

Dear [NAME],

I wanted to quickly follow up on my previous note. I understand that as a leader in [INDUSTRY], your schedule is demanding.

Many of our partners originally believed their IT infrastructure was "safe enough," only to face severe, unexpected latency during high-traffic quarters. At StatLynk, we replace assumptions with mission-proven VAPT checklists and server redundancies.

Could we schedule a rapid, non-invasive systems assessment next week? It takes less than 15 minutes and carries no commitment.

Best regards,

Srinivasarao P
Founder, StatLynk Solutions
Mobile: +91 7014265717
Email: info@statlynksolutions.com | srinivasaraop@statlynksolutions.com`,

    "Meeting Request Email": `Subject: Connecting next week? StatLynk Solutions IT Audit call

Dear [NAME],

Following up on our brief interaction, I would love to lock in a time for our technical consultation as scheduled. 

We will focus on three key questions customized for [COMPANY]:
1. Root-cause latency spikes in your cloud databases.
2. Compliance VAPT checkpoints relevant to the [INDUSTRY] sector.
3. Easy measures to lower monthly cloud billing.

Please let me know if Thursday at 11:30 AM IST or Friday at 3:00 PM IST aligns with your schedule.

Sincerely,

Srinivasarao P
StatLynk Solutions
Mobile: +91 7014265717
Email: info@statlynksolutions.com`,

    "Proposal Follow-up": `Subject: Discussion on our IT/Cloud Consulting proposal for [COMPANY]

Dear [NAME],

I hope you've had a chance to look over the AWS/IT service proposal we sent relative to [COMPANY]'s operations.

Our tiered support strategy is designed to integrate seamless server monitoring without causing friction to your day-to-day operations. Our response times are backed by tight SLAs, forged with Air Force military discipline.

I would love to arrange a quick call to address any questions, clarify our custom parameters, or modify specific line items to fit your target budget. 

Are you free for ten minutes this coming Monday?

Warm regards,

Srinivasarao P
StatLynk Solutions
Mobile: +91 7014265717
Email: info@statlynksolutions.com | srinivasaraop@statlynksolutions.com`
  },

  script: {
    "opening": `Good morning [PREFIX] [NAME]. I am Srinivas, an Indian Air Force veteran and the founder of StatLynk Solutions. We specialize in helping [INDUSTRY] firms improve server uptime, lower AWS billing, and secure customer databases. I noticed your company's growing operations, and wanted to see if we could secure your tech backbone.`,
    "discovery": `1. "Do you currently have real-time 24/7 server monitoring alerts, or do you only find out a database is down when users start filing complaints?"
2. "As a key player in [INDUSTRY], how frequently does your software face sluggish loads or transient delays during high peak seasons?"
3. "Are you compliant with the latest cybersecurity guidelines, and when was your last professional VAPT security audit conducted?"`,
    "objections": `Objection 1: "We already have an in-house IT manager."
-> Response: "That is excellent. Most of our partners have brilliant in-house teams. StatLynk isn't here to replace them; we act as their tactical support. We provide them with advanced 24/7 automated monitoring alerts and cyber backup, freeing them up to focus on your core business features."

Objection 2: "We don't have the budget for external security/cloud support."
-> Response: "I completely appreciate that. Budget discipline is essential. In fact, our cloud optimization audit frequently uncovers wasted AWS assets, routinely saving clients 20% to 35% on their cloud bills. We usually pay for our own services just from your cloud savings."`,
    "closing": `It sounds like you have some excellent initiatives going. Let's arrange a quick 10-minute technical audit call next Wednesday at 2:00 PM. I will lead the audit myself and pinpoint exactly where you might be leaking hosting costs or risking security. I'll email a calendar lock-in right now.`
  },

  linkedin: {
    AWS: `🚨 Cloud budgets are bleeding silently. Here is how AWS ruins your margins if left unmonitored:

1. **Orphaned EBS Volumes**: When you terminate an EC2 instance, its storage volumes often persist behind, charging you every single minute.
2. **Over-Provisioned DB Instances**: Running a high-grade RDS 24/7 when your traffic is strictly diurnal is a massive waste. Use scheduled sleeping triggers.
3. **Unused NAT Gateways**: They bill idle hourly runtime costs. Make sure they are cleaned up or consolidated.

At StatLynk Solutions, we audit and optimize enterprise AWS architectures, consistently delivering 20%-40% savings without hurting speeds. Veteran commitment, zero puff.

#CloudComputing #AWS #CloudCost #DevOps #StatLynk`,

    Linux: `🐧 The secret to bulletproof server reliability is proactive health check cycles. A crash on a production Linux node is never a random accident.

Are you tracking these critical vectors daily?
💾 **Inode exhausting**: Having disk storage is irrelevant if your inodes are full. System logs or session files can saturate your inode table and freeze processes instantly.
🧠 **OOM Killer triggers**: Understand why your database processes get suddenly terminated by the Out-Of-Memory subsystem.
📊 **Zombie processes**: Build automated alerts to kill stray, parentless loops stealing valuable CPU cycles.

StatLynk Solutions delivers custom automated active Linux telemetry so outages never take you by surprise. 

#LinuxAdmin #SysAdmin #ServerMonitoring #Linux #StatLynk`,

    Cybersecurity: `🛡️ "We are too small to be a cyber target." - This is the most dangerous assumption an enterprise founder can make.

Automated botnets do not look at your revenue; they look at your ports. Here are 3 immediate security gates every CTO must verify today:
1. **Database exposure**: Ensure your staging and production DBs are bound strictly to private subnets with robust firewalls, not exposed directly to the public web.
2. **Static credentials**: Hardcoded credentials inside git code repositories are a main gateway for ransomware. Implement dynamic secret rotates.
3. **Audit lacking**: Have you done a professional VAPT (Vulnerability Assessment and Penetration Testing) this year?

At StatLynk Solutions, we apply veteran combat-disciplined security checklists to protect your business assets.

#Cybersecurity #Infosec #CISO #VAPT #StatLynk`
  },

  proposal: {
    "IT Support": {
      summary: "High-grade 24/7 automated server monitoring, OS patching, backup management, and priority troubleshooting. Tailored for scalable multi-tier architectures.",
      scope: "• Setup of automated uptime and endpoint metrics probes\n• 24x7 escalation line on alert breaches\n• Bi-weekly OS configuration audits & package updates\n• Encrypted and automated daily database backups with cold-storage redundancies\n• SLA guarantee: 30 minutes critical incident response",
      fees: "• Starter: ₹15,000/month (Up to 3 servers)\n• Professional: ₹35,000/month (Up to 10 servers + 5 databases)\n• Enterprise SLA Dedicated: Custom pricing."
    },
    "AWS Consulting": {
      summary: "Comprehensive architecture review using AWS Well-Architected Framework, security isolation, cloud cost optimization, and transition to serverless.",
      scope: "• Detailed audit of IAM roles, public portals, security groups\n• Billing log digestion and dynamic tagging setup\n• Dynamic Auto-scaling configurations to match demand curves\n• Optimization of unutilized resources resulting in 20%-40% hosting cost reduction",
      fees: "• One-time Optimization Audit: ₹45,000\n• Full Architecture Overhaul & Setup: ₹1,20,000\n• Monthly Managed Cost Optimizer: ₹20,000/month Plus 10% of proven savings."
    }
  }
};

// POST /api/ai/email
app.post("/api/ai/email", async (req, res) => {
  const { companyName, industry, contactName, designation, type_email } = req.body;
  
  const clientName = contactName || "Director";
  const clientDesignation = designation || "Executive";
  const clientIndustry = industry || "Enterprise";
  const clientCompany = companyName || "ABC Solutions";
  const emailType = type_email || "Intro Email"; // 'Intro Email' | 'Follow-up Email' | 'Meeting Request Email' | 'Proposal Follow-up'

  if (ai) {
    try {
      const prompt = `You are Srinivasarao P, an Indian Air Force veteran and the founder of StatLynk Solutions (a specialist IT support, AWS consulting, VAPT / Cybersecurity audit, server monitoring, cloud cost optimization, and Linux support provider). Your mobile is 7014265717, and your primary emails are info@statlynksolutions.com and srinivasaraop@statlynksolutions.com (secondary contact options: srinivasarao.p230883@gmail.com, statlynksolutions@gmail.com).
      
      Generate a professional, highly personalized, and compelling email of type "${emailType}" addressed to ${clientName} (${clientDesignation} at ${clientCompany}).
      Their company is in the ${clientIndustry} industry.
      
      Requirements:
      1. Tailor the content specifically to technical challenges faced by the ${clientIndustry} industry. Highlight issues such as high-availability uptime, cybersecurity risks, database reliability, server backups, or cloud cost drain.
      2. Keep the tone warm, respect-driven, highly competent, resolute, and veteran-backed (use background as Indian Air Force veteran gracefully to express absolute trust, discipline, and execution reliability).
      3. Include a very clear, low-friction, confident Call-to-Action (SLA guarantee or brief introducing call).
      4. DO NOT use generic fields or template markers like [Insert Website Here] or [Insert Phone Number]. Write dynamic details explicitly:
         - Founder: Srinivasarao P
         - Company: StatLynk Solutions
         - Mobile/WhatsApp: +91 7014265717
         - Primary Email: info@statlynksolutions.com
         - Alternate Email: srinivasaraop@statlynksolutions.com
         - Secondary Backups: srinivasarao.p230883@gmail.com / statlynksolutions@gmail.com
      5. Do not write markdown tags or instructions in the response, just return the finalized full subject in the first line "Subject: <subject>" followed by the complete email body.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      return res.json({ result: text });
    } catch (error: any) {
      console.error("Gemini API error in Email Generator:", error);
    }
  }

  // Fallback
  let emailTemplate = Fallbacks.email["Intro Email"];
  if (emailType.includes("Follow-up")) {
    emailTemplate = Fallbacks.email["Follow-up Email"];
  } else if (emailType.includes("Meeting")) {
    emailTemplate = Fallbacks.email["Meeting Request Email"];
  } else if (emailType.includes("Proposal")) {
    emailTemplate = Fallbacks.email["Proposal Follow-up"];
  }

  const customized = emailTemplate
    .replace(/\[COMPANY\]/g, clientCompany)
    .replace(/\[NAME\]/g, clientName)
    .replace(/\[INDUSTRY\]/g, clientIndustry);

  res.json({ result: customized });
});

// POST /api/ai/script
app.post("/api/ai/script", async (req, res) => {
  const { industry, designation } = req.body;
  const targetIndustry = industry || "Education";
  const targetDesignation = designation || "Principal";

  if (ai) {
    try {
      const prompt = `You are Srinivasarao P, an Indian Air Force veteran and founder of StatLynk Solutions (providing cybersecurity, Linux server maintenance, database optimization, AWS cost reductions, and SLA-backed IT monitoring). Your mobile is 7014265717 and primary emails are info@statlynksolutions.com and srinivasaraop@statlynksolutions.com.
      
      Generate an excellent, industry-specific sales calling script targeting a ${targetDesignation} in the ${targetIndustry} sector.
      
      The returned script must contain:
      1. Opening Statement: A warm, authentic veteran introduction explaining StatLynk Solutions. Mention your direct line +91 7014265717 for questions.
      2. Discovery Questions: 3 high-impact questions focused on IT downtime, cybersecurity, active monitoring, or AWS cloud waste issues specific to ${targetIndustry} (e.g. parent portal uptime for schools, secure checkout and database speeds for retail, accounting HIPAA/cyber-resilience for finance).
      3. Objection Handling: Prepare professional responses to 2 key objections (e.g., "We already have an in-house person" or "Everything is working fine right now").
      4. Meeting Booking Script: Confident, low-pressure closing pitch to request a 10-minute technical audit call.
      
      Maintain a professional, clean, structured layout.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      return res.json({ result: text });
    } catch (error) {
      console.error("Gemini API error in Script Generator:", error);
    }
  }

  // Fallback
  const prefix = targetDesignation.toLowerCase().includes("principal") || targetDesignation.toLowerCase().includes("director") ? "sir/madam" : targetDesignation;
  const opening = Fallbacks.script.opening.replace(/\[NAME\]/g, prefix).replace(/\[INDUSTRY\]/g, targetIndustry);
  const discovery = Fallbacks.script.discovery.replace(/\[INDUSTRY\]/g, targetIndustry);
  
  const customized = `### 📞 Call Script: StatLynk Solutions Outreach
**Target:** ${targetDesignation} (${targetIndustry} Sector)
**Presenter:** Srinivas, IAF Veteran & Founder

---

#### 1. Opening Statement (Warm Veteran Introduction)
"${opening}"

#### 2. Strategic Discovery Questions
${discovery}

#### 3. Objection Handling (Common Bottlenecks)
${Fallbacks.script.objections}

#### 4. Confident Booking Closing
"${Fallbacks.script.closing}"`;

  res.json({ result: customized });
});

// POST /api/ai/proposal
app.post("/api/ai/proposal", async (req, res) => {
  const { companyName, industry, type } = req.body;
  const clientCompany = companyName || "Target Company";
  const clientIndustry = industry || "Enterprise Tech";
  const proposalType = type || "IT Support Proposal"; // 'IT Support Proposal' | 'AWS Consulting Proposal' | 'VAPT Proposal' | 'Cloud Migration Proposal'

  if (ai) {
    try {
      const prompt = `Generate a comprehensive professional service proposal document from StatLynk Solutions for potential client ${clientCompany} operating in the ${clientIndustry} industry.
      
      The firm is founded by Srinivasarao P, Indian Air Force veteran. Contact Details: Mobile: +91 7014265717, Emails: info@statlynksolutions.com, srinivasaraop@statlynksolutions.com.
      
      Proposal Focus: ${proposalType}
      
      Please write a highly polished, complete pitch styled with veteran-standard technical precision. The proposal should include:
      1. Executive Summary: Connecting StatLynk's high-reliability server management & military discipline to ${clientCompany}'s business aspirations. Include clear author citation: Srinivasarao P, Veteran & Founder.
      2. Technical Scope of Work: Bulletpoint roadmap of actual setup, server monitoring metrics, security audits, database backups & AWS optimizing parameters customized to ${clientCompany}.
      3. Service Levels & Response Guarantees: Custom response SLAs backed by 24x7 helpdesk.
      4. Pricing Tiers: Clear professional fee sections structured in Rupees (e.g. Starter, Professional, Enterprise tiers) as suitable for a leading Indian IT consulting firm.
      5. Official Contact blocks inside closing:
         - Founder: Srinivasarao P
         - Mobile Phone: +91 7014265717
         - Authorized Emails: info@statlynksolutions.com / srinivasaraop@statlynksolutions.com
      
      Do not include meta-tags, write a directly readable proposal in elegant Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      return res.json({ result: text });
    } catch (error) {
      console.error("Gemini API error in Proposal Generator:", error);
    }
  }

  // Fallback
  const content = proposalType.includes("AWS") ? Fallbacks.proposal["AWS Consulting"] : Fallbacks.proposal["IT Support"];
  const customized = `# Business & Technical Proposal
**Prepared For:** ${clientCompany} (${clientIndustry} Industry)
**Prepared By:** StatLynk Solutions, Bangalore
**Author:** Srinivasarao P, Founder & IAF Veteran
**Contact Number:** +91 7014265717
**Official Emails:** info@statlynksolutions.com | srinivasaraop@statlynksolutions.com
**Date:** June 16, 2026
**Focus:** ${proposalType}

---

## 1. Executive Summary
At StatLynk Solutions, we believe that digital infrastructure demands the same mission-readiness, operational discipline, and technical perfection required in military operations. 

We understand that for a leader in ${clientIndustry}, unmonitored IT components pose severe business risk: from unexpected database bottlenecks to critical data leaks. This proposal details how StatLynk will manage, secure, and optimize ${clientCompany}'s systems.

## 2. Objective & Focus
${content.summary}

## 3. Scope of Work (Custom Deliverables)
${content.scope}

## 4. Why StatLynk Solutions?
- **Veteran Leadership**: Led by Srinivasarao P (ex-Indian Air Force), bringing process-driven technical discipline.
- **Continuous Telemetry**: 24/7 automated server alerts mean we resolve vulnerabilities *before* you experience down times.
- **SLA-backed Guarantee**: Clear, contracted metrics on speeds and security.
- **Helpline**: +91 7014265717 | info@statlynksolutions.com

## 5. Professional Fees
${content.fees}

---
*Thank you for the opportunity to partner with your team. We look forward to securing your digital expansion. Contact us directly at +91 7014265717 or info@statlynksolutions.com to approve this commission.*`;

  res.json({ result: customized });
});

// POST /api/ai/linkedin
app.post("/api/ai/linkedin", async (req, res) => {
  const { topic } = req.body;
  const currentTopic = topic || "Cybersecurity"; // 'AWS' | 'Linux' | 'DevOps' | 'Cybersecurity' | 'Cloud Cost Optimization' | 'Server Monitoring'

  if (ai) {
    try {
      const prompt = `You are writing a LinkedIn post as the founder/lead expert at StatLynk Solutions (a specialist managed service and security consulting company led by Srinivas, an IAF veteran).
      
      Generate an attractive, educational, and high-impact LinkedIn post on: "${currentTopic}".
      
      Requirements:
      1. Hook the viewer in the first sentence with a bold statement.
      2. Detail 3 highly valuable, actionable technical advice or insights relevant to administrators or startup CTOs.
      3. Gracefully align these tips with StatLynk Solutions' expertise in server telemetry, VAPT auditing, or cloud margin relief.
      4. End with a professional call-to-action invitation.
      5. Include 4 relevant high-quality hashtags.
      6. Do not overload with emojis. Make it look professional, clean, and thought-leadership grade.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      return res.json({ result: text });
    } catch (error) {
      console.error("Gemini API error in LinkedIn Generator:", error);
    }
  }

  // Fallback
  let post = Fallbacks.linkedin.Cybersecurity;
  if (currentTopic.includes("AWS") || currentTopic.toLowerCase().includes("cost")) {
    post = Fallbacks.linkedin.AWS;
  } else if (currentTopic.toLowerCase().includes("linux") || currentTopic.toLowerCase().includes("monitoring")) {
    post = Fallbacks.linkedin.Linux;
  }
  res.json({ result: post });
});


// ----------------- DASHBOARD ANALYTICS API -----------------

// GET /api/dashboard/analytics
app.get("/api/dashboard/analytics", authMiddleware, async (req, res) => {
  try {
    const leads = await fetchAllLeads();
    const activities = await fetchAllActivities();

    const emailsSent = activities.filter(a => a.type === "email").length;
    const callsMade = activities.filter(a => a.type === "call").length;
    const proposalsSent = activities.filter(a => a.type === "proposal").length;
    
    // Custom formula for meetings booked based on status
    const meetingsBooked = leads.filter(l => l.status === "Meeting Scheduled" || l.status === "Proposal Sent" || l.status === "Won").length;

    // Revenue pipeline calculation
    let revenuePipeline = 0;
    leads.forEach(l => {
      if (l.status === "Won") revenuePipeline += 150000;
      else if (l.status === "Proposal Sent") revenuePipeline += 85000;
      else if (l.status === "Meeting Scheduled") revenuePipeline += 50000;
      else if (l.status === "Follow-up 1" || l.status === "Follow-up 2") revenuePipeline += 30000;
      else if (l.status === "Contacted") revenuePipeline += 15000;
    });

    // Calculate leads to contact today
    const todayStr = new Date().toISOString().split('T')[0];
    const leadsToContactToday = leads.filter(l => l.nextFollowUpDate === todayStr && l.status !== "Won" && l.status !== "Lost").length;

    // Calculate pending followups
    const pendingFollowups = leads.filter(l => {
      return l.nextFollowUpDate < todayStr && l.status !== "Won" && l.status !== "Lost";
    }).length;

    // Scheduled upcoming meetings
    const meetingsScheduledCount = leads.filter(l => l.status === "Meeting Scheduled").length;

    // Monthly breakdown trend data for recharts
    const chartData = [
      { name: "Jan", revenue: 45000, leads: 5, sentNew: 2 },
      { name: "Feb", revenue: 80000, leads: 8, sentNew: 4 },
      { name: "Mar", revenue: 110000, leads: 12, sentNew: 6 },
      { name: "Apr", revenue: 165000, leads: 17, sentNew: 9 },
      { name: "May", revenue: 230000, leads: 22, sentNew: 14 },
      { name: "Jun", revenue: revenuePipeline, leads: leads.length, sentNew: leads.filter(l => l.status === "New").length },
    ];

    res.json({
      metrics: {
        emailsSent,
        callsMade,
        meetingsBooked,
        proposalsSent,
        revenuePipeline,
        leadsToContactToday,
        pendingFollowups,
        meetingsScheduledCount
      },
      chartData
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load dashboard analytics: " + err.message });
  }
});


// ----------------------- EXPORTS & PLUGINS -----------------------

async function startServer() {
  // First seed Firestore database if it is running-online
  await seedFirestoreIfNeeded();

  // Vite middleware development mode integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StatLynk CRM Server booted with honor on http://0.0.0.0:${PORT}`);
  });
}

startServer();
