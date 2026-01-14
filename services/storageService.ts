
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

const validateId = (id: string | undefined): string => {
    if (!id || id === 'undefined' || id === 'null') {
        throw new Error("Critical Error: Attempted to perform operation without a valid resource ID.");
    }
    return id;
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
            const err = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${err.error || err.message || response.statusText}`);
        }
        return await response.json();
    } catch (e) {
        console.error(`API Call Failed: ${endpoint}`, e);
        throw e;
    }
};

export const storageService = {
  getAll: async (): Promise<Project[]> => apiCall('/api/projects'),
  
  getById: async (id: string): Promise<Project> => {
    const validId = validateId(id);
    return apiCall(`/api/projects/${validId}`);
  },

  create: async (name: string, description: string, clientName?: string, clientId?: string): Promise<Project> => {
    return apiCall('/api/projects', 'POST', { name, description, clientName, clientId });
  },

  update: async (id: string, data: Partial<ProjectData>, clientName?: string, clientId?: string): Promise<Project> => {
    const validId = validateId(id);
    return apiCall(`/api/projects/${validId}`, 'PUT', { data, clientName, clientId });
  },

  delete: async (id: string) => {
    const validId = validateId(id);
    return apiCall(`/api/projects/${validId}`, 'DELETE');
  },

  // Client Methods
  getClients: async (): Promise<Client[]> => apiCall('/api/clients'),
  addClient: async (client: any): Promise<Client> => apiCall('/api/clients', 'POST', client),
  updateClient: async (id: string, client: any): Promise<Client> => {
    const validId = validateId(id);
    return apiCall(`/api/clients/${validId}`, 'PUT', client);
  },
  deleteClient: async (id: string): Promise<void> => {
    const validId = validateId(id);
    return apiCall(`/api/clients/${validId}`, 'DELETE');
  },
  
  addTeamMember: async (projectId: string, email: string) => {
    const validId = validateId(projectId);
    return apiCall(`/api/projects/${validId}/members`, 'POST', { email });
  },
  removeTeamMember: async (projectId: string, memberId: string) => {
    const validId = validateId(projectId);
    return apiCall(`/api/projects/${validId}/members/${memberId}`, 'DELETE');
  }
};
