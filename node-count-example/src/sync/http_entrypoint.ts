import express from "express"
import { DB } from "../db/inmemory"
import * as countGet from "./count/get"
import * as countPost from "./count/post"

const app = express()
app.use(express.json())

const db = new DB()

app.get(countGet.route, countGet.create(db.get))
app.post(countPost.route, countPost.create(db.put))

app.listen(8000, "localhost")

