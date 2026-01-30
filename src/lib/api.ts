// API Client for PetPulse Backend
// Call backend directly to avoid Next.js proxy cookie issues
const API_BASE = 'http://localhost:3000';

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
    file_path: string;
    status: string;
    activities: any;
    mood: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    is_unusual: boolean;
    pet?: Pet;
}

export interface VideoListResponse {
    videos: Video[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
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
    listUserVideos: async (page: number = 1, perPage: number = 10): Promise<VideoListResponse> => {
        const response = await fetch(`${API_BASE}/videos?page=${page}&per_page=${perPage}`, {
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
