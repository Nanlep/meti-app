
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { authService, getApiUrl } from './authService';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...authService.getAuthHeader()
});

export const supportService = {
  // --- User Methods ---
  
  getUserTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${getApiUrl()}/api/tickets`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return await response.json();
  },

  createTicket: async (data: { subject: string; category: TicketCategory; priority: TicketPriority; initialMessage: string }): Promise<Ticket> => {
    const response = await fetch(`${getApiUrl()}/api/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create ticket");
    }
    return await response.json();
  },

  getTicketDetails: async (id: string): Promise<Ticket> => {
    const response = await fetch(`${getApiUrl()}/api/tickets/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch ticket details");
    return await response.json();
  },

  replyToTicket: async (id: string, text: string): Promise<Ticket> => {
    const response = await fetch(`${getApiUrl()}/api/tickets/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error("Failed to reply");
    return await response.json();
  },

  closeTicket: async (id: string): Promise<Ticket> => {
    const response = await fetch(`${getApiUrl()}/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'closed' })
    });
    if (!response.ok) throw new Error("Failed to close ticket");
    return await response.json();
  },

  // --- Admin Methods ---

  getAllTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${getApiUrl()}/api/admin/tickets`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch all tickets");
    return await response.json();
  },

  updateTicketStatus: async (id: string, status: TicketStatus): Promise<Ticket> => {
    const response = await fetch(`${getApiUrl()}/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Failed to update status");
    return await response.json();
  }
};
