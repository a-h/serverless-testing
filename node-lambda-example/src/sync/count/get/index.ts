import { Request, Response } from 'express';

export interface Count {
        name: string
        count: number
}

export type CountGetter = (name: string) => Promise<Count>

export const route = "/count/:name"

export function create(getCount: CountGetter) {
        return async function(req: Request, res: Response) {
                const { name } = req.params
                const r = await getCount(name)
                res.json(r)
        }
}
