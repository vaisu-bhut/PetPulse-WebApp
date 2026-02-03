// API Client for PetPulse Backend
// Call backend directly to avoid Next.js proxy cookie issues
const API_BASE = '/api';

// Types
export interface User {
    id: number;
    email: string;
    name: string;
    created_at: string;
}

export interface Pet {
    id: number;
    user_id: number;
    name: string;
    age: number;
    species: string;
    breed: string;
    bio: string;
    created_at: string;
    updated_at: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface CreatePetRequest {
    name: string;
    age: number;
    species: string;
    breed: string;
    bio: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
}

export interface UpdatePetRequest {
    name?: string;
    age?: number;
    species?: string;
    breed?: string;
    bio?: string;
}

export interface Video {
    id: string;
    pet_id: number;
    gcs_path: string;
    mood: string | null;
    description: string | null;
    created_at: string;
}

export interface VideoListResponse {
    videos: Video[];
    total: number;
    page: number;
}

export interface Alert {
    id: string;
    pet_id: number;
    pet_name: string | null;
    alert_type: string;
    severity_level: string;
    message: string | null;
    critical_indicators: any;
    recommended_actions: any;
    created_at: string;
    outcome: string | null;
    user_response: string | null;
    user_acknowledged_at: string | null;
    user_notified_at: string | null;
    notification_sent: boolean;
    notification_channels: any;
    intervention_action: string | null;
    video_id: string | null;
}

export interface AlertListResponse {
    alerts: Alert[];
    total: number;
    page: number;
    page_size: number;
}

export interface DailyDigest {
    id: string;
    pet_id: number;
    date: string;
    summary: string;
    moods: any | null;
    activities: any | null;
    unusual_events: any | null;
    total_videos: number;
    created_at: string;
}

export interface DigestListResponse {
    digests: DailyDigest[];
    total: number;
    page: number;
    page_size: number;
}

export interface EmergencyContact {
    id: number;
    user_id: number;
    contact_type: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateEmergencyContactRequest {
    contact_type: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    priority?: number;
}

export interface UpdateEmergencyContactRequest {
    contact_type?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    priority?: number;
    is_active?: boolean;
}

export interface QuickAction {
    id: string;
    alert_id: string;
    emergency_contact_id: number;
    contact_name: string;
    contact_phone: string;
    action_type: string;
    message: string;
    video_clips: any;
    status: string;
    sent_at?: string;
    acknowledged_at?: string;
    error_message?: string;
    created_at: string;
}

export interface CreateQuickActionRequest {
    emergency_contact_id: number;
    action_type: string;
    message: string;
    video_clip_ids?: string[];
}


// Helper function to handle responses
async function handleResponse<T>(response: Response): Promise<T> {
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        try {
            const error = JSON.parse(errorText);
            throw new Error(error.error || `HTTP ${response.status}`);
        } catch {
            throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }
    }
    return response.json();
}

// Auth API
export const authApi = {
    register: async (data: RegisterRequest): Promise<User> => {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return handleResponse<User>(response);
    },

    login: async (data: LoginRequest): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    logout: () => {
        // Clear cookie by making request or just redirect
        document.cookie = 'petpulse_user=; Max-Age=0; path=/; SameSite=Lax';
    },
};

// User API
export const userApi = {
    getProfile: async (): Promise<User> => {
        const response = await fetch(`${API_BASE}/users`, {
            credentials: 'include',
        });
        return handleResponse<User>(response);
    },

    updateProfile: async (data: UpdateUserRequest): Promise<User> => {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return handleResponse<User>(response);
    },

    deleteAccount: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },
};

// Pet API
export const petApi = {
    list: async (): Promise<Pet[]> => {
        const response = await fetch(`${API_BASE}/pets`, {
            credentials: 'include',
        });
        return handleResponse<Pet[]>(response);
    },

    create: async (data: CreatePetRequest): Promise<Pet> => {
        const response = await fetch(`${API_BASE}/pets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return handleResponse<Pet>(response);
    },

    get: async (id: number): Promise<Pet> => {
        const response = await fetch(`${API_BASE}/pets/${id}`, {
            credentials: 'include',
        });
        return handleResponse<Pet>(response);
    },

    update: async (id: number, data: UpdatePetRequest): Promise<Pet> => {
        const response = await fetch(`${API_BASE}/pets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return handleResponse<Pet>(response);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE}/pets/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },
};

// Video API
export const videoApi = {
    listUserVideos: async (page = 1, pageSize = 10): Promise<VideoListResponse> => {
        const response = await fetch(`${API_BASE}/videos?page=${page}&page_size=${pageSize}`, {
            credentials: 'include',
        });
        return handleResponse<VideoListResponse>(response);
    },

    listPetVideos: async (petId: number, page: number = 1, perPage: number = 10): Promise<VideoListResponse> => {
        const response = await fetch(`${API_BASE}/pets/${petId}/videos?page=${page}&per_page=${perPage}`, {
            credentials: 'include',
        });
        return handleResponse<VideoListResponse>(response);
    },
};

// Alert API
export const alertApi = {
    // List all alerts for authenticated user
    listUserAlerts: async (page = 1, pageSize = 10, severityLevel?: string): Promise<AlertListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });
        if (severityLevel) params.append('severity_level', severityLevel);

        const response = await fetch(`${API_BASE}/alerts?${params}`, {
            credentials: 'include',
        });
        return handleResponse<AlertListResponse>(response);
    },

    // List alerts for specific pet
    listPetAlerts: async (petId: number, page = 1, pageSize = 10, severityLevel?: string): Promise<AlertListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });
        if (severityLevel) params.append('severity_level', severityLevel);

        const response = await fetch(`${API_BASE}/pets/${petId}/alerts?${params}`, {
            credentials: 'include',
        });
        return handleResponse<AlertListResponse>(response);
    },

    // Get single alert
    get: async (alertId: string): Promise<Alert> => {
        const response = await fetch(`${API_BASE}/alerts/${alertId}`, {
            credentials: 'include',
        });
        return handleResponse<Alert>(response);
    },

    // Acknowledge an alert
    acknowledge: async (alertId: string, userResponse: string): Promise<{ status: string }> => {
        const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ response: userResponse }),
        });
        return handleResponse<{ status: string }>(response);
    },

    // Resolve an alert
    resolve: async (alertId: string): Promise<{ status: string }> => {
        const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ status: string }>(response);
    },
};

// Daily Digest API
export const digestApi = {
    // List digests for specific pet
    listPetDigests: async (petId: number, page = 1, pageSize = 10): Promise<DigestListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        const response = await fetch(`${API_BASE}/pets/${petId}/digests?${params}`, {
            credentials: 'include',
        });
        return handleResponse<DigestListResponse>(response);
    },
};

// Emergency Contacts API
export const emergencyContactApi = {
    list: async (): Promise<EmergencyContact[]> => {
        const response = await fetch(`${API_BASE}/emergency-contacts`, {
            credentials: 'include',
        });
        return handleResponse<EmergencyContact[]>(response);
    },

    create: async (data: CreateEmergencyContactRequest): Promise<EmergencyContact> => {
        const response = await fetch(`${API_BASE}/emergency-contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse<EmergencyContact>(response);
    },

    update: async (id: number, data: UpdateEmergencyContactRequest): Promise<EmergencyContact> => {
        const response = await fetch(`${API_BASE}/emergency-contacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse<EmergencyContact>(response);
    },

    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/emergency-contacts/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return handleResponse<void>(response);
    },
};

// Quick Actions API
export const quickActionApi = {
    execute: async (alertId: string, data: CreateQuickActionRequest): Promise<QuickAction> => {
        const response = await fetch(`${API_BASE}/alerts/${alertId}/quick-actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse<QuickAction>(response);
    },

    listForAlert: async (alertId: string): Promise<QuickAction[]> => {
        const response = await fetch(`${API_BASE}/alerts/${alertId}/quick-actions`, {
            credentials: 'include',
        });
        return handleResponse<QuickAction[]>(response);
    },
};
