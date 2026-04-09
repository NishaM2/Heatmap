const BASE_URL = '/api'

const request = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        //Better Auth session cookie gets sent automatically
        headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            ...options.headers,
        },
    })

    if(!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Something went wrong')
    }
    return response.json()
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
        request(`/friends/search?username=${username}`),

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
}

//github
export const githubApi = {
    sync: () => 
        request('/github/sync', { 
            method: 'POST' 
        }),
}
