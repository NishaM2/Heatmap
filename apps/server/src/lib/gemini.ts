import { GoogleGenAI } from '@google/genai'

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

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
