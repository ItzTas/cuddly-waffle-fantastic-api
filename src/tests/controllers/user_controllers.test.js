import supertest from "supertest";
import { truncateUsersTable } from "../../database/users_queries.js";
import { pool } from "../../database/database_client.js";
import app from "../../main.js";
import { StatusCodes } from "http-status-codes";

describe("post /users/accounts", () => {
  beforeAll(async () => {
    await truncateUsersTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it(`Code ${StatusCodes.CREATED} (created) expected`, async () => {
    const tests = [
      {
        body: {
          real_name: "Tales lindo",
          user_name: "TaleszitoLindo",
          email: "tales@2",
          password: "sa9dn28b9bndf",
        },
      },
      {
        body: {
          real_name: "Lucas m",
          user_name: "lucaszito",
          email: "lucas@dkosm",
          password: "awo0dms9a0",
        },
      },
    ];

    for (const test of tests) {
      const { body } = test;
      try {
        await supertest(app)
          .post("/users/accounts")
          .send(body)
          .expect((res) => {
            expect(res.status).toBe(StatusCodes.CREATED);
          });
      } catch (err) {
        throw new Error(`
			expected code ${StatusCodes.CREATED} did not happen\n
			test: \n${JSON.stringify(test, null, 2)}\n
			error: \n${err}\n
			`);
      }
    }
  });
});
