import express from "express";
import serverless from "serverless-http";
import { DB } from "../../../../db/dynamo"
import * as countPost from "../"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { requestLogger } from "../../../requestlogger";

const app = express()
app.use(express.json())
app.use(requestLogger)

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION })
const documentClient = DynamoDBDocumentClient.from(ddbClient)
const db = new DB(documentClient, process.env.TABLE_NAME)

app.get(countPost.route, countPost.create(db.get))

module.exports.handler = serverless(app);
