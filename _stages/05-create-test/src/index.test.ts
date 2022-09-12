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

