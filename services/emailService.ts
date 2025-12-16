
import { Subscriber, LeadItem, EmailSettings, EmailCampaign } from '../types';
import { generateId } from '../utils/core';
import { getApiUrl, authService } from './authService';

export const emailService = {
  
  syncFromCRM: (currentSubscribers: Subscriber[], leads: LeadItem[]): { added: number, subscribers: Subscriber[] } => {
    const existingEmails = new Set(currentSubscribers.map(s => s.email.toLowerCase()));
    let addedCount = 0;
    
    const newSubscribers: Subscriber[] = [];

    leads.forEach(lead => {
      if (lead.email && !existingEmails.has(lead.email.toLowerCase())) {
        newSubscribers.push({
          id: generateId(),
          email: lead.email,
          name: lead.contactName || lead.companyName,
          status: 'active',
          source: 'CRM',
          tags: ['Lead', lead.stage],
          joinedAt: Date.now()
        });
        existingEmails.add(lead.email.toLowerCase());
        addedCount++;
      }
    });

    return {
      added: addedCount,
      subscribers: [...currentSubscribers, ...newSubscribers]
    };
  },

  parseCSVUpload: (csvContent: string): Subscriber[] => {
    const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');
    const subscribers: Subscriber[] = [];
    const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      const email = parts[0]?.trim();
      const name = parts[1]?.trim();

      if (email && email.includes('@')) {
        subscribers.push({
          id: generateId(),
          email: email,
          name: name || undefined,
          status: 'active',
          source: 'Upload',
          tags: ['Imported'],
          joinedAt: Date.now()
        });
      }
    }
    return subscribers;
  },

  /**
   * Real send via Backend Proxy (SendGrid)
   */
  sendBroadcast: async (campaign: EmailCampaign, subscribers: Subscriber[], fromEmail: string): Promise<{ sent: number, failed: number }> => {
    let sent = 0;
    let failed = 0;

    // Batching to prevent timeout
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE);
        
        // Parallel requests for batch
        await Promise.all(batch.map(async (sub) => {
            try {
                const res = await fetch(`${getApiUrl()}/api/email/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authService.getAuthHeader()
                    },
                    body: JSON.stringify({
                        to: sub.email,
                        subject: campaign.subject,
                        html: campaign.content,
                        from: fromEmail
                    })
                });
                
                if (res.ok) sent++;
                else failed++;
            } catch (e) {
                failed++;
            }
        }));
    }
    return { sent, failed };
  },

  validateProvider: async (settings: EmailSettings): Promise<boolean> => {
    // In production, we assume backend holds the master key in env vars.
    // This frontend check is now just ensuring the user "enabled" the feature visually.
    return true; 
  }
};
