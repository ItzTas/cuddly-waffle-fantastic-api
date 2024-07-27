import supertest from "supertest";
import {
  createDatabaseUser,
  truncateUsersTable,
} from "../../database/users_queries.js";
import app from "../../main.js";
import { StatusCodes } from "http-status-codes";
import { formatObject } from "../../../helpers/helpers.js";
import { v4 as uuidv4 } from "uuid";

describe("post /api/users/accounts", () => {
  beforeEach(async () => {
    await truncateUsersTable();
  });
  afterEach(async () => {
    await truncateUsersTable();
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
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
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
      {
        real_name: "Alice Johnson",
        user_name: "alicejohnson23",
        email: "alice.johnson@example.com",
        password: "p@ssw0rd123",
      },
      {
        real_name: "Carlos Silva",
        user_name: "carlossilva987",
        email: "carlos.silva@domain.com",
        password: "s3cr3tP@ssw0rd",
      },
    ];

    for (const test of tests) {
      await supertest(app).post(path).send(test);
      await supertest(app).post(path).send(test);

      await supertest(app)
        .post(path)
        .send(test)
        .expect((res) => {
          const { body } = res;
          try {
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
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

describe("get /api/users/:id/id", () => {
  beforeEach(async () => {
    await truncateUsersTable();
  });
  afterEach(async () => {
    await truncateUsersTable();
  });

  /**
   *
   * @param {String} id
   * @returns {String}
   */
  function getPath(id) {
    return `/api/users/${id}/id`;
  }

  it("assures equallity and security in informations", async () => {
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
    ];

    for (const test of tests) {
      const { body, expected } = test;
      const { id } = await createDatabaseUser(
        body.real_name,
        body.user_name,
        body.email,
        body.password
      );
      const url = getPath(id);

      await supertest(app)
        .get(url)
        .expect((res) => {
          const { body: resBody, status } = res;
          try {
            expect(id).toBe(resBody.id);
            expect(resBody.real_name).toBe(expected.real_name);
            expect(resBody.user_name).toBe(expected.user_name);
            expect(resBody.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.OK);

            expect(resBody).toHaveProperty("created_at");
            expect(resBody).toHaveProperty("updated_at");

            expect(resBody).not.toHaveProperty("password");
            expect(resBody).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
              test failed with infos: \n${formatObject(test)} \n 
              body: \n${formatObject(resBody)}\n
              \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("Expected error invalid uuid", async () => {
    const tests = [
      "not valid",
      "this is not a valid id",
      "sioadn902h98ns8ndca90bd89abd",
    ];

    for (const id of tests) {
      const url = getPath(id);
      await supertest(app)
        .get(url)
        .expect((res) => {
          const { body, status } = res;
          try {
            expect(status).toBe(StatusCodes.BAD_REQUEST);
            expect(body).toHaveProperty("id_sent");

            expect(body.id_sent).toBe(id);
            expect(body).toHaveProperty("error");
          } catch (err) {
            throw new Error(
              `expected error did not happen with uuid: \n${id}\n error: ${err}`
            );
          }
        });
    }
  });

  it("expected error user not found", async () => {
    for (let _ = 1; _ <= 10; _++) {
      const id = uuidv4();

      const path = getPath(id);

      await supertest(app)
        .get(path)
        .expect((res) => {
          const { body, status } = res;
          try {
            expect(status).toBe(StatusCodes.NOT_FOUND);
            expect(body).toHaveProperty("error");

            expect(body.error).toBe("user not found");
          } catch (err) {
            throw new Error(`
              expected error with user not found did not happen with id: ${id} and status: ${status}
              body: \n${formatObject(body)}\n
              error: \n${err}\n
              `);
          }
        });
    }
  });
});

describe("patch /api/users/:id/id", () => {
  beforeEach(async () => {
    await truncateUsersTable();
  });
  afterEach(async () => {
    await truncateUsersTable();
  });

  /**
   *
   * @param {string} id
   * @returns {string}
   */
  function getPath(id) {
    return `/api/users/${id}/id`;
  }

  it(`check equallity and security in informations`, async () => {
    const tests = [
      {
        input: {
          new_real_name: "talitoss",
          new_user_name: "itztaslis",
          new_email: "tal@emil",
          new_password: "as9dhn98",
        },
        expected: {
          real_name: "talitos",
          user_name: "itztasli",
          email: "tal@emi",
          password: "as9dhn9",
        },
      },
      {
        input: {
          new_real_name: "joaodoe",
          new_user_name: "joaouser",
          new_email: "joao@doe.com",
          new_password: "joaopass123",
        },
        expected: {
          real_name: "joaodo",
          user_name: "joaouse",
          email: "joao@doe.co",
          password: "joaopass12",
        },
      },
    ];

    for (const test of tests) {
      const { new_real_name, new_user_name, new_email, new_password } =
        test.input;
      const { expected } = test;

      const { id } = await createDatabaseUser(
        new_real_name,
        new_user_name,
        new_email,
        new_password
      );

      const sent_body = {
        new_real_name: new_real_name.slice(0, -1),
        new_user_name: new_user_name.slice(0, -1),
        new_email: new_email.slice(0, -1),
        new_password: new_password.slice(0, -1),
      };

      const path = getPath(id);
      await supertest(app)
        .patch(path)
        .send(sent_body)
        .expect((res) => {
          const { body, status } = res;
          try {
            expect(status).toBe(StatusCodes.OK);

            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
              expected result did not happen 
              \n test infos: \n${formatObject(test)}\n
              \n body: \n${formatObject(body)}\n
              \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("check id validation", async () => {
    const tests = [
      "not valid",
      "this is not a valid id",
      "sioadn902h98ns8ndca90bd89abd",
    ];

    for (const id of tests) {
      const path = getPath(id);

      await supertest(app)
        .patch(path)
        .send({})
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(status).toBe(StatusCodes.BAD_REQUEST);

            expect(body).toHaveProperty("sent_id");
            expect(body.sent_id).toBe(id);
          } catch (err) {
            throw new Error(`
              expected error did not happen with id: ${id}
              \n body: \n${body}\n
              \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("expected error user not found", async () => {
    for (let _ = 1; _ <= 10; _++) {
      const id = uuidv4();
      const path = getPath(id);

      await supertest(app)
        .patch(path)
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(status).toBe(StatusCodes.NOT_FOUND);

            expect(body).toHaveProperty("error");
            expect(body.error).toBe("given user not found");
          } catch (err) {
            throw new Error(`
              Expected error did not happen with id: ${id}
              \n body: \n${body}\n
              \n error: \n${err}\n
              `);
          }
        });
    }
  });

  it("password parcial update", async () => {
    const tests = [
      {
        input: {
          real_name: "Ruan",
          user_name: "ruan_AAA",
          email: "ruan@AAA",
          password: "as9dn90",
          new_password: "as9dn9",
        },
        expected: {
          real_name: "Ruan",
          user_name: "ruan_AAA",
          email: "ruan@AAA",
        },
      },
      {
        input: {
          real_name: "Tales",
          user_name: "Taleszito",
          email: "tales@site.com",
          password: "strongpassword123",
          new_password: "strongpassword12",
        },
        expected: {
          real_name: "Tales",
          user_name: "Taleszito",
          email: "tales@site.com",
        },
      },
    ];

    for (const test of tests) {
      const { input, expected } = test;
      const { id } = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const path = getPath(id);

      const toSend = { new_password: input.new_password };

      await supertest(app)
        .patch(path)
        .send(toSend)
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.OK);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
            expected result did not happen 
            \n test infos: \n${formatObject(test)}\n
            \n body: \n${formatObject(body)}\n
            \n error: \n${err}\n
          `);
          }
        });
    }
  });

  it("email partial update", async () => {
    const tests = [
      {
        input: {
          real_name: "Ruana",
          user_name: "ruan_AAAa",
          email: "ruan@AAAa",
          password: "as9dn90",
          new_email: "ruan@BBB",
        },
        expected: {
          real_name: "Ruana",
          user_name: "ruan_AAAa",
          email: "ruan@BBB",
          password: "as9dn90",
        },
      },
      {
        input: {
          real_name: "Talesa",
          user_name: "Taleszitoa",
          email: "tales@site.com",
          password: "strongpassword123",
          new_email: "tales@newsite.com",
        },
        expected: {
          real_name: "Talesa",
          user_name: "Taleszitoa",
          email: "tales@newsite.com",
          password: "strongpassword123",
        },
      },
      {
        input: {
          real_name: "Ana Mariaa",
          user_name: "ana_maria123",
          email: "ana@maaria.com",
          password: "password456",
          new_email: "ana@newmaria.com",
        },
        expected: {
          real_name: "Ana Mariaa",
          user_name: "ana_maria123",
          email: "ana@newmaria.com",
          password: "password456",
        },
      },
    ];

    for (const test of tests) {
      const { input, expected } = test;
      const { id } = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const path = getPath(id);

      const toSend = { new_email: input.new_email };

      await supertest(app)
        .patch(path)
        .send(toSend)
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.OK);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
            expected result did not happen 
            \n test infos: \n${formatObject(test)}\n
            \n body: \n${formatObject(body)}\n
            \n error: \n${err}\n
          `);
          }
        });
    }
  });

  it("real_name partial update", async () => {
    const tests = [
      {
        input: {
          real_name: "Ruana",
          user_name: "ruan_AAAa",
          email: "ruan@AAAa",
          password: "as9dn90",
          new_real_name: "Ruana Updated",
        },
        expected: {
          real_name: "Ruana Updated",
          user_name: "ruan_AAAa",
          email: "ruan@AAAa",
          password: "as9dn90",
        },
      },
      {
        input: {
          real_name: "Talesa",
          user_name: "Taleszitoa",
          email: "tales@site.com",
          password: "strongpassword123",
          new_real_name: "Talesa Updated",
        },
        expected: {
          real_name: "Talesa Updated",
          user_name: "Taleszitoa",
          email: "tales@site.com",
          password: "strongpassword123",
        },
      },
      {
        input: {
          real_name: "Ana Mariaa",
          user_name: "ana_maria123",
          email: "ana@maaria.com",
          password: "password456",
          new_real_name: "Ana Mariaa Updated",
        },
        expected: {
          real_name: "Ana Mariaa Updated",
          user_name: "ana_maria123",
          email: "ana@maaria.com",
          password: "password456",
        },
      },
    ];

    for (const test of tests) {
      const { input, expected } = test;
      const { id } = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const path = getPath(id);

      const toSend = { new_real_name: input.new_real_name };

      await supertest(app)
        .patch(path)
        .send(toSend)
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.OK);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
            expected result did not happen 
            \n test infos: \n${formatObject(test)}\n
            \n body: \n${formatObject(body)}\n
            \n error: \n${err}\n
          `);
          }
        });
    }
  });

  it("user_name partial update", async () => {
    const tests = [
      {
        input: {
          real_name: "Ruana",
          user_name: "ruan_AAAa",
          email: "ruan@AAAa",
          password: "as9dn90",
          new_user_name: "ruan_AAAa_updated",
        },
        expected: {
          real_name: "Ruana",
          user_name: "ruan_AAAa_updated",
          email: "ruan@AAAa",
          password: "as9dn90",
        },
      },
      {
        input: {
          real_name: "Talesa",
          user_name: "Taleszitoa",
          email: "tales@site.com",
          password: "strongpassword123",
          new_user_name: "Taleszitoa_updated",
        },
        expected: {
          real_name: "Talesa",
          user_name: "Taleszitoa_updated",
          email: "tales@site.com",
          password: "strongpassword123",
        },
      },
      {
        input: {
          real_name: "Ana Mariaa",
          user_name: "ana_maria123",
          email: "ana@maaria.com",
          password: "password456",
          new_user_name: "ana_maria123_updated",
        },
        expected: {
          real_name: "Ana Mariaa",
          user_name: "ana_maria123_updated",
          email: "ana@maaria.com",
          password: "password456",
        },
      },
    ];

    for (const test of tests) {
      const { input, expected } = test;
      const { id } = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const path = getPath(id);

      const toSend = { new_user_name: input.new_user_name };

      await supertest(app)
        .patch(path)
        .send(toSend)
        .expect((res) => {
          const { status, body } = res;
          try {
            expect(body.real_name).toBe(expected.real_name);
            expect(body.user_name).toBe(expected.user_name);
            expect(body.email).toBe(expected.email);

            expect(status).toBe(StatusCodes.OK);

            expect(body).toHaveProperty("created_at");
            expect(body).toHaveProperty("updated_at");
            expect(body).toHaveProperty("id");

            expect(body).not.toHaveProperty("password");
            expect(body).not.toHaveProperty("salt");
          } catch (err) {
            throw new Error(`
            expected result did not happen 
            \n test infos: \n${formatObject(test)}\n
            \n body: \n${formatObject(body)}\n
            \n error: \n${err}\n
          `);
          }
        });
    }
  });

  it("should return BAD_REQUEST when user with updated infos already exists", async () => {
    const tests = [
      {
        baseUser: {
          real_name: "BaseUser",
          user_name: "baseUser",
          email: "base@user.com",
          password: "password123",
        },
        conflictingUser: {
          real_name: "BaseUser Updated",
          user_name: "baseUserUpdated",
          email: "base@updated.com",
          password: "newpassword123",
        },
        conflictingUpdate: {
          new_real_name: "BaseUser Updated",
          new_user_name: "baseUserUpdated",
          new_email: "base@updated.com",
          new_password: "anotherpassword123",
        },
      },
      {
        baseUser: {
          real_name: "ConflictingUser",
          user_name: "conflictingUser",
          email: "conflicting@user.com",
          password: "password123",
        },
        conflictingUser: {
          real_name: "ConflictingUser Updated",
          user_name: "conflictingUserUpdated",
          email: "conflicting@updated.com",
          password: "differentpassword123",
        },
        conflictingUpdate: {
          new_real_name: "ConflictingUser Updated",
          new_user_name: "conflictingUserUpdated",
          new_email: "conflicting@updated.com",
          new_password: "yetanotherpassword123",
        },
      },
    ];

    for (const { baseUser, conflictingUser, conflictingUpdate } of tests) {
      const { id } = await createDatabaseUser(
        baseUser.real_name,
        baseUser.user_name,
        baseUser.email,
        baseUser.password
      );

      await createDatabaseUser(
        conflictingUser.real_name,
        conflictingUser.user_name,
        conflictingUser.email,
        conflictingUser.password
      );

      const path = getPath(id);

      await supertest(app)
        .patch(path)
        .send(conflictingUpdate)
        .expect((res) => {
          const { body, status } = res;
          try {
            expect(body).toEqual({
              error: "user with updated infos already exists",
            });

            expect(body).toHaveProperty("error");

            expect(status).toBe(StatusCodes.BAD_REQUEST);
          } catch (err) {
            throw new Error(`
            expected result did not happen 
            \n test: \n${formatObject({
              baseUser,
              conflictingUser,
              conflictingUpdate,
            })}\n
            \n body: \n${formatObject(body)}\n
            \n error: \n${err}\n
          `);
          }
        });
    }
  });
});

describe("get /api/users", () => {
  beforeEach(async () => {
    await truncateUsersTable();
  });
  afterEach(async () => {
    await truncateUsersTable();
  });
  const path = "/api/users";

  it("assures equallity and security in returned data", async () => {
    const tests = [];
  });
});
