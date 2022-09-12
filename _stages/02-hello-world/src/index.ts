import express from "express"

const app = express()
app.use(express.json())

app.get("/", (_req, res) => {
	res.json({ "msg": "Hello, World" })
})

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
