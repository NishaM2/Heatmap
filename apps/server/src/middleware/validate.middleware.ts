import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)
        if(!result.success) {
            return res.status(400).json({
                status: 'error',
                message: 'validation failed',
                errors: result.error.issues
            })
        }
        req.body = result.data
        next()
    }
}

export default validate