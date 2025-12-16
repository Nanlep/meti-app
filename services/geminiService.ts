
import { NicheSuggestion, PersonaProfile, LeadMagnet, QualificationQuestion, FollowUpEmail, SocialSearchQuery, LocalBusinessResult, LandingPage, ChatMessage, AdCreative, KeywordData, SeoAuditIssue, SeoContentScore, EmailCampaign } from "../types";
import { authService, getApiUrl } from "./authService";

/**
 * SECURE AI BRIDGE
 * Encrypted transport to Backend-for-Frontend (BFF)
 */
const executeAI = async <T>(agent: string, payload: any): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeader()
  };
  
  try {
    const response = await fetch(`${getApiUrl()}/api/ai/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agent, payload })
    });

    if (!response.ok) {
      throw new Error(`AI Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data as T;
  } catch (e) {
    console.error(`Failed to execute AI agent: ${agent}`, e);
    throw e;
  }
};

// --- STRATEGY AGENTS ---
export const generateNiches = (productName: string, description: string, options?: any): Promise<NicheSuggestion[]> => {
  return executeAI('niche', { productName, description, ...options });
};

export const generatePersona = (productName: string, niche: any, refinement?: string): Promise<PersonaProfile> => {
  return executeAI('persona', { productName, niche: niche.name, refinement });
};

export const generateLeadMagnets = (productName: string, nicheName: string, persona: PersonaProfile): Promise<LeadMagnet[]> => {
  return executeAI('magnets', { productName, nicheName, persona: persona.jobTitle });
};

// --- CONVERSION AGENTS ---
export const searchLocalBusinesses = (niche: string, location: string, coords?: { lat: number, lng: number }): Promise<LocalBusinessResult> => {
  return executeAI('maps_scout', { niche, location, coords });
};

export const generateSocialSearchQueries = (persona: PersonaProfile, niche: string): Promise<SocialSearchQuery[]> => {
  return executeAI('social_search', { persona, niche });
};

export const generateQualification = (productName: string, persona: PersonaProfile): Promise<QualificationQuestion[]> => {
  return executeAI('qualification', { productName, persona: persona.jobTitle });
};

export const handleObjection = (objection: string, productName: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI('objection_handler', { objection, productName });
};

export const generateColdDMs = (productName: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI('cold_dms', { productName, persona });
};

export const generateFollowUp = (productName: string, persona: PersonaProfile, other: any): Promise<FollowUpEmail[]> => {
  return executeAI('follow_up', { productName, persona: persona.jobTitle });
};

export const sendChatMessage = async (history: ChatMessage[], productName: string, persona: PersonaProfile): Promise<string> => {
  const result = await executeAI<{text?: string} | string>('chat_reply', { history, productName, persona });
  return typeof result === 'string' ? result : (result.text || "...");
};

// --- ASSET AGENTS ---
export const generateLandingPage = (productName: string, niche: NicheSuggestion, persona: PersonaProfile): Promise<LandingPage> => {
  return executeAI('landing_page', { productName, niche, persona });
};

export const generateAdCreatives = (productName: string, niche: NicheSuggestion, persona: PersonaProfile, url?: string): Promise<AdCreative[]> => {
  return executeAI('ad_creatives', { productName, niche, persona, url });
};

// --- GROWTH AGENTS ---
export const generateSeoAudit = (url: string, productName: string): Promise<SeoAuditIssue[]> => {
  return executeAI('seo_audit', { url, productName });
};

export const generateKeywordStrategy = (seed: string, niche: string, persona: PersonaProfile): Promise<KeywordData[]> => {
  return executeAI('seo_keywords', { seed, niche, persona: persona.jobTitle });
};

export const analyzeContentSeo = (content: string, keyword: string): Promise<SeoContentScore> => {
  return executeAI('content_score', { content, keyword });
};

export const generateEmailCampaignContent = (productName: string, persona: PersonaProfile, topic: string, goal: string): Promise<{subject: string, body: string}> => {
  return executeAI('email_campaign', { productName, persona, topic, goal });
};

export const optimizeSubjectLines = (topic: string, persona: PersonaProfile): Promise<string[]> => {
  return executeAI('email_subjects', { topic, persona });
};

export const generateEmailSequence = (productName: string, persona: PersonaProfile, goal: string): Promise<{subject: string, body: string, delay: string}[]> => {
  return executeAI('follow_up', { productName, persona, goal }); 
};

// Chat Helper
export const createSalesChat = (productName: string, persona: PersonaProfile) => {
  const history: ChatMessage[] = [];
  return {
    sendMessage: async (msg: { message: string }) => {
      history.push({ role: 'user', text: msg.message });
      const responseText = await sendChatMessage(history, productName, persona);
      history.push({ role: 'model', text: responseText });
      return { text: responseText };
    }
  };
};

export const generateMagnetContent = async (magnet: LeadMagnet, persona: PersonaProfile) => "Content generation requires specific specialized agents. Coming soon.";
export const generateMagnetPromo = async (magnet: LeadMagnet, persona: PersonaProfile, platform: string, link: string) => "Promo copy requires specialized agents. Coming soon.";
export const generateAdImage = async () => "";
