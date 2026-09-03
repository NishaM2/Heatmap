import { GoogleGenAI } from '@google/genai'

const rawModel = (process.env.GEMINI_MODEL || '').trim().replace(/^["']|["']$/g, '')

export const GEMINI_MODEL = rawModel || 'gemini-3.5-flash-lite'

let client: GoogleGenAI | null = null

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY)

export const getGemini = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set')
    }
    if (!client) {
        client = new GoogleGenAI({ apiKey })
    }
    return client
}
