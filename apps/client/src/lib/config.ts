const rawApiUrl = import.meta.env.VITE_API_URL

if (!rawApiUrl) {
    throw new Error('VITE_API_URL is not set — check .env / build environment')
}

export const API_URL = rawApiUrl.replace(/\/$/, '')   
export const SOCKET_URL = API_URL