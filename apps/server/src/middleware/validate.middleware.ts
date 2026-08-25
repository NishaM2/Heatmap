import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

const failed = (res: Response, issues: unknown) =>
    res.status(400).json({
        status: 'error',
        message: 'validation failed',
        errors: issues
    })

const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)
        if(!result.success) {
            return failed(res, result.error.issues)
        }
        req.body = result.data
        next()
    }
}

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params)
        if (!result.success) {
            return failed(res, result.error.issues)
        }
        next()
    }
}

// Express 5 silently ignores assignment to req.query, so this validates in place rather than replacing it with the parsed result.
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query)
        if (!result.success) {
            return failed(res, result.error.issues)
        }
        next()
    }
}

export default validate
