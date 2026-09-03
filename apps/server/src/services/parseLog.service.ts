import { Type } from '@google/genai'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { categories } from '../db/schema'
import { getGemini, GEMINI_MODEL, isGeminiConfigured } from '../lib/gemini'

export type ParsedLog = {
    categoryId: string
    categoryName: string
    categoryColor: string
    effortLevel: number
    note: string
}

export class ParseLogError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ParseLogError'
    }
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        habit: {
            type: Type.STRING,
            description: 'Exactly one of the habit names provided, copied verbatim. Use "unknown" if none of them fit.',
        },
        effortLevel: {
            type: Type.INTEGER,
            description: '1 = light, 2 = moderate, 3 = hard, 4 = intense. Judge from how the person describes the effort.',
        },
        note: {
            type: Type.STRING,
            description: 'A short tidy note under 140 characters, in the user’s own words. Empty string if they gave no detail worth keeping.',
        },
    },
    required: ['habit', 'effortLevel', 'note'],
}

const systemInstruction = [
    'You turn a short sentence about someone’s day into a single habit log.',
    '',
    'Rules:',
    '- Pick the habit from the provided list only. Copy the name exactly as given.',
    '- If the sentence does not clearly match any habit on the list, set habit to "unknown".',
    '- effortLevel reflects how hard the person says it felt, not how long it took:',
    '  1 = light or easy, 2 = moderate or normal, 3 = hard or tiring, 4 = intense, brutal, or maximal.',
    '- If they give no sense of difficulty at all, use 2.',
    '- The note keeps concrete details (distances, counts, what they did) and drops filler.',
    '- Never invent detail that is not in the sentence.',
].join('\n')

export const parseLogSentence = async (userId: string, text: string): Promise<ParsedLog> => {
    if (!isGeminiConfigured()) {
        throw new Error('GEMINI_API_KEY is not set')
    }

    const userCategories = await db.select({
        id: categories.id,
        name: categories.name,
        color: categories.color,
    })
        .from(categories)
        .where(eq(categories.userId, userId))

    if (userCategories.length === 0) {
        throw new ParseLogError('Add a habit first, then you can log one by typing.')
    }

    const habitList = userCategories.map(c => `- ${c.name}`).join('\n')

    const response = await getGemini().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Habits available:\n${habitList}\n\nSentence: ${text}`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
            // Extraction, not creative writing — keep it repeatable.
            temperature: 0,
            maxOutputTokens: 400,

            ...(GEMINI_MODEL.startsWith('gemini-2.5')
                ? { thinkingConfig: { thinkingBudget: 0 } }
                : {}),
        },
    })

    const raw = response.text
    if (!raw) {
        throw new ParseLogError('Could not read that. Try describing the day in a few more words.')
    }

    let parsed: { habit?: unknown; effortLevel?: unknown; note?: unknown }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new ParseLogError('Could not read that. Try describing the day in a few more words.')
    }

    // Everything below treats the model output as untrusted input, because it is.
    const habitName = typeof parsed.habit === 'string' ? parsed.habit.trim() : ''
    const match = userCategories.find(
        c => c.name.toLowerCase() === habitName.toLowerCase()
    )

    if (!match) {
        throw new ParseLogError(
            `Could not tell which habit that was. Try naming it, for example "${userCategories[0].name} for an hour".`
        )
    }

    const level = Number(parsed.effortLevel)
    // Overshooting the scale means "harder than 4", not "average" — clamp to the
    // nearest bound so an intense day cannot land on moderate.
    const effortLevel = Number.isFinite(level)
        ? Math.min(4, Math.max(1, Math.round(level)))
        : 2

    const note = typeof parsed.note === 'string' ? parsed.note.trim().slice(0, 140) : ''

    return {
        categoryId: match.id,
        categoryName: match.name,
        categoryColor: match.color,
        effortLevel,
        note,
    }
}
