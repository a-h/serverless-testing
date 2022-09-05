import express from "express";
import serverless from "serverless-http";
//TODO: Use DynamoDB in Lambda.
import { DB } from "../../../../db/inmemory"
import * as countPost from "../"

const app = express()
app.use(express.json())

const db = new DB()

app.get(countPost.route, countPost.create(db.get))

module.exports.handler = serverless(app);
