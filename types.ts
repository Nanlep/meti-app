
export enum AppStep {
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  NICHE = 'NICHE',
  PERSONA = 'PERSONA',
  MAGNETS = 'MAGNETS',
  CONVERSION = 'CONVERSION', // Consolidated Engine (Replaces LEADS, SALES, QUAL, FOLLOWUP)
  CRM = 'CRM',
  ADS = 'ADS',
  SEO = 'SEO',
  EMAIL = 'EMAIL',
  LANDING = 'LANDING',
  REPORT = 'REPORT',
  PRICING = 'PRICING',
  ADMIN = 'ADMIN',
  GUIDE = 'GUIDE',
  SETTINGS = 'SETTINGS',
  // Deprecated but kept for type safety if needed temporarily
  LEADS = 'LEADS',
  SALES = 'SALES',
  QUALIFICATION = 'QUALIFICATION',
  FOLLOWUP = 'FOLLOWUP'
}

export interface AccountManager {
  name: string;
  email: string;
  phone: string;
  avatarInitials?: string;
}

export interface UserUsage {
  tokensUsed: number;
  costEstimate: number; // In USD
  periodStart: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  subscription: 'hobby' | 'pro' | 'agency'; 
  subscriptionStatus: 'active' | 'trialing' | 'expired'; 
  trialStartDate?: number; 
  organizationId: string;
  lastLogin: number;
  status?: 'active' | 'suspended';
  accountManager?: AccountManager; // Assigned by Super Admin
  agencyLogoUrl?: string; // Custom Branding (Agency Only)
  agencyName?: string; // Custom Branding (Agency Only)
  adBrandLogoUrl?: string; // Brand Asset for Ads (All Users)
  usage: UserUsage; // Added for Cost Control
}

export interface Client {
  id: string;
  userId: string; // The Agency Owner
  name: string;
  industry?: string;
  contactPerson?: string;
  email?: string;
  status: 'active' | 'inactive';
  onboardingDate: number;
  notes?: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: 'user' | 'admin';
  text: string;
  timestamp: number;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'technical' | 'billing' | 'feature' | 'other';

export interface Ticket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  createdAt: number;
  lastUsed?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: number;
  ipAddress: string;
  status: 'success' | 'failure';
}

export interface NicheSuggestion {
  name: string;
  profitabilityScore: number;
  reasoning: string;
  marketSizeEstimate: string;
}

export interface PersonaProfile {
  jobTitle: string;
  ageRange: string;
  psychographics: string[];
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
}

export interface LeadMagnet {
  title: string;
  type: 'Ebook' | 'Webinar' | 'Checklist' | 'Consultation' | 'Video_Course' | 'Tool';
  hook: string;
  description: string;
  contentDraft?: string;
  // Publishing Fields
  status?: 'draft' | 'published';
  smartLink?: string; // The simulated email capture URL
  publishedAt?: number;
  publishedPlatforms?: string[];
}

export interface QualificationQuestion {
  question: string;
  intent: string;
  idealAnswer: string;
}

export interface FollowUpEmail {
  subject: string;
  previewText: string;
  body: string;
  sendDelay: string;
}

export interface SocialSearchQuery {
  platform: string;
  query: string;
  explanation: string;
  directUrl: string;
}

export interface LocalBusinessResult {
  text: string;
  mapChunks: Array<{
    web?: { uri: string; title: string };
    maps?: { 
      uri: string; 
      title: string; 
      placeId?: string;
      placeAnswerSources?: {
        reviewSnippets?: Array<{
          content: string;
          author?: string;
        }>
      }
    };
  }>;
}

export interface LandingPage {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  benefits: Array<{ title: string; description: string }>;
  heroImagePrompt: string;
  socialProof: Array<{ name: string; quote: string; role: string }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AdPlatform = 'LinkedIn' | 'Twitter' | 'Facebook' | 'Instagram' | 'TikTok' | 'ProductHunt';

export interface DailyAdMetric {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number; // percentage
  spend: number;
  conversions: number;
  roi: number; // percentage
  history?: DailyAdMetric[]; // For charts
}

export interface AdCreative {
  platform: AdPlatform;
  headline: string;
  adCopy: string;
  hashtags: string[];
  visualPrompt: string; 
  imageUrl?: string; 
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'posted';
  scheduledTime?: string;
  postedAt?: number; 
  postId?: string; 
  metrics?: AdMetrics; 
}

export type CRMStage = 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Retention';

export interface LeadItem {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  source: string;
  stage: CRMStage;
  value: number;
  probability: number;
  notes: string;
  addedAt: number;
}

// SEO Specific Types
export interface KeywordData {
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  volume: string; // Range e.g., "1k-10k"
  difficulty: number; // 0-100
  opportunityScore: number;
}

export interface SeoAuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'Technical' | 'On-Page' | 'Speed' | 'Mobile';
  issue: string;
  recommendation: string;
}

export interface SeoContentScore {
  score: number;
  suggestions: string[];
  keywordDensity: number;
  readability: string;
  missingKeywords: string[];
}

// Email Marketing Types
export interface EmailStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  content: string; // HTML or Markdown
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: number;
  audienceSegment: string;
  stats: EmailStats;
}

export interface AutomationNode {
  id: string;
  type: 'email' | 'delay' | 'condition';
  data: {
    delayTime?: string;
    emailSubject?: string;
    emailBody?: string;
  };
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string; // e.g., "New Lead", "Magnet Download"
  active: boolean;
  nodes: AutomationNode[];
  enrolledCount: number;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: 'CRM' | 'Upload' | 'Manual';
  tags: string[];
  joinedAt: number;
}

export interface EmailSettings {
  provider: 'SendGrid' | 'AWS SES' | 'Mailgun' | 'SMTP';
  apiKey?: string;
  fromName: string;
  fromEmail: string;
  connected: boolean;
}

export interface ProjectData {
  productName: string;
  productDescription: string;
  productUrl?: string; // Direct linking
  productPrice?: number; // Price for Revenue calculation
  selectedNiche: NicheSuggestion | null;
  generatedNiches: NicheSuggestion[];
  persona: PersonaProfile | null;
  generatedMagnets: LeadMagnet[];
  qualificationFramework: QualificationQuestion[];
  followUpSequence: FollowUpEmail[];
  leadSearchResults?: LocalBusinessResult | null;
  socialSearchQueries?: SocialSearchQuery[];
  landingPage?: LandingPage | null;
  adCampaigns?: AdCreative[]; 
  connectedPlatforms?: AdPlatform[];
  crmLeads?: LeadItem[];
  connectedCrms?: string[];
  // SEO Data
  seoKeywords?: KeywordData[];
  seoAuditResults?: SeoAuditIssue[];
  seoContentAnalysis?: SeoContentScore;
  // Email Marketing Data
  emailCampaigns?: EmailCampaign[];
  emailAutomations?: AutomationWorkflow[];
  emailSubscribers?: Subscriber[];
  emailSettings?: EmailSettings;
  // Sales specific (New consolidated)
  salesObjections?: string[];
  salesColdDms?: string[];
}

export interface Project {
  id: string;
  userId: string;
  teamMembers: string[];
  client?: string; // Stores Client Name (Legacy/Simple)
  clientId?: string; // Links to Client Entity (New)
  name: string;
  createdAt: number;
  lastModified: number;
  status: 'draft' | 'active' | 'completed';
  data: ProjectData;
}
