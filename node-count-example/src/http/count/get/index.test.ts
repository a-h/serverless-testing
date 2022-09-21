import express from "express"
import { DB } from "../../../db/inmemory"
import * as countGet from "./"
import request from "supertest"

const app = express()
app.use(express.json())

const db = new DB()

app.get(countGet.route, countGet.create(db.get))

describe("GET /count/:name", () => {
        it("returns a zero count if the name is new", async () => {
                const res = await request(app).get("/count/new_name")
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name: "new_name",
                        count: 0,
                })
        })
        it("returns the count, if available", async () => {
                // Arrange.
                const name = "name1"
                await db.increment(name)

                // Act.
                const res = await request(app).get("/count/" + name)

                // Assert.
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name,
                        count: 1,
                })
        })
})
