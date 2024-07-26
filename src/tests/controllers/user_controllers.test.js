import supertest from "supertest";
import {
  createDatabaseUser,
  truncateUsersTable,
} from "../../database/users_queries.js";
import { pool } from "../../database/database_client.js";
import app from "../../main.js";
import { StatusCodes } from "http-status-codes";
import { formatObject } from "../../../helpers/helpers.js";

describe("post /users/accounts", () => {
  beforeAll(async () => {
    await truncateUsersTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  const path = "/api/users/accounts";

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
          .post(path)
          .send(body)
          .expect((res) => {
            expect(res.status).toBe(StatusCodes.CREATED);
          });
      } catch (/** @type {any} */ err) {
        throw new Error(`
			expected code ${StatusCodes.CREATED} did not happen\n
			test: \n${formatObject(test)}\n
			error: \n${err}\n 
			`);
      }
    }
  });

  it("Assures security and equality in informations", async () => {
    const tests = [
      {
        body: {
          real_name: "Ruan",
          user_name: "ruan_AAA",
          email: "ruan@AAA",
          password: "as9dn90",
        },
        expected: {
          real_name: "Ruan",
          user_name: "ruan_AAA",
          email: "ruan@AAA",
        },
      },
      {
        body: {
          real_name: "Tales",
          user_name: "Taleszito",
          email: "tales@site.com",
          password: "strongpassword123",
        },
        expected: {
          real_name: "Tales",
          user_name: "Taleszito",
          email: "tales@site.com",
        },
      },
      {
        body: {
          real_name: "Ana Maria",
          user_name: "ana_maria123",
          email: "ana@maria.com",
          password: "password456",
        },
        expected: {
          real_name: "Ana Maria",
          user_name: "ana_maria123",
          email: "ana@maria.com",
        },
      },
      {
        body: {
          real_name: "João Silva",
          user_name: "joaosilva",
          email: "joao@silva.com",
          password: "joaosenha789",
        },
        expected: {
          real_name: "João Silva",
          user_name: "joaosilva",
          email: "joao@silva.com",
        },
      },
      {
        body: {
          real_name: "Maria Clara",
          user_name: "maria_clara",
          email: "maria@clara.com",
          password: "mariapass123",
        },
        expected: {
          real_name: "Maria Clara",
          user_name: "maria_clara",
          email: "maria@clara.com",
        },
      },
    ];

    for (const test of tests) {
      const { expected } = test;
      await supertest(app)
        .post(path)
        .send(test.body)
        .expect((res) => {
          const { body, status } = res;
          try {
            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.CREATED);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (/** @type {any} */ err) {
            throw new Error(`
              test failed with infos: \n${formatObject(test)} \n 
              body: \n${formatObject(body)}\n
              \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("Assures that expected errors happen", async () => {
    const tests = [
      {
        name: "no real name",
        body: {
          real_name: "",
          user_name: "No real name",
          email: "noname@email",
          password: "9asndsadew",
        },
      },
      {
        name: "no user name",
        body: {
          real_name: "Talitos",
          user_name: "",
          email: "saion@swad",
          password: "asonasdaw235d",
        },
      },
      {
        name: "no email",
        body: {
          real_name: "Talitos",
          user_name: "talezitos",
          email: "",
          password: "asonasdwadasd324",
        },
      },
      {
        name: "no password",
        body: {
          real_name: "Talitos",
          user_name: "talezitos",
          email: "tasld@sda",
          password: "",
        },
      },
      {
        name: "Badly formatted email",
        body: {
          real_name: "Talitos",
          user_name: "talezitos",
          email: "tasld",
          password: "sada90uhj0",
        },
      },
    ];

    for (const test of tests) {
      const { name } = test;
      await supertest(app)
        .post(path)
        .send(test.body)
        .expect((res) => {
          const { body } = res;
          try {
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);

            if (body.error_code) {
              expect(body.error_code).toBe("23514");
            }

            expect(body).toHaveProperty("error");
          } catch (/** @type {any} */ err) {
            throw new Error(`
              expected error ${name} did not happen\n test infos: \n${formatObject(
              test
            )} \n body: \n${formatObject(body)}\n 
            \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("Ensure error user already exists", async () => {
    const tests = [
      {
        real_name: "Talzos",
        user_name: "Talzositosss",
        email: "t@asion",
        password: "9shnd80bn",
      },
    ];

    for (const test of tests) {
      const { real_name, user_name, email, password } = test;
      await createDatabaseUser(real_name, user_name, email, password);

      await supertest(app)
        .post(path)
        .send(test)
        .expect((res) => {
          const { body } = res;
          try {
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
            expect(body).toHaveProperty("error");

            expect(body.error_code).toBe("23505");

            expect(body.error).toBe("Given user already exists");
          } catch (err) {
            throw new Error(`
              expected error did not happen\n test: \n${formatObject(test)}\n
              body: \n${formatObject(body)}\n
              error: \n${err}\n
              `);
          }
        });
    }
  });
});
