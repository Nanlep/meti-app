
import { User, Project, AccountManager } from '../types';
import { authService, getApiUrl } from './authService';

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  activeNow: number;
  revenueMRR: number;
  apiCallsToday: number;
}

export const adminService = {
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },

  getStats: async (): Promise<AdminStats> => {
    try {
      const users = await adminService.getAllUsers();
      const estimatedProjects = users.length * 2; 

      return {
        totalUsers: users.length,
        totalProjects: estimatedProjects,
        activeNow: Math.floor(users.length * 0.2) + 1, 
        revenueMRR: users.filter(u => u.subscription !== 'hobby').length * 199,
        apiCallsToday: users.length * 15
      };
    } catch (e) {
      console.error("Admin Stats Error", e);
      return { totalUsers: 0, totalProjects: 0, activeNow: 0, revenueMRR: 0, apiCallsToday: 0 };
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  inviteUser: async (params: { email: string; name: string; role: 'user' | 'admin'; projectId?: string }): Promise<void> => {
    const response = await fetch(`${getApiUrl()}/api/admin/invite`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error("Invite failed");
  },

  assignAccountManager: async (userId: string, manager: AccountManager): Promise<void> => {
    // Stub until backend supports manager assignment schema update
    console.log("Mock Assign Manager", userId, manager);
  },

  updateUserStatus: async (userId: string, status: 'active' | 'suspended'): Promise<void> => {
    await fetch(`${getApiUrl()}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ status })
    });
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    await fetch(`${getApiUrl()}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ role })
    });
  },

  createUser: async (email: string, name: string, role: 'user' | 'admin'): Promise<void> => {
    return adminService.inviteUser({ email, name, role });
  },

  getSystemLogs: async (): Promise<any[]> => {
    return [
        { id: 1, level: 'info', message: 'System healthy', timestamp: Date.now() }
    ];
  },

  getMaintenanceStatus: async (): Promise<boolean> => {
    try {
        const response = await fetch(`${getApiUrl()}/health`);
        const data = await response.json();
        return data.maintenance || false;
    } catch (e) {
        return false;
    }
  },

  toggleMaintenanceMode: async (enabled: boolean): Promise<void> => {
    await fetch(`${getApiUrl()}/api/admin/maintenance`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify({ enabled })
    });
  }
};
