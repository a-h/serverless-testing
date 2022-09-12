import { createApp } from "./"
import { DB } from "./db/inmemory"

const db = new DB()
const app = createApp(db.get, db.increment)

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
