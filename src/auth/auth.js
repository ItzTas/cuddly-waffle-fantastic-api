import crypto from "crypto";
import bcrypt from "bcrypt";

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

const PEPPER = process.env["PEPPER"];

/**
 *
 * @param {String} password
 * @returns {Promise<Object>}
 */
async function hashPassword(password) {
  const saltRounds = 10;
  const salt = generateSalt(16);
  const pass = salt + password + PEPPER;
  const hashedPassword = await bcrypt.hash(pass, saltRounds);
  return { hashedPassword, salt };
}

/**
 *
 * @param {String} password
 * @param {String} salt
 * @param {String} hash
 */
async function compareHashFromPassword(password, salt, hash) {
  const pass = salt + password + PEPPER;
  return await bcrypt.compare(pass, hash);
}

export { hashPassword, compareHashFromPassword };
