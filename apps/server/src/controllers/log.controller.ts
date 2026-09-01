import { NextFunction, Request, Response } from "express";
import * as logService from '../services/log.service'
import { parseLogSentence, ParseLogError } from '../services/parseLog.service'

export const parseLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id
        const parsed = await parseLogSentence(userId, req.body.text)
        return res.status(200).json(parsed)
    } catch (error) {
        // Anything the user can fix is a 400 with a readable message; a missing
        // key or a Gemini outage falls through to the global handler as a 500.
        if (error instanceof ParseLogError) {
            return res.status(400).json({ message: error.message })
        }
        next(error)
    }
}

export const createLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, effortLevel, note, categoryId } = req.body;
        const userId = req.user!.id;
        const newLog = await logService.upsertLog(userId, categoryId, date, effortLevel, note)
        return res.status(201).json(newLog)
    } catch (error) {
        next(error)
    }
}

export const getOverallLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const overallLog = await logService.getOverallLogs(userId, year)
        return res.status(200).json(overallLog)
    } catch (error) {
        next(error)
    }
}

export const getYearLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const categoryId = req.params.categoryId as string;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const yearLog = await logService.getLogsForYear(userId, categoryId, year)
        return res.status(200).json(yearLog)
    } catch (error) {
        next(error)
    }
}

export const getDayLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const categoryId = req.params.categoryId as string;
        const date = req.params.date as string;
        const DayLog = await logService.getDayDetail(userId, categoryId, date)
        return res.status(200).json(DayLog)
    } catch (error) {
        next(error)
    }
}

export const deleteLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const id = req.params.id as string;
        await logService.deleteLog(userId, id)
        return res.status(200).json({ message: 'Log deleted' })
    } catch (error) {
        next(error)
    }
}

export const deleteAllLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    await logService.deleteAllLogs(userId)
    return res.status(200).json({ message: 'All logs deleted' })
  } catch (error) {
    next(error)
  }
}