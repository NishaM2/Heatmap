import { NextFunction, Request, Response } from "express";
import * as categoryService from '../services/category.service'

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, color, isCore } = req.body;
        const userId  = req.user!.id;
        const newCategory = await categoryService.createCategory(userId, name, color, isCore)
        return res.status(201).json(newCategory)
    } catch (error) {
        next(error)
    }
}

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const categories = await categoryService.getCategory(userId)
        return res.status(200).json(categories)
    } catch (error) {
        next(error)
    }
}

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string
        const data = req.body;
        const userId = req.user!.id;
        const updated = await categoryService.updateCategory(userId, id, data)
        return res.status(200).json(updated)
    } catch (error) {
        next(error)
    }
}

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string
        const userId = req.user!.id;
        const deleted = await categoryService.deleteCategory(userId, id)
        return res.status(200).json(deleted)
    } catch (error) {
        next(error)
    }
}