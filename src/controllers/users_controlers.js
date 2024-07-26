/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import { StatusCodes } from "http-status-codes";
import {
  createDatabaseUser,
  ErrorAlreadyExists,
  InvalidEmailFormat,
} from "../database/users_queries.js";
import { databaseUserToUser } from "../models/app_users.js";

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerCreateUser(req, res) {
  const { real_name, user_name, email, password } = req.body;
  if (!real_name || !user_name || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: `unfilfilled params ${req.body}`,
    });
  }

  let dbUser;

  try {
    dbUser = await createDatabaseUser(real_name, user_name, email, password);
  } catch (err) {
    if (err instanceof ErrorAlreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Given user already exists",
        error_infos: err,
      });
    }
    if (err instanceof InvalidEmailFormat) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid email format",
        error_infos: err,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not create user",
      error_infos: err,
    });
  }

  // databaseUserToUser hides secure user information
  return res.status(StatusCodes.CREATED).json(databaseUserToUser(dbUser));
}

export { handlerCreateUser };
