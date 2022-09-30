import { CreateTableCommand, DeleteTableCommand, DeleteTableCommandOutput, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { init, get, increment } from "./index";

describe("DynamoDB", () => {
  describe("get / increment", () => {
    it("creates a record if one does not exist, and sets the initial value to 1", async () => {
      const testDB = await createLocalTable();
      init(testDB.client, testDB.name)
      try {
        const actual = await increment("test1")
        expect(actual).toEqual({
          name: "test1",
          count: 1,
        });
      } finally {
        await testDB.delete();
      }
    });
    it("gets an existing record's value once created", async () => {
      const testDB = await createLocalTable();
      try {
        const testDB = await createLocalTable();
        init(testDB.client, testDB.name)

        const beforeIncrement = await get("test2")
        expect(beforeIncrement).toEqual({
          name: "test2",
          count: 0,
        });

        const incrementResult = await increment("test2")
        expect(incrementResult).toEqual({
          name: "test2",
          count: 1,
        });

        const afterIncrement = await get("test2")
        expect(afterIncrement).toEqual({
          name: "test2",
          count: 1,
        });
      } finally {
        await testDB.delete();
      }
    });
    it("can increment a record multiple times", async () => {
      const testDB = await createLocalTable();
      try {
        const testDB = await createLocalTable();
        init(testDB.client, testDB.name)

        await increment("test3")
        await increment("test3")
        await increment("test3")

        const afterPut = await get("test3")
        expect(afterPut).toEqual({
          name: "test3",
          count: 3,
        });
      } finally {
        await testDB.delete();
      }
    });
  });
});

interface TestDB {
  name: string;
  client: DynamoDBDocumentClient;
  delete: () => Promise<DeleteTableCommandOutput>;
}

const randomTableName = () => `eventdb_test_${new Date().getTime()}`;

const createLocalTable = async (): Promise<TestDB> => {
  const options = {
    region: "eu-west-1",
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "5dyqqr",
      secretAccessKey: "fqm4vf",
    },
  };

  const ddb = new DynamoDBClient(options);

  const tableName = randomTableName();
  const createTableCommand = new CreateTableCommand({
    KeySchema: [
      {
        KeyType: "HASH",
        AttributeName: "name",
      },
    ],
    TableName: tableName,
    AttributeDefinitions: [
      {
        AttributeName: "name",
        AttributeType: "S",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  })
  await ddb.send(createTableCommand);

  const deleteTableFunc = async () => {
    const deleteTableCommand = new DeleteTableCommand({ TableName: tableName });
    return await ddb.send(deleteTableCommand);
  }

  return {
    name: tableName,
    client: DynamoDBDocumentClient.from(ddb),
    delete: deleteTableFunc,
  };
};
