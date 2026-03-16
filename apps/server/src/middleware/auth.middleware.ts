import { auth } from "../auth"
import { Request, Response, NextFunction } from 'express'

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: req.headers as Record<string, string>
    })

    if (!session) {
        return res.status(401).json({
            message: "unauthorized"
        })
    }    

    req.user = session.user
    next()    
}

export default authMiddleware