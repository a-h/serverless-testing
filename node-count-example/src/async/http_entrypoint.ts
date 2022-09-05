import express from "express"
import { messageHandler } from "./event_handler"

const app = express()
app.use(express.json())

app.post("/vote", (req, res) => {
        try {
                messageHandler(req.body)
                res.json({ ok: true })
        } catch (e) {
                res.status(500)
                res.json({ ok: false, err: e })
        }
})

app.listen(8000, "localhost")
