import express from "express"
import * as countGet from "./"
import request from "supertest"
import * as db from "../../../db/dynamosimple";

let data: Record<string, number> = {};
const mockCountGet = jest.fn(async (name: string): Promise<db.Count> => ({ name: name, count: data[name] || 0 }));
jest.spyOn(db, "get").mockImplementation(mockCountGet)

const app = express()
app.use(express.json())

app.get(countGet.route, countGet.handler)

describe("GET /count/:name", () => {
        beforeEach(() => {
                // Reset data.
                data = {}
        })
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
                data[name] = 1

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
