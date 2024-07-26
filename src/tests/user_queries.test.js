import { compareHashFromPassword } from "../../auth/auth.js";
import { pool } from "../../database/database_client.js";
import {
  createDatabaseUser,
  truncateUsersTable,
} from "../../database/users_queries.js";
//@ts-ignore
import supertest from "supertest";

describe("Create database user", () => {
  beforeAll(async () => {
    await truncateUsersTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("Assert equality with created users", async () => {
    const tests = [
      {
        input: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@",
          password: "123",
        },
        expected: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@",
          password: "123",
        },
      },
      {
        input: {
          real_name: "User!@#",
          user_name: "user!@#",
          email: "user!@#@domain.com",
          password: "password123",
        },
        expected: {
          real_name: "User!@#",
          user_name: "user!@#",
          email: "user!@#@domain.com",
          password: "password123",
        },
      },
      {
        input: {
          real_name: "Encrypt Test",
          user_name: "encrypittest",
          email: "encrypt@domain.com",
          password: "securepassword",
        },
        expected: {
          real_name: "Encrypt Test",
          user_name: "encrypittest",
          email: "encrypt@domain.com",
          password: "securepassword",
        },
      },
    ];

    for (const test of tests) {
      try {
        const user = await createDatabaseUser(
          test.input.real_name,
          test.input.user_name,
          test.input.email,
          test.input.password
        );

        const { expected } = test;

        expect(user.real_name).toBe(expected.real_name);
        expect(user.user_name).toBe(expected.user_name);
        expect(user.email).toBe(expected.email);
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("created_at");
        expect(user).toHaveProperty("updated_at");
        expect(user).toHaveProperty("salt");

        expect(user.password).not.toBe(expected.password);

        const resultCompPassword = await compareHashFromPassword(
          expected.password,
          user.salt,
          user.password
        );

        expect(resultCompPassword).toBe(true);
      } catch (err) {
        throw new Error(
          `User with infos: \n${JSON.stringify(test, null, 2)}\n ${
            //@ts-ignore
            err?.message
          } `
        );
      }
    }
  });

  it("Intended error in creating user", async () => {
    const tests = [
      {
        name: "Badly formatted email",
        input: {
          real_name: "Tales",
          user_name: "ItzTas",
          password: "asodl923m9fds",
          email: "Badly formatted",
        },
      },
      {
        name: "No password",
        input: {
          real_name: "Jesse",
          user_name: "opaaaaa",
          email: "test@!",
          password: "",
        },
      },
      {
        name: "User already exists",
        input: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@",
          password: "123",
        },
      },
    ];

    for (const test of tests) {
      const { input, name } = test;
      try {
        await expect(
          createDatabaseUser(
            input?.real_name,
            input?.user_name,
            input?.email,
            input?.password
          )
        ).rejects.toThrow(Error);
      } catch (err) {
        throw new Error(
          `expected error ${name} did not happen! Test infos: \n${JSON.stringify(
            test,
            null,
            2
            //@ts-ignore
          )}\n ${err?.message}`
        );
      }
    }
  });
});
