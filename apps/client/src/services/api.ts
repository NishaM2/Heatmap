import { API_URL } from "@/lib/config"

const BASE_URL = `${API_URL}/api`

const parseBody = async (response: Response) => {
    if (response.status === 204) return null
    const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}

export interface ParsedLog {
    categoryId: string
    categoryName: string
    categoryColor: string
    effortLevel: number
    note: string
}

export interface ApiError extends Error {
    code?: string
    status?: number
}

export const request = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        //Better Auth session cookie gets sent automatically
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if(!response.ok) {
        const body = await parseBody(response)
    
        const error: ApiError = new Error(
            body?.message || `Request failed (${response.status} ${response.statusText})`.trim()
        )
        error.code = body?.code
        error.status = response.status
        throw error
    }
    return parseBody(response)
}

//auth
export const authApi = {
    signUp: (data: { email: string; password: string; name: string }) => 
        request('/auth/sign-up/email', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    signIn: (data: { email: string; password: string }) =>
        request('/auth/sign-in/email', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    signOut: () =>
        request('/auth/sign-out', { method: 'POST' }),

    getSession: () => 
        request('/auth/get-session'),
}

//categories
export const categoryApi = {
    getAll: () => request('/categories'),

    create: (data: { name: string; color: string; isCore: boolean }) =>
        request('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
     
    update: (id: string, data: { name?: string; color?: string; isCore?: boolean }) =>
        request(`/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
    }),

    delete: (id: string) =>
        request(`/categories/${id}`, { 
            method: 'DELETE' 
    }),
}

//logs
export const logApi = { 
    upsert: (data: { date: string; effortLevel: number;  note?: string; categoryId: string }) => 
        request('/logs', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    
    getOverall: (year: string) => 
        request(`/logs/overall?year=${year}`),

    getYear: (categoryId: string, year: string) =>
        request(`/logs/${categoryId}?year=${year}`),

    getDay: (categoryId: string, date: string) =>
        request(`/logs/${categoryId}/${date}`),
       
    delete: (id: string) =>
        request(`/logs/${id}`, { method: 'DELETE' }),

    parse: (text: string): Promise<ParsedLog> =>
        request('/logs/parse', {
            method: 'POST',
            body: JSON.stringify({ text }),
        }),

    deleteAll: () => 
        request('/logs', { method: 'DELETE' }),
}

//stats
export const statsApi = {
    getCategory: (categoryId: string, year: string) =>
        request(`/stats/${categoryId}?year=${year}`),
}

//friends
export const friendApi = {
    getAll: () => request('/friends'),

    getRequests: () => request('/friends/requests'),

    search: (username: string) =>
        request(`/friends/search?username=${encodeURIComponent(username)}`),

    sendRequest: (receiverId: string) =>
        request('/friends/request', {
            method: 'POST',
            body: JSON.stringify({ receiverId }),
        }),

    accept: (id: string) =>
        request(`/friends/${id}/accept`, { 
            method: 'PATCH' 
        }),

    decline: (id: string) =>
        request(`/friends/${id}/decline`, { 
            method: 'PATCH' 
        }),

    unfriend: (id: string) =>
        request(`/friends/${id}`, { 
            method: 'DELETE'
        }),

    getFriendLogs: (friendId: string, year: string) =>
        request(`/logs/friend/${friendId}?year=${year}`),
}

//github
export const accountApi = {
    status: (): Promise<{ hasPassword: boolean; providers: string[] }> =>
        request('/account/status'),

    setPassword: (newPassword: string) =>
        request('/account/set-password', {
            method: 'POST',
            body: JSON.stringify({ newPassword }),
        }),
}

export const githubApi = {
    sync: () => 
        request('/github/sync', { 
            method: 'POST' 
        }),

    status: () => 
        request('/github/status'),
    
    disconnect: () => 
        request('/github/disconnect', { 
            method: 'DELETE' 
        }),
}

export const sharedGoalApi = {
  getAll: () => request('/shared-goals'),

  create: (data: { initiatorCategoryId: string; receiverId: string }) =>
    request('/shared-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  accept: (id: string, receiverCategoryId: string) =>
    request(`/shared-goals/${id}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ receiverCategoryId }),
    }),

  decline: (id: string) =>
    request(`/shared-goals/${id}/decline`, { method: 'PATCH' }),

  getComparison: (id: string, year: string) =>
    request(`/shared-goals/${id}/comparison?year=${year}`),
}
