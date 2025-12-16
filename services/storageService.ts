
import { Project, ProjectData, User, Client } from '../types';
import { authService, getApiUrl } from './authService';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
    };
};

const handleAuthError = (status: number) => {
    if (status === 401 || status === 403) {
        console.warn("Session expired or invalid. Logging out.");
        authService.logout();
        return true;
    }
    return false;
};

const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const url = `${getApiUrl()}${endpoint}`;
    try {
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
            if (handleAuthError(response.status)) {
                throw new Error("Session expired. Please log in again.");
            }
            const err = await response.json();
            throw new Error(`API Error: ${err.error || response.statusText}`);
        }
        return await response.json();
    } catch (e) {
        console.error(`API Call Failed: ${endpoint}`, e);
        throw e;
    }
};

export const storageService = {
  getAll: async (): Promise<Project[]> => apiCall('/api/projects'),
  
  getById: async (id: string): Promise<Project> => apiCall(`/api/projects/${id}`),

  create: async (name: string, description: string, clientName?: string, clientId?: string): Promise<Project> => {
    return apiCall('/api/projects', 'POST', { name, description, clientName, clientId });
  },

  update: async (id: string, data: Partial<ProjectData>, clientName?: string, clientId?: string): Promise<Project> => {
    return apiCall(`/api/projects/${id}`, 'PUT', { data, clientName, clientId });
  },

  delete: async (id: string) => apiCall(`/api/projects/${id}`, 'DELETE'),

  // Client Methods (Real Implementation)
  getClients: async (): Promise<Client[]> => {
      return apiCall('/api/clients');
  },
  addClient: async (client: any): Promise<Client> => {
      return apiCall('/api/clients', 'POST', client);
  },
  updateClient: async (id: string, client: any): Promise<Client> => {
      return apiCall(`/api/clients/${id}`, 'PUT', client);
  },
  deleteClient: async (id: string): Promise<void> => {
      return apiCall(`/api/clients/${id}`, 'DELETE');
  },
  
  addTeamMember: async (projectId: string, email: string) => ({ success: true, message: "Invited" }),
  removeTeamMember: async (projectId: string, memberId: string) => ({ success: true, message: "Removed" })
};
