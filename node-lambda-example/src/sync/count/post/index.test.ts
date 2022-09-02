import express from "express"
import { DB } from "../../../db/inmemory"
import * as countPost from "./"
import request from "supertest"

const app = express()
app.use(express.json())

const db = new DB()

app.post(countPost.route, countPost.create(db.put))

describe("POST /count/:name", () => {
        it("starts a new value from 1", async () => {
                const res = await request(app).post("/count/new_name")
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                        name: "new_name",
                        count: 1,
                })
        })
        it("adds 1 to an existing count", async () => {
                // Arrange.
                const name = "name1"
                await db.put(name)

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
