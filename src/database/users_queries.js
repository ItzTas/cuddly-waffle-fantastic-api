import { pool } from "./database_client.js";
import { v4 as uuidv4, validate } from "uuid";
import { hashPassword } from "../auth/auth.js";
import { DatabaseUser } from "../models/users.js";
import moment from "moment";
import { getNowUTC } from "../../helpers/helpers.js";

class ErrorAlreadyExists extends Error {
  /**
   *
   * @param {String} message
   * @param {String | number} code
   * @param {Object | null} errorInfos
   */
  constructor(message, code, errorInfos = null) {
    if (errorInfos === null) {
      errorInfos = {};
    }
    super(message);
    this.code = code;
    this.error_infos = errorInfos;
  }
}
class InvalidEmailFormat extends Error {
  /**
   *
   * @param {String} message
   * @param {String | number} code
   * @param {Object | null} errorInfos
   */
  constructor(message, code, errorInfos = null) {
    if (errorInfos === null) {
      errorInfos = {};
    }
    super(message);
    this.code = code;
    this.error_infos = errorInfos;
  }
}

class InvalidUUID extends Error {}

class ErrorNotFound extends Error {}

/**
 *
 * @param {String} tableName
 * @returns
 */
function truncateTableQuery(tableName) {
  return `
	TRUNCATE TABLE ${tableName};
  `;
}

async function truncateUsersTable() {
  const query = truncateTableQuery("users");
  await pool.query(query);
}

const createUserQuery = `
	INSERT INTO users (id, real_name, user_name, email, password, salt, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	RETURNING *;
`;

/**
 *
 * @param {String} real_name
 * @param {String} user_name
 * @param {String} email
 * @param {String} password
 * @returns {Promise<DatabaseUser>}
 * @throws {ErrorAlreadyExists}
 * @throws {InvalidEmailFormat}
 * @throws {Error}
 */
async function createDatabaseUser(real_name, user_name, email, password) {
  if (!email || !user_name || !real_name || !password) {
    throw new Error("Unfulfilled params");
  }
  const id = uuidv4();

  //@ts-ignore
  const { hashedPassword, salt } = await hashPassword(password);

  let results;
  try {
    results = await pool.query(createUserQuery, [
      id,
      real_name,
      user_name,
      email,
      hashedPassword,
      salt,
      getNowUTC(),
      getNowUTC(),
    ]);
  } catch (/** @type {any} */ err) {
    if (err?.code === "23505") {
      throw new ErrorAlreadyExists("Given user already exists", err.code, err);
    }
    if (err?.code === "23514") {
      throw new InvalidEmailFormat("invalid email format", err.code, err);
    }
    throw err;
  }

  return results.rows[0];
}

const QueryGetUserById = `
  SELECT * FROM users 
  WHERE id = $1;
`;

/**
 *
 * @param {String} id
 * @returns {Promise<DatabaseUser>}
 */
async function getUserById(id) {
  if (!validate(id)) {
    throw new InvalidUUID("given id is invalid");
  }

  const results = await pool.query(QueryGetUserById, [id]);

  if (results.rows.length === 0) {
    throw new ErrorNotFound("user with given id does not exists");
  }

  return results.rows[0];
}

const QueryUpdateUserById = `
  UPDATE users
  SET real_name = $1, user_name = $2, email = $3, password = $4, salt = $5, updated_at = $6
  WHERE id = $7
  RETURNING *;
`;

/**
 * @readonly -- if any paramether is not specified then it defaults to the user old paramether
 * @async
 * @param {string} id
 * @param {string} newRealName
 * @param {string} newUserName
 * @param {string} newEmail
 * @param {string} newPassword
 * @param {boolean | null} tohash -- if the password is updated it is altomatically set as true, set it true ONLY if the password is updated
 * @returns {Promise<DatabaseUser>}
 * @throws {InvalidUUID}
 * @throws {ErrorNotFound}
 * @throws {Error}
 */
async function updateUserById(
  id,
  newRealName = "",
  newUserName = "",
  newEmail = "",
  newPassword = "",
  tohash = null
) {
  if (!validate(id)) {
    throw new InvalidUUID("Invalid uuid format");
  }
  if (tohash === null) {
    tohash = newPassword !== "";
  }

  let pass;
  let salted;
  if (tohash) {
    const { hashedPassword, salt } = await hashPassword(newPassword);
    pass = hashedPassword;
    salted = salt;
  } else {
    const { password, salt } = await getUserById(id);
    pass = password;
    salted = salt;
  }

  if (newRealName === "") {
    const { real_name } = await getUserById(id);
    newRealName = real_name;
  }
  if (newUserName === "") {
    const { user_name } = await getUserById(id);
    newUserName = user_name;
  }
  if (newEmail === "") {
    const { email } = await getUserById(id);
    newEmail = email;
  }

  const dbuser = await pool.query(QueryUpdateUserById, [
    newRealName,
    newUserName,
    newEmail,
    pass,
    salted,
    getNowUTC(),
    id,
  ]);

  if (dbuser.rows.length === 0) {
    throw new ErrorNotFound("user with given id not found");
  }

  return dbuser.rows[0];
}

export {
  truncateUsersTable,
  createDatabaseUser,
  ErrorAlreadyExists,
  InvalidEmailFormat,
  InvalidUUID,
  getUserById,
  ErrorNotFound,
  updateUserById,
};
