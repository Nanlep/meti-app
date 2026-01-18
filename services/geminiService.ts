
import { NicheSuggestion, PersonaProfile, LeadMagnet, QualificationQuestion, FollowUpEmail, SocialSearchQuery, LocalBusinessResult, LandingPage, ChatMessage, AdCreative, KeywordData, SeoAuditIssue, SeoContentScore, EmailCampaign, SeoAuditResponse } from "../types";
import { authService, getApiUrl } from "./authService";

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
  if (!token) throw new Error("Authentication required for AI services.");

  const response = await fetch(`${getApiUrl()}/api/ai/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ agent, payload })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `AI Error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data as T;
};

// --- STRATEGY ---
export const generateNiches = (productName: string, description: string, options?: any): Promise<NicheSuggestion[]> => executeAI(AgentID.NICHE, { productName, description, ...options });
export const generatePersona = (productName: string, niche: any, refinement?: string, description?: string): Promise<PersonaProfile> => executeAI(AgentID.PERSONA, { productName, niche: niche.name, refinement, description });
export const generateLeadMagnets = (productName: string, nicheName: string, persona: PersonaProfile, description?: string): Promise<LeadMagnet[]> => executeAI(AgentID.MAGNETS, { productName, nicheName, persona: persona.jobTitle, description });

// --- CONVERSION ---
export const searchLocalBusinesses = (niche: string, location: string, coords?: { lat: number, lng: number }): Promise<LocalBusinessResult> => executeAI(AgentID.MAPS_SCOUT, { niche, location, coords });
export const generateSocialSearchQueries = (persona: PersonaProfile, niche: string): Promise<SocialSearchQuery[]> => executeAI(AgentID.SOCIAL_SEARCH, { persona, niche });
export const generateQualification = (productName: string, persona: PersonaProfile, description?: string): Promise<QualificationQuestion[]> => executeAI(AgentID.QUALIFICATION, { productName, persona: persona.jobTitle, description });
export const handleObjection = (objection: string, productName: string, persona: PersonaProfile, description?: string): Promise<string[]> => executeAI(AgentID.OBJECTION, { objection, productName, persona: persona.jobTitle, description });
export const generateColdDMs = (productName: string, persona: PersonaProfile, description?: string): Promise<string[]> => executeAI(AgentID.COLD_DMS, { productName, persona: persona.jobTitle, description });
export const generateFollowUp = (productName: string, persona: PersonaProfile, other: any, description?: string): Promise<FollowUpEmail[]> => executeAI(AgentID.FOLLOW_UP, { productName, persona: persona.jobTitle, description });

// --- CHAT STREAMING ---
export const sendChatMessage = async (history: ChatMessage[], productName: string, persona: PersonaProfile, description?: string): Promise<string> => {
  const result = await executeAI<any>(AgentID.CHAT, { history, productName, persona: persona.jobTitle, description });
  return result.text || "...";
};

export const sendChatMessageStream = async (
  history: ChatMessage[], 
  productName: string, 
  persona: PersonaProfile, 
  onChunk: (chunk: { text: string, sources?: any[] }) => void,
  description?: string
): Promise<void> => {
  const token = authService.getToken();
  const response = await fetch(`${getApiUrl()}/api/ai/stream`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ history, productName, persona: persona.jobTitle, description })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      
      for (const line of lines) {
          if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '');
              if (dataStr === '[DONE]') return;
              try {
                  const data = JSON.parse(dataStr);
                  if (data.text) onChunk({ text: data.text, sources: data.sources });
              } catch (e) {
                  console.error("Stream parse error", e);
              }
          }
      }
  }
};

// --- ASSETS ---
export const generateLandingPage = (productName: string, niche: NicheSuggestion, persona: PersonaProfile, description?: string): Promise<LandingPage> => executeAI(AgentID.LANDING, { productName, niche, persona, description });
export const generateAdCreatives = (productName: string, niche: NicheSuggestion, persona: PersonaProfile, url?: string, description?: string): Promise<AdCreative[]> => executeAI(AgentID.ADS, { productName, niche, persona: persona.jobTitle, url, description });
export const generateMagnetContent = (magnet: LeadMagnet, persona: PersonaProfile, nicheName: string, productName: string, description?: string): Promise<string> => executeAI(AgentID.MAGNET_CONTENT, { magnet, persona: persona.jobTitle, nicheName, productName, description });
export const generateMagnetPromo = (magnet: LeadMagnet, persona: PersonaProfile, platform: string, link: string, description?: string): Promise<string> => executeAI(AgentID.MAGNET_PROMO, { magnet, persona: persona.jobTitle, platform, link, description });

// --- EMAIL ---
export const generateEmailCampaignContent = (productName: string, persona: PersonaProfile, topic: string, goal: string, description?: string): Promise<{ subject: string, body: string }> => executeAI(AgentID.EMAIL_CAMPAIGN, { productName, persona: persona.jobTitle, topic, goal, description });
export const optimizeSubjectLines = (topic: string, persona: PersonaProfile): Promise<string[]> => executeAI(AgentID.SUBJECT_LINES, { topic, persona: persona.jobTitle });
export const generateEmailSequence = (productName: string, persona: PersonaProfile, goal: string, description?: string): Promise<FollowUpEmail[]> => executeAI(AgentID.FOLLOW_UP, { productName, persona: persona.jobTitle, goal, description });

// --- GROWTH ---
export const generateSeoAudit = (url: string, productName: string): Promise<SeoAuditResponse> => executeAI(AgentID.SEO_AUDIT, { url, productName });
export const generateKeywordStrategy = (seed: string, niche: string, persona: PersonaProfile, description?: string): Promise<KeywordData[]> => executeAI(AgentID.SEO_KEYWORDS, { seed, niche, persona: persona.jobTitle, description });
export const analyzeContentSeo = (content: string, keyword: string): Promise<SeoContentScore> => executeAI(AgentID.CONTENT_SCORE, { content, keyword });
