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

# Start with "Hello, World" - Create project

## TypeScript

Create a project and install the required types.

```bash
npm init -y
npm install --save express
npm install --save-dev @types/express typescript ts-node jest
mkdir src
```

## Go

```
go mod init github.com/a-h/api
```

---

# Start with "Hello, World" - Add a server

### ./src/index.ts

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

# Pretend we have a database, for now

```ts
import express from "express"

const app = express()
app.use(express.json())

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

app.get("/count/:name", async (req, res) => {
	const response = await get(req.params.name)
	res.json(response)
})
app.post("/count/:name", async (req, res) => {
	const response = await increment(req.params.name)
	res.json(response)
})
app.listen(3000, "localhost", () => { console.log("listening on http://localhost:3000") })
```

```bash
curl localhost:3000/count/test123
curl --data "{}" localhost:3000/count/test123
curl localhost:3000/count/test123
```

---

# Write a unit test - separate files

To do this, we first have to separate the code than runs the server from the HTTP handlers.

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

---

## Write a unit test - add the test

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

## ./src/index.test.ts

```ts
import request from "supertest"
import { app } from "./"

describe("GET /count/:name", () => {
        it("returns the name and count as a JSON object", async () => {
                // Arrange.
                const name = "name1"
                await request(app).post("/count/" + name)

                // Act.
                const res = await request(app).get("/count/" + name)

                // Assert.
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name,
                        count: 1,
                })
        })
        it("returns a zero count if a count with the {name} doesn't exist", async () => {
                const res = await request(app).get("/count/new_name")
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name: "new_name",
                        count: 0,
                })
        })
})

describe("POST /count/:name", () => {
        const t = async (name: string) => {
                // Arrange.
                const res = await request(app).post("/count/" + name);

                // Assert.
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name,
                        count: 1,
                })
        }
        it("does not require a HTTP body", async () => t("any"))
        it("returns the name and count as a JSON object", async () => t("name"))
        it("creates a count if a count with the name doesn't exist", async () => t("non_existent"))
        it("increments the count of the name by one", async () => {
                // Arrange.
                const name = "incremented"
                await request(app).post("/count/" + name)

                // Act.
                const res = await request(app).post("/count/" + name)

                // Assert.
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name,
                        count: 2,
                })
        })
})
```

```sh
npx jest
```

---

## Write a unit test - run them

I like to make the `it` statements read as a sentence that describes the behaviour I'm testing.

It makes the test output clear and understandable.

(./run_tests.gif)[run tests]

---

## Problem - we've not implemented a test for the 500 behaviour

* Returns a 500 status if there's a database error.

How can can we make our database throw an error?

One way would be to update our database code so that if you use a special name, it throws an error.

That's a reasonable approach, but it does mean that our database code has these special edge cases built in.

Another way of dealing with it is to change our app so that we can swap out the database behaviours that the app uses.

In the current design, the `app` is a module-scoped variable, and it directly uses the database code.

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

---

## Move our database functions out

Let's move our in-memory database operations into a class in a separate directory.

Splitting the program into two parts, one part dealing with HTTP, and the other dealing with databases is called "separation of concerns".

The idea is that there are clear areas of responsibility in each area. One module deals with HTTP, another one deals with database access.

## /src/db/inmemory/index.ts

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
        put = async (name: string): Promise<Count> => {
                this.data[name] = this.data[name] ? this.data[name] + 1 : 1
                return this.get(name)
        }
}
```

---

## Wrap our app in a function

Instead using the `app` variable at the module level, we'll create a function that creates the app, and returns it.

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

---

## Add parameters for the database operations

Now we've moved our database code to its own module, our `get` and `increment` functions can't be found.

Instead of importing the module and using it directly, we can add parameters to the `createApp` function so that we can pass in any function that's the same shape as the `get` or `increment` function.

This idea is called "Dependency Injection", and it allows us to use any database we like. An in-memory database, some code that works with DynamoDB, or a function that throws an error.

```
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

---

## Force the database code to crash

Now we can write a function that simulates a database failure by throwing an error, and use it in the test.

The test fails because we haven't actually implemented the functionality.

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

(failed_test.gif)[failed test]

---

## Implementing the missing behaviour

To implement the missing behaviour, the simplest thing is to use a try catch block. In version 5 of Express, this will get easier, since it will handle async errors automatically, but for now, this is what we're left with.

```ts
type DBOperation = (name: string) => Promise<Count>

function handleError(e: unknown, res: Response) {
	//TODO: Use a better log.
	console.log(e)
	res.status(500)
	res.json({
		status: 500,
		msg: "internal server error"
	})
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

	app.post("/count/:name", async (req, res) => {
		try {
			const response = await increment(req.params.name)
			res.json(response)
		} catch (e: unknown) {
			handleError(e, res)
		}
	})

	return app
}
```

---

## Update the server.ts


