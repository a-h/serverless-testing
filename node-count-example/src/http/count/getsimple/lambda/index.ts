import express from "express";
import serverless from "serverless-http";
import * as countGet from "../"
import { requestLogger } from "../../../requestlogger";

const app = express()
app.use(express.json())
app.use(requestLogger)

app.get(countGet.route, countGet.handler)

module.exports.handler = serverless(app);
