import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { defaultTokenExpiration } from "../main.js";
import { v4 as uuidv4 } from "uuid";
import { getNowUTC } from "../helpers/helpers.js";
import moment from "moment";

if (!process.env["JWT_SECRET"]) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}
const secret = `${process.env["JWT_SECRET"]}`;
const PEPPER = process.env["PEPPER"];

class TokenAlreadyExpiredError extends Error {}

/**
 *
 * @param {string} hashedPassword
 * @param {string} salt
 */
function hashAndSalt(hashedPassword, salt) {
  this.hashedPassword = hashedPassword;
  this.salt = salt;
}

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 *
 * @param {String} password
 * @returns {Promise<hashAndSalt>}
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
 * @param {Object.<any, any>} payload
 * @param {jwt.SignOptions} [options={ expiresIn: defaultTokenExpiration }]
 * @returns {String}
 */
function signWebToken(payload, options = {}) {
  options.expiresIn = options.expiresIn || defaultTokenExpiration;
  options.issuer = "cuddly-waffle-fantastic";
  options.jwtid = uuidv4();
  options.subject = options.subject || payload.id;

  payload.iat = moment().unix();

  return jwt.sign(payload, secret, options);
}

/**
 *
 * @param {String} token
 * @param {jwt.VerifyOptions | undefined} options
 * @returns
 */
function decodeWebToken(token, options = undefined) {
  try {
    return jwt.verify(token, secret, options);
  } catch (/** @type {any} */ err) {
    if (err.name === "TokenExpiredError") {
      throw new TokenAlreadyExpiredError(
        `Token verification failed: Token expired at ${err.expiredAt}`
      );
    }
    if (err.name === "JsonWebTokenError") {
      throw new Error(
        `Token verification failed: Invalid token - ${err.message}`
      );
    }
    throw new Error(`Token verification failed: ${err.message}`);
  }
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

export {
  hashPassword,
  compareHashFromPassword,
  signWebToken,
  decodeWebToken,
  TokenAlreadyExpiredError,
};
