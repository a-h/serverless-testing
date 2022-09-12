# Serverless development and testing

Adrian Hesketh
@adrianhesketh

---

# Make a counter

## GET /count/{name}

* Returns the `name` and `count` as a JSON object.
* Returns a zero count if a count with the name doesn't exist.
* Returns a 500 status if there's a database error.

## POST /count/{name}

* Does not require a HTTP body.
* Increments the count of the name by 1.
* Returns the `name` and `count` as a JSON object.
* Creates a count if a count with the name doesn't exist.
* Returns a 500 status if there's a database error.

---

# Tasks

* Create a database to store the counts.
* Create a REST API to handle `POST` and `GET` operations.

---
layout: section
---

# Start with "Hello, World"

---

# Create the project

```bash
npm init -y
npm install --save express
npm install --save-dev @types/express typescript ts-node jest
mkdir src
```

---

# Add a server

### `./src/index.ts`

```ts
import express from "express"

const app = express()
app.use(express.json())

app.get("/", (_req, res) => {
	res.json({ "msg": "Hello, World" })
})

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
```

```bash
npx ts-node ./src/index.ts &
curl localhost:3000
kill $!
```

---
layout: two-cols
---

## in-memory database

```ts
import express from "express"

interface Count {
	name: string
	count: number
}

const inmemoryDB: Record<string, number> = {};

async function get(name: string): Promise<Count> {
	const count = inmemoryDB[name] || 0
	return { name, count }
}

async function increment(name: string): Promise<Count> {
	if (!inmemoryDB[name]) { inmemoryDB[name] = 0 }
	inmemoryDB[name]++
	return get(name)
}
```

::right::

## server that uses it

```ts
const app = express()
app.use(express.json())

app.get("/count/:name", async (req, res) => {
	const response = await get(req.params.name)
	res.json(response)
})

app.post("/count/:name", async (req, res) => {
	const response = await increment(req.params.name)
	res.json(response)
})

app.listen(3000, "localhost", () => { 
        console.log("listening on http://localhost:3000") 
})
```

---

# Checkpoint!

## We have a server we can run that uses an in-memory database.

```bash
npx ts-node ./src/server.ts
```

## We can test it with `curl`.

```bash
curl localhost:3000/count/test123
curl --data "{}" localhost:3000/count/test123
curl localhost:3000/count/test123
```

## We have 2 files we care about.

```
- package.json -> list of dependencies
- src/index.ts -> server and app
- node_modules -> dependencies
- package-lock.json -> list of cryptographic hashes
```

---
layout: section
---

# Write tests for the expected behaviours

---

# Separate the files

## ./src/index.ts

```ts
import express from "express"

export const app = express()
app.use(express.json())

// <snip>
```

## ./src/server.ts

```ts
import { app } from "./"

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
```

<!--
To do this, we first have to separate the code that runs the server from the HTTP handlers.
-->

---

## Setup the testing framework

```sh
npm i --save-dev supertest jest @types/jest esbuild-jest esbuild @types/supertest
```

## ./jest.config.ts

```ts
import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "esbuild-jest"
  }
};

export default config;
```

---

# Write tests that match the desired behaviours

```ts
import request from "supertest"
import { app } from "./"

describe("GET /count/:name", () => {
        it("returns the name and count as a JSON object", async () => {
                // Arrange.
                await request(app).post("/count/name1")

                // Act.
                const res = await request(app).get("/count/name1")

                // Assert.
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({ name: "name1", count: 1 })
        })
})
```

---

## Run the tests

```sh
npx jest
```

![Local Image](test_output.png)

<!-- 
I like to make the `it` statements read as a sentence that describes the behaviour I'm testing.

It makes the test output clear and understandable.
-->

---
layout: two-cols
---

<style>
li {
  list-style:none;
}
</style>

## GET /count/{name}

* <mdi-check-circle class="text-green-400" /> `name` and `count` as a JSON object.
* <mdi-check-circle class="text-green-400" /> zero if a count with the name doesn't exist.
* <mdi-help-circle class="text-amber-400" /> 500 status if there's a database error.

::right::
## POST /count/{name}

* <mdi-check-circle class="text-green-400" /> does not require a HTTP body. 
* <mdi-check-circle class="text-green-400" /> increments the count of the name by 1.
* <mdi-check-circle class="text-green-400" /> `name` and `count` as a JSON object.
* <mdi-check-circle class="text-green-400" /> creates a count if the name doesn't exist.
* <mdi-help-circle class="text-amber-400" /> returns a 500 status if there's a database error.

<!--
How can can we make our database throw an error?

One way would be to update our database code so that if you use a special name, it throws an error.

That's a reasonable approach, but it does mean that our database code has these special edge cases built in.

Another way of dealing with it is to change our app so that we can swap out the database behaviours that the app uses.

In the current design, the `app` is a module-scoped variable, and it directly uses the database code.
-->

---

## Move the database code to its own module

### ./src/db/inmemory/index.ts

```ts
export interface Count {
        name: string
        count: number
}

export class DB {
        data: Record<string, number> = {}
        get = async (name: string): Promise<Count> => {
                const count = this.data[name] ?? 0
                return { name, count }
        }
        increment = async (name: string): Promise<Count> => {
                this.data[name] = this.data[name] ? this.data[name] + 1 : 1
                return this.get(name)
        }
}
```

<!--
Let's move our in-memory database operations into a class in a separate directory.

Splitting the program into two parts, one part dealing with HTTP, and the other dealing with databases is called "separation of concerns".

The idea is that there are clear areas of responsibility in each area. One module deals with HTTP, another one deals with database access.
-->

---
layout: two-cols
---

### ./src/index.ts - before

```ts
import express from "express"

export const app = express()
app.use(express.json())

// ...

app.get("/count/:name", async (req, res) => {
  const response = await get(req.params.name)
  res.json(response)
})
```

::right::

### ./src/index.ts - after

```ts
export function createApp(): express.Express {
  const app = express()
  app.use(express.json())

  app.get("/count/:name", async (req, res) => {
    const response = await get(req.params.name)
    res.json(response)
  })

  // ...

  return app
}
```

<!--
Instead using the `app` variable at the module level, we'll create a function that creates the app, and returns it.
-->

---
layout: statement
---

# Cannot find name 'get'
# Cannot find name 'increment'

<!--
Yeah, we moved them out to their own file.
-->

---

## Add parameters for the database operations

```ts
type DBOperation = (name: string) => Promise<Count>

export function createApp(get: DBOperation, increment: DBOperation): express.Express {
  const app = express()
  app.use(express.json())

  app.get("/count/:name", async (req, res) => {
    const response = await get(req.params.name)
    res.json(response)
  })

  // ...

  return app
}
```

<!-- 
Now we've moved our database code to its own module, our `get` and `increment` functions can't be found.

Instead of importing the module and using it directly, we can add parameters to the `createApp` function so that we can pass in any function that's the same shape as the `get` or `increment` function.

This idea is called "Dependency Injection", and it allows us to use any database we like. An in-memory database, some code that works with DynamoDB, or a function that throws an error.
-->

---

## Normal operation

### ./src/server.ts

```ts
import { createApp } from "./"
import { DB } from "./db/inmemory"

const db = new DB()
const app = createApp(db.get, db.increment)

app.listen(3000, "localhost", () => {
	console.log("listening on http://localhost:3000")
})
```

<!--

In normal operation, we pass the database functions into the HTTP handlers.

-->

---

## Code structure

```mermaid
flowchart LR
    tsn["npx ts-node"] --> server
    server[./src/server.ts] --"new DB()"--> db[./src/db/inmemory] --"db"--> server
    server-- "createApp(db.get, db.increment)" --> app[./src/index.ts] --"app"-->server
    server -- "app.listen(3000, 'localhost')" --> https[HTTP server]
```

---

## Outcome

```mermaid
flowchart LR
    curl --"GET /count/test"--> https[HTTP Server]
    https --"{ name: test, count: 0 }"--> curl
```

---

## Force the database code to crash

```ts
function throwDatabaseError(): Promise<Count> {
        throw new Error("database error")
}

describe("GET /count/:name", () => {
        // ...
        it("returns a 500 status if there's a database error", async () => {
                const errorApp = createApp(throwDatabaseError, throwDatabaseError)
                const res = await request(errorApp).get("/count/fail")
                expect(res.statusCode).toEqual(500)
                expect(res.body).toEqual({
                        status: 500,
                        msg: "internal server error",
                })
        })
        // ...
})
```

<!--
Now we can write a function that simulates a database failure by throwing an error, and use it in the test.

The test fails because we haven't actually implemented the functionality.
-->

---

## The test fails


![Local Image](tests_500_failed.png)

<!--
The test fails because we haven't actually implemented the functionality.
-->

---

## Implement the missing behaviour

```ts
function handleError(e: unknown, res: Response) {
	res.status(500)
	res.json({ status: 500, msg: "internal server error" })
}

export function createApp(get: DBOperation, increment: DBOperation): express.Express {
	const app = express()
	app.use(express.json())

	app.get("/count/:name", async (req, res) => {
		try {
			const response = await get(req.params.name)
			res.json(response)
		} catch (e: unknown) {
			handleError(e, res)
		}
	})

	// ...

	return app
}
```

<!-- 

To implement the missing behaviour, the simplest thing is to use a try catch block. In version 5 of Express, this will get easier, since it will handle async errors automatically, but for now, this is what we're left with.

-->

---

# Checkpoint!

* We _still_ have a server we can run that uses an in-memory database.
* We can _still_ use it with `curl`.
* We now have unit tests for all of the defined behaviours.
* We have split code into defined areas of responsibility.

## Important files

```
- src/index.ts -> app
- src/server.ts -> server
- src/database/inmemory/index.ts -> database code
```

---
layout: section
---

# Time to get real

<!--
We've been messing about with a fake database. Let's use DynamoDB.
-->

---

# DynamoDB

* Serverless database (autoscales, scales to zero)
* Pay per million read / write operations, plus data stored
* Encrypted at rest, and in transit
* Easy to backup and manage
* AWS IAM authenticated

---

# DynamoDB schema design

<table>
<tr>
<th>
        name (partition key)
</th>
<th>
        count
</th>
</tr>
<tr>
<td>
        test_1
</td>
<td>
        1
</td>
</tr>
<tr>
<td>
        other_name
</td>
<td>
        3
</td>
</tr>
</table>

---

# DynamoDB get

```ts
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export class DB {
        // ...
        get = async (name: string): Promise<Count> => {
                const result = await this.client.send(new GetCommand({
                        TableName: this.table,
                        Key: { name },
                        ConsistentRead: true,
                });
                return result.Item ? result.Item as Count : { name, count: 0 }
        }
        // ...
}
```

---

# DynamoDB increment

```ts
export class DB {
        // ...
        increment = async (name: string): Promise<Count> => {
                const result = await this.client.send(new UpdateCommand({
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
                return result.Attributes as Count
        }
}
```

---
layout: statement
---

# How do we know if it's going to work?

---

# Write integration tests

* Create a new DynamoDB table
* Carry out the tests
* Delete the table

<!--

It's too slow to create new tables in the cloud.

-->

---

# DynamoDB local options

## Official AWS DynamoDB local with Java

```sh
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

## Official AWS DynamoDB local with Docker

```sh
docker run -p 8000:8000 amazon/dynamodb-local
```

## M1 workaround

https://taint.org/2022/02/09/183535a.html

<!--

I don't like to use Docker in my day-to-day workflow. It uses RAM and CPU.

-->

---

# Test structure

```ts
describe("DynamoDB", () => {
  describe("increment", () => {
    it("creates a record if one does not exist, and sets the initial value to 1", async () => {
      const testDB = await createLocalTable();
      try {
        // Arrange.
        const db = new DB(testDB.client, testDB.name);

        // Act.
        const actual = await db.increment("test1")

        // Assert.
        expect(actual).toEqual({
          name: "test1",
          count: 1,
        });
      } finally {
        await testDB.delete();
      }
    });
  })
})
```

---

# Test helper

```ts
const createLocalTable = async (): Promise<TestDB> => {
  const options = {
    region: "eu-west-1",
    endpoint: "http://localhost:8000",
    credentials: { accessKeyId: "5dyqqr", secretAccessKey: "fqm4vf" },
  };
  const ddb = new DynamoDBClient(options);
  const tableName = randomTableName();
  const createTableCommand = new CreateTableCommand({
    KeySchema: [{ KeyType: "HASH", AttributeName: "name" }],
    TableName: tableName,
    AttributeDefinitions: [ { AttributeName: "name", AttributeType: "S" } ],
    BillingMode: "PAY_PER_REQUEST",
  })
  await ddb.send(createTableCommand);
  return {
    name: tableName,
    client: DynamoDBDocumentClient.from(ddb),
    delete: async () => {
      return await ddb.send(new DeleteTableCommand({ TableName: tableName }));
    },
  };
};
```

---

# Test results

![Local Image](test_database.png)

---

# Checkpoint!

* We now have a DynamoDB implementation of the database code.
* We now have have an integration test that uses dynamodb-local.

## Important files

```
- src/index.ts -> app
- src/index.test.ts -> app tests
- src/server.ts -> local server entrypoint
- src/database/inmemory/index.ts -> database code
- src/database/dynamo/index.ts -> dynamodb code
- src/database/dynamo/index.test.ts -> dynamodb integration tests
```

---
layout: section
---

# Time to get cloudy

---

# Options for Serverless deployments

* SAM
* Serverless Framework
* CDK
* Pulumi
* Terraform


