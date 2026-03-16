declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                name: string
                emailVerified: boolean
                image?: string | null
                createdAt: Date
                updatedAt: Date
            }
        }
    }
}

export {}