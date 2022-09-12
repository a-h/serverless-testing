import express from "express"

const app = express()
app.use(express.json())

interface Count {
	name: string
	count: number
}

const inmemoryDB: Record<string, number> = {};

async function get(name: string): Promise<Count> {
	const count = inmemoryDB[name] || 0
	return { name, count }
}

async function increment(name: string): Promise<Count> {
	if (!inmemoryDB[name]) {
		inmemoryDB[name] = 0
	}
	inmemoryDB[name]++
	return get(name)
}

app.get("/count/:name", async (req, res) => {
	const response = await get(req.params.name)
	res.json(response)
})

app.post("/count/:name", async (req, res) => {
	const response = await increment(req.params.name)
	res.json(response)
})

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
