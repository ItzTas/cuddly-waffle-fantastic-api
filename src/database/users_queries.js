import moment from "moment";
import { pool } from "./database_client.js";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../auth/auth.js";

class ErrorAlreadyExists extends Error {}

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
 */
async function createDatabaseUser(real_name, user_name, email, password) {
  if (!email || !user_name || !real_name || !password) {
    throw new Error("Unfulfilled params");
  }
  const id = uuidv4();

  const now = moment().utc().format();

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
      now,
      now,
    ]);
  } catch (err) {
    //@ts-ignore
    if (err?.code === "23505") {
      throw new ErrorAlreadyExists("Given user already exists");
    }
    throw err;
  }

  return results.rows[0];
}

export { truncateUsersTable, createDatabaseUser };
