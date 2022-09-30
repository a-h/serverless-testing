import { Request, Response } from 'express';
import { get } from '../../../db/dynamosimple';

export interface Count {
        name: string
        count: number
}

export const route = "/count/:name"

export async function handler(req: Request, res: Response) {
        const { name } = req.params
        const r = await get(name)
        res.json(r)
}
