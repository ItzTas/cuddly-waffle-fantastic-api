import { formatObject } from "../../../helpers/helpers.js";
import { compareHashFromPassword } from "../../auth/auth.js";
import {
  createDatabaseUser,
  ErrorAlreadyExists,
  ErrorNotFound,
  getUserById,
  InvalidUUID,
  truncateUsersTable,
} from "../../database/users_queries.js";
import { v4 as uuidv4 } from "uuid";

describe("Create database user", () => {
  beforeAll(async () => {
    await truncateUsersTable();
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
      const { expected } = test;
      try {
        const user = await createDatabaseUser(
          test.input.real_name,
          test.input.user_name,
          test.input.email,
          test.input.password
        );

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
          `User with infos: \n${formatObject(test)}\n error: ${err} `
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
        name: "No user name",
        input: {
          real_name: "Walter white",
          user_name: "",
          email: "t@xiaomi",
          password: "123456789asdsdf",
        },
      },
      {
        name: "No email",
        input: {
          real_name: "Happy face",
          user_name: "I am happy !",
          email: "",
          password: "aosdmjiosdngi",
        },
      },
      {
        name: "no real name",
        input: {
          real_name: "",
          user_name: "No Name",
          email: "test@dason",
          password: "asiodnjasd",
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
          `expected error ${name} did not happen! Test infos: \n${formatObject(
            test
          )}\n error: ${err}`
        );
      }
    }
  });

  it("User already exists especific error", async () => {
    const tests = [
      {
        real_name: "Pablo",
        user_name: "pablo_foda",
        email: "pablo@foda",
        password: "sodinfs9irec0i",
      },
      {
        real_name: "Gabriel machado",
        user_name: "Gabriel o batman",
        email: "gabriel@batman",
        password: "9012u890ji9",
      },
    ];

    for (const test of tests) {
      const { real_name, user_name, email, password } = test;

      await createDatabaseUser(real_name, user_name, email, password);

      try {
        await createDatabaseUser(real_name, user_name, email, password);
      } catch (err) {
        if (err instanceof ErrorAlreadyExists) {
          expect(err).toBeInstanceOf(ErrorAlreadyExists);
        } else {
          throw new Error(
            `Unexpected error for user: \n${formatObject(
              test
            )}\n Error: \n${err}\n`
          );
        }
      }
    }
  });
});

describe("Get user by id", () => {
  beforeAll(async () => {
    await truncateUsersTable();
  });

  it("get a user with a id", async () => {
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
      const { input } = test;
      const dbuser = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const { expected } = test;

      try {
        const user = await getUserById(dbuser.id);

        expect(user.id).toBe(dbuser.id);
        expect(user.real_name).toBe(expected.real_name);
        expect(user.user_name).toBe(expected.user_name);
        expect(user.email).toBe(expected.email);

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
          `User with infos: \n${formatObject(test)}\n error: ${err} `
        );
      }
    }
  });

  it("invalid uuid intended error", async () => {
    const tests = [
      "not valid",
      "this is not an valid id",
      "sioadn902h98ns8ndca90bd89abd",
    ];

    for (const id of tests) {
      try {
        await expect(getUserById(id)).rejects.toThrow(InvalidUUID);
      } catch (err) {
        throw new Error(
          `expected error did not happen with uuid: \n${id}\n error: ${err}`
        );
      }
    }
  });

  it("user not found expected error", async () => {
    const tests = [];

    for (let _ = 1; _ <= 10; _++) {
      tests.push(uuidv4());
    }

    for (const id of tests) {
      try {
        await expect(getUserById(id)).rejects.toThrow(ErrorNotFound);
      } catch (err) {
        throw new Error(
          `expected error did not happen with uuid: \n${id}\n error: ${err}`
        );
      }
    }
  });
});
