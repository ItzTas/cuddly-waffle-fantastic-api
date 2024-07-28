import { compareHashFromPassword } from "../../auth/auth.js";
import {
  createDatabaseUser,
  ErrorAlreadyExists,
  ErrorNotFound,
  getAllDatabaseUsers,
  getUserByEmail,
  getUserById,
  InvalidUUID,
  truncateUsersTable,
  updateAllUsersInfosById,
  updateUserPasswordById,
} from "../../database/users_queries.js";
import { v4 as uuidv4 } from "uuid";
import { formatObject } from "../../helpers/helpers.js";

beforeEach(async () => {
  await truncateUsersTable();
});
afterEach(async () => {
  await truncateUsersTable();
});

describe("Create database user", () => {
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
          `expected error ${name} did not happen! 
          \n Test infos: \n${formatObject(test)} 
          \n error: ${err}`
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
            `Unexpected error for user: 
            \n${formatObject(test)}
            \n Error: \n${err}\n`
          );
        }
      }
    }
  });
});

describe("Get user by id", () => {
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
    ];

    for (const test of tests) {
      const { input } = test;
      const { id } = await createDatabaseUser(
        input.real_name,
        input.user_name,
        input.email,
        input.password
      );
      const { expected } = test;

      try {
        const user = await getUserById(id);

        expect(user.id).toBe(id);
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
          `User with infos: \n${formatObject(test)}\n error: \n${err}\n `
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

describe("Update all users infos by id", () => {
  it("assert equality with updated users", async () => {
    const tests = [
      {
        input: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@as",
          password: "123",
        },
        expected: {
          real_name: "Tale",
          user_name: "ItzTa",
          email: "example@a",
          password: "12",
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
          real_name: "User!@",
          user_name: "user!@",
          email: "user!@#@domain.co",
          password: "password12",
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

      const user = await updateAllUsersInfosById(
        id,
        input.real_name.slice(0, -1),
        input.user_name.slice(0, -1),
        input.email.slice(0, -1),
        input.password.slice(0, -1)
      );

      try {
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
        throw new Error(`
          informations did not match 
          \n test: \n${formatObject(test)}\n
          \n user: \n${formatObject(user)}\n
          \n error: \n${err}\n
          `);
      }
    }
  });

  it("check uuid validation", async () => {
    const tests = [
      "not valid",
      "this is not an valid id",
      "sioadn902h98ns8ndca90bd89abd",
    ];

    for (const id of tests) {
      try {
        await expect(updateAllUsersInfosById(id)).rejects.toThrow(InvalidUUID);
      } catch (err) {
        throw new Error(`
          expected error did not happend with id: ${id}
          \n error: ${err}
          `);
      }
    }
  });
});

describe("get all database users", () => {
  it("assures equality in informations", async () => {
    await truncateUsersTable();

    /**
     * @type {Array<Object.<string, string>>}
     */
    const tests = [
      {
        real_name: "talit",
        user_name: "tails",
        email: "email@calvice",
        password: "as900dh98",
      },
    ];

    for (const test of tests) {
      const { real_name, user_name, email, password } = test;
      await createDatabaseUser(real_name, user_name, email, password);
    }

    const users = await getAllDatabaseUsers();

    for (const user of users) {
      const test = tests.find((t) => t.email === user.email);
      try {
        expect(users.length).toBe(tests.length);
        expect(user).toBeDefined();
        // @ts-ignore
        expect(user.real_name).toBe(test.real_name);
        // @ts-ignore
        expect(user.user_name).toBe(test.user_name);
        // @ts-ignore
        expect(user.email).toBe(test.email);

        expect(user).toHaveProperty("created_at");
        expect(user).toHaveProperty("updated_at");
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("password");
        expect(user).toHaveProperty("salt");

        // @ts-ignore
        expect(user.password).not.toBe(test.password);
      } catch (err) {
        throw new Error(`
          test with infos: \n${test}\n
          \n user with infos: \n${formatObject(user)}\n
          \n error: \n${err}\n
          `);
      }
    }
  });
});

describe("get users by email", () => {
  it("ensures equallity in informations", async () => {
    const tests = [
      {
        real_name: "tales lindo",
        user_name: "taleestos",
        email: "asdaino@90h",
        password: "sa90dhn98awbdns",
      },
      {
        real_name: "User!@#",
        user_name: "user!@#",
        email: "user!@#@domain.com",
        password: "password123",
      },
    ];

    for (const test of tests) {
      const { real_name, user_name, email, password } = test;
      await createDatabaseUser(real_name, user_name, email, password);

      try {
        const user = await getUserByEmail(email);

        expect(user.real_name).toBe(test.real_name);
        expect(user.user_name).toBe(test.user_name);
        expect(user.email).toBe(test.email);

        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("created_at");
        expect(user).toHaveProperty("updated_at");
        expect(user).toHaveProperty("salt");

        expect(user.password).not.toBe(test.password);

        const resultCompPassword = await compareHashFromPassword(
          test.password,
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

  it("assures error not found", async () => {
    const tests = [
      {
        real_name: "tales lindo",
        user_name: "taleestos",
        email: "asdaino@90h",
        password: "sa90dhn98awbdns",
      },
      {
        real_name: "User!@#",
        user_name: "user!@#",
        email: "user!@#@domain.com",
        password: "password123",
      },
    ];

    for (const test of tests) {
      try {
        await expect(getUserByEmail(test.email)).rejects.toThrow(ErrorNotFound);
      } catch (err) {
        throw new Error(
          `User with infos: \n${formatObject(test)}\n error: ${err} `
        );
      }
    }
  });
});

describe("update user password by id", () => {
  it("assures return values match", async () => {
    const tests = [
      {
        input: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@as",
          password: "12345",
        },
        expected: {
          real_name: "Tales",
          user_name: "ItzTas",
          email: "example@as",
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
          password: "password1",
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

      let upUser;
      try {
        upUser = await updateUserPasswordById(id, input.password.slice(0, -2));

        expect(upUser).toHaveProperty("user_name", expected.user_name);
        expect(upUser).toHaveProperty("real_name", expected.real_name);
        expect(upUser).toHaveProperty("email", expected.email);

        expect(upUser).toHaveProperty("updated_at");
        expect(upUser).toHaveProperty("created_at");
        expect(upUser).toHaveProperty("salt");
        expect(upUser).toHaveProperty("id", id);

        expect(upUser.password).not.toBe(expected.password);
        const resultCompPassword = await compareHashFromPassword(
          expected.password,
          upUser.salt,
          upUser.password
        );

        expect(resultCompPassword).toBe(true);
      } catch (err) {
        throw new Error(
          `User with infos: \n${formatObject(test)}\n  
          updated user: \n${upUser}\n error: \n${err}\n`
        );
      }
    }
  });
});
