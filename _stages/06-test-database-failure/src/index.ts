import express, { Response } from "express"

export interface Count {
	name: string
	count: number
}

type DBOperation = (name: string) => Promise<Count>

function handleError(e: unknown, res: Response) {
	//TODO: Use a better log.
	console.log(e)
	res.status(500)
	res.json({
		status: 500,
		msg: "internal server error"
	})
}

export function createApp(get: DBOperation, increment: DBOperation): express.Express {
	const app = express()
	app.use(express.json())

	app.get("/count/:name", async (req, res) => {
		try {
			const response = await get(req.params.name)
			res.json(response)
		} catch (e: unknown) {
			handleError(e, res)
		}
	})

	app.post("/count/:name", async (req, res) => {
		try {
			const response = await increment(req.params.name)
			res.json(response)
		} catch (e: unknown) {
			handleError(e, res)
		}
	})

	return app
}

