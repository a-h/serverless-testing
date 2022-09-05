import { Request, Response } from 'express';

export interface Count {
        name: string
        count: number
}

export type CountIncrementer = (name: string) => Promise<Count>

export const route = "/count/:name"

export function create(incrementCount: CountIncrementer) {
        return async function(req: Request, res: Response) {
                const { name } = req.params
                const r = await incrementCount(name)
                res.json(r)
        }
}

