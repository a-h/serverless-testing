import express from "express"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as inmemory from "../db/inmemory"
import * as dynamo from "../db/dynamo"
import * as countGet from "./count/get"
import * as countPost from "./count/post"

function getDynamo(tableName: string): dynamo.DB {
        console.log(`getting DynamoDB client for table ${tableName}`)
        const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DYNAMODB_REGION }))
        const documentClient = DynamoDBDocumentClient.from(ddbClient)
        return new dynamo.DB(documentClient, tableName)
}

const db = process.env.TABLE_NAME ? getDynamo(process.env.TABLE_NAME) : new inmemory.DB()

const app = express()
app.use(express.json())

app.get("/healthcheck", (_req, res) => { 
	res.json({ ok: true })
})
app.get(countGet.route, countGet.create(db.get))
app.post(countPost.route, countPost.create(db.increment))

process.on('SIGINT', function() {
	process.exit();
});
app.listen(3000, () => {
	console.log("listening on port 3000")
})

