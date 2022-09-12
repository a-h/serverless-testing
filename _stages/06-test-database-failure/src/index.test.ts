import request from "supertest"
import { Count, createApp } from "./"
import { DB } from "./db/inmemory"

const db = new DB()
const app = createApp(db.get, db.increment)

function throwDatabaseError(): Promise<Count> {
        throw new Error("database error")
}

describe("GET /count/:name", () => {
        it("returns a 500 status if there's a database error", async () => {
                const errorApp = createApp(throwDatabaseError, db.increment)
                const res = await request(errorApp).get("/count/fail")
                expect(res.statusCode).toEqual(500)
                expect(res.body).toEqual({
                        status: 500,
                        msg: "internal server error",
                })
        })
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
        it("returns a 500 status if there's a database error", async () => {
                const errorIncrementer = async (): Promise<Count> => {
                        throw new Error("database error")
                }
                const errorApp = createApp(db.get, errorIncrementer)
                const res = await request(errorApp).post("/count/fail")
                expect(res.statusCode).toEqual(500)
                expect(res.body).toEqual({
                        status: 500,
                        msg: "internal server error",
                })
        })
})

