import express from "express"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as inmemory from "../db/inmemory"
import * as dynamo from "../db/dynamo"
import * as countGet from "./count/get"
import * as countPost from "./count/post"

interface DB {
	get: countGet.CountGetter
	put: countPost.CountIncrementer
}

function getDatabase(): DB {
	if (process.env.TABLE_NAME) {
		console.log(`using DynamoDB table ${process.env.TABLE_NAME}`)
		const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION })
		const documentClient = DynamoDBDocumentClient.from(ddbClient)
		return new dynamo.DB(documentClient, process.env.TABLE_NAME)
	}
	return new inmemory.DB()
}

process.on('SIGINT', function() {
	process.exit();
});

const app = express()
app.use(express.json())

const db = getDatabase()

app.get("/healthcheck", (_req, res) => { 
	res.json({ ok: true })
})
app.get(countGet.route, countGet.create(db.get))
app.post(countPost.route, countPost.create(db.put))

app.listen(3000, () => {
	console.log("listening on port 3000")
})

