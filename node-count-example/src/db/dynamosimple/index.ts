import {
        DynamoDBDocumentClient,
        GetCommand,
        UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Create a default client.
const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION })
let client = DynamoDBDocumentClient.from(ddbClient)

let table = process.env.TABLE_NAME;

export async function init(c: DynamoDBDocumentClient, tableName: string) {
        client = c;
        table = tableName;
}

export interface Count {
        name: string
        count: number
}

export async function get(name: string): Promise<Count> {
        const params = new GetCommand({
                TableName: table,
                Key: { name },
                ConsistentRead: true,
        });
        const result = await client.send(params)
        return result.Item ? result.Item as Count : { name, count: 0 }
}

export async function increment(name: string): Promise<Count> {
        const put = new UpdateCommand({
                TableName: table,
                Key: { name },
                UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :one",
                ExpressionAttributeNames: {
                        "#c": "count",
                },
                ExpressionAttributeValues: {
                        ":zero": 0,
                        ":one": 1,
                },
                ReturnValues: "ALL_NEW",
        })
        const result = await client.send(put)
        return result.Attributes as Count
}
