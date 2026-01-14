
import { NicheSuggestion, PersonaProfile, LeadMagnet, QualificationQuestion, FollowUpEmail, SocialSearchQuery, LocalBusinessResult, LandingPage, ChatMessage, AdCreative, KeywordData, SeoAuditIssue, SeoContentScore, EmailCampaign, SeoAuditResponse } from "../types";
import { authService, getApiUrl } from "./authService";

/**
 * METI INTELLIGENCE BRIDGE
 * Secure, authenticated transport layer to the Meti Inference Engine (Backend).
 */

export enum AgentID {
  NICHE = 'niche',
  PERSONA = 'persona',
  MAGNETS = 'magnets',
  MAGNET_CONTENT = 'magnet_content',
  MAGNET_PROMO = 'magnet_promo',
  MAPS_SCOUT = 'maps_scout',
  SOCIAL_SEARCH = 'social_search',
  QUALIFICATION = 'qualification',
  OBJECTION = 'objection_handler',
  COLD_DMS = 'cold_dms',
  FOLLOW_UP = 'follow_up',
  CHAT = 'chat_reply',
  LANDING = 'landing_page',
  ADS = 'ad_creatives',
  EMAIL_CAMPAIGN = 'email_campaign',
  SUBJECT_LINES = 'subject_lines',
  SEO_AUDIT = 'seo_audit',
  SEO_KEYWORDS = 'seo_keywords',
  CONTENT_SCORE = 'content_score'
}

const executeAI = async <T>(agent: string, payload: any): Promise<T> => {
  const token = authService.getToken();
  if (!token) {
    throw new Error("Authentication required for AI services.");
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  try {
    const response = await fetch(`${getApiUrl()}/api/ai/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agent, payload })
    });

    if (response.status === 404) {
        throw new Error(`Deployment Error: Agent '${agent}' is not registered in the Meti Core Registry.`);
    }

    if (response.status === 401 || response.status === 403) {
      authService.logout();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `AI Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data as T;
  } catch (e: any) {
    console.error(`Meti AI Bridge Error [Agent: ${agent}]:`, e.message);
    throw e;
  }
};

// --- STRATEGY AGENTS ---
export const generateNiches = (productName: string, description: string, options?: any): Promise<NicheSuggestion[]> => {
  return executeAI(AgentID.NICHE, { productName, description, ...options });
};

export const generatePersona = (productName: string, niche: any, refinement?: string): Promise<PersonaProfile> => {
  return executeAI(AgentID.PERSONA, { productName, niche: niche.name, refinement });
};

export const generateLeadMagnets = (productName: string, nicheName: string, persona: PersonaProfile): Promise<LeadMagnet[]> => {
  return executeAI(AgentID.MAGNETS, { productName, nicheName, persona: persona.jobTitle });
};

// --- CONVERSION AGENTS ---
export const searchLocalBusinesses = (niche: string, location: string, coords?: { lat: number, lng: number }): Promise<LocalBusinessResult> => {
  return executeAI(AgentID.MAPS_SCOUT, { niche, location, coords });
};

export const generateSocialSearchQueries = (persona: PersonaProfile, niche: string): Promise<SocialSearchQuery[]> => {
  return executeAI(AgentID.SOCIAL_SEARCH, { persona, niche });
};

export const generateQualification = (productName: string, persona: PersonaProfile): Promise<QualificationQuestion[]> => {
  return executeAI(AgentID.QUALIFICATION, { productName, persona: persona.jobTitle });
};

export const handleObjection = (objection: string, productName: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI(AgentID.OBJECTION, { objection, productName, persona: persona.jobTitle });
};

export const generateColdDMs = (productName: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI(AgentID.COLD_DMS, { productName, persona: persona.jobTitle });
};

export const generateFollowUp = (productName: string, persona: PersonaProfile, other: any): Promise<FollowUpEmail[]> => {
  return executeAI(AgentID.FOLLOW_UP, { productName, persona: persona.jobTitle });
};

// --- CHAT & ROLEPLAY ---
export const sendChatMessage = async (history: ChatMessage[], productName: string, persona: PersonaProfile): Promise<string> => {
  const result = await executeAI<any>(AgentID.CHAT, { history, productName, persona: persona.jobTitle });
  return typeof result === 'string' ? result : (result as any).text || "...";
};

/**
 * Added sendChatMessageStream to fix StepConversion error. 
 * Since the current backend uses standard HTTP, we simulate streaming by returning the full result.
 */
export const sendChatMessageStream = async (
  history: ChatMessage[], 
  productName: string, 
  persona: PersonaProfile, 
  onChunk: (chunk: { text: string, sources?: any[] }) => void
): Promise<void> => {
  const result = await executeAI<any>(AgentID.CHAT, { history, productName, persona: persona.jobTitle });
  if (typeof result === 'object' && result.text) {
    onChunk({ text: result.text, sources: result.sources });
  } else {
    onChunk({ text: typeof result === 'string' ? result : "..." });
  }
};

// --- ASSET AGENTS ---
export const generateLandingPage = (productName: string, niche: NicheSuggestion, persona: PersonaProfile): Promise<LandingPage> => {
  return executeAI(AgentID.LANDING, { productName, niche, persona: persona.jobTitle });
};

export const generateAdCreatives = (productName: string, niche: NicheSuggestion, persona: PersonaProfile, url?: string): Promise<AdCreative[]> => {
  return executeAI(AgentID.ADS, { productName, niche, persona: persona.jobTitle, url });
};

// --- CONTENT GENERATION ---
export const generateMagnetContent = async (magnet: LeadMagnet, persona: PersonaProfile, nicheName: string, productName: string): Promise<string> => {
  return executeAI(AgentID.MAGNET_CONTENT, { magnet, persona: persona.jobTitle, nicheName, productName });
};

export const generateMagnetPromo = async (magnet: LeadMagnet, persona: PersonaProfile, platform: string, link: string): Promise<string> => {
  return executeAI(AgentID.MAGNET_PROMO, { magnet, persona: persona.jobTitle, platform, link });
};

// --- EMAIL AGENTS ---
export const generateEmailCampaignContent = (productName: string, persona: PersonaProfile, topic: string, goal: string): Promise<{ subject: string, body: string }> => {
  return executeAI(AgentID.EMAIL_CAMPAIGN, { productName, persona: persona.jobTitle, topic, goal });
};

export const optimizeSubjectLines = (topic: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI(AgentID.SUBJECT_LINES, { topic, persona: persona.jobTitle });
};

export const generateEmailSequence = (productName: string, persona: PersonaProfile, goal: string): Promise<FollowUpEmail[]> => {
  return executeAI(AgentID.FOLLOW_UP, { productName, persona: persona.jobTitle, goal });
};

// --- GROWTH AGENTS ---
/**
 * Updated return type to SeoAuditResponse to fix StepSEO errors.
 */
export const generateSeoAudit = (url: string, productName: string): Promise<SeoAuditResponse> => {
  return executeAI(AgentID.SEO_AUDIT, { url, productName });
};

export const generateKeywordStrategy = (seed: string, niche: string, persona: PersonaProfile): Promise<KeywordData[]> => {
  return executeAI(AgentID.SEO_KEYWORDS, { seed, niche, persona: persona.jobTitle });
};

export const analyzeContentSeo = (content: string, keyword: string): Promise<SeoContentScore> => {
  return executeAI(AgentID.CONTENT_SCORE, { content, keyword });
};
