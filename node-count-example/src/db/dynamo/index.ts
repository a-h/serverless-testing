import {
        DynamoDBDocumentClient,
        GetCommand,
        UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export interface Count {
        name: string
        count: number
}

export class DB {
        readonly client: DynamoDBDocumentClient
        readonly table: string
        constructor(client: DynamoDBDocumentClient, table: string) {
                this.client = client
                this.table = table
        }
        get = async (name: string): Promise<Count> => {
                const params = new GetCommand({
                        TableName: this.table,
                        Key: { name },
                        ConsistentRead: true,
                });
                const result = await this.client.send(params)
                return result.Item ? result.Item as Count : { name, count: 0 }
        }
        put = async (name: string): Promise<Count> => {
                const put = new UpdateCommand({
                        TableName: this.table,
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
                const result = await this.client.send(put)
                return result.Attributes as Count
        }
}
