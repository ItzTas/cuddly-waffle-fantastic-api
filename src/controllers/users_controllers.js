/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import { StatusCodes } from "http-status-codes";
import {
  createDatabaseUser,
  ErrorAlreadyExists,
  ErrorNotFound,
  getAllDatabaseUsers,
  getUserByEmail,
  getUserById,
  InvalidEmailFormat,
  updateAllUsersInfosById,
  updateUserPasswordById,
} from "../database/users_queries.js";
import { databaseUserToUser } from "../models/users.js";
import { validate } from "uuid";
import { compareHashFromPassword } from "../auth/auth.js";

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerCreateUser(req, res) {
  const { real_name, user_name, email, password } = req.body;
  if (!real_name || !user_name || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "unfilfilled params",
      sent_params: req.body,
    });
  }

  let dbUser;

  try {
    dbUser = await createDatabaseUser(real_name, user_name, email, password);
  } catch (err) {
    if (err instanceof ErrorAlreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Given user already exists",
        error_code: err.code,
        error_infos: err.error_infos,
      });
    }
    if (err instanceof InvalidEmailFormat) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid email format",
        error_code: err.code,
        error_infos: err.error_infos,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not create user",
      error_infos: err,
    });
  }

  // databaseUserToUser hides secure users information
  return res.status(StatusCodes.CREATED).json(databaseUserToUser(dbUser));
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerGetUserById(req, res) {
  const { id } = req.params;
  if (!validate(id)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "invalid uuid format",
      id_sent: id,
    });
  }

  let dbuser;
  try {
    dbuser = await getUserById(id);
  } catch (err) {
    if (err instanceof ErrorNotFound) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "user not found",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not get user",
      error_infos: err,
    });
  }

  return res.status(StatusCodes.OK).json(databaseUserToUser(dbuser));
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerUpdateAllUserInfosById(req, res) {
  const { id } = req.params;
  if (!validate(id)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "invalid uuid format",
      sent_id: id,
    });
  }

  let { new_user_name, new_real_name, new_email, new_password } = req.body;

  let dbuser;
  try {
    dbuser = await getUserById(id);
  } catch (err) {
    if (err instanceof ErrorNotFound) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "given user not found",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not get user",
      error_infor: err,
    });
  }

  if (!new_user_name) {
    new_user_name = dbuser.user_name;
  }
  if (!new_real_name) {
    new_real_name = dbuser.real_name;
  }
  if (!new_email) {
    new_email = dbuser.email;
  }

  let salt;
  let toHash = true;
  if (!new_password) {
    new_password = dbuser;
    toHash = false;
    salt = dbuser.salt;
  }

  try {
    dbuser = await updateAllUsersInfosById(
      id,
      new_real_name,
      new_user_name,
      new_email,
      new_password,
      salt,
      toHash
    );
  } catch (err) {
    if (err instanceof ErrorAlreadyExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "user with updated infos already exists",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not update user",
      error_infos: err,
    });
  }

  return res.status(StatusCodes.OK).json(databaseUserToUser(dbuser));
}

/**
 *
 * @param {Request} _
 * @param {Response} res
 */
async function handlerGetAllUsers(_, res) {
  let dbusers;

  try {
    dbusers = await getAllDatabaseUsers();
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "could not get users",
      error_infos: err,
    });
  }

  const users = dbusers.map((dbu) => databaseUserToUser(dbu));
  return res.status(StatusCodes.OK).json(users);
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerGetUserByEmail(req, res) {
  const { email } = req.params;

  let dbUser;
  try {
    dbUser = await getUserByEmail(email);
  } catch (err) {
    if (err instanceof ErrorNotFound) {
      return res.status(404).json({
        error: "user with given email not found",
      });
    }
    return res.status(500).json({
      error: "could not get user",
      error_infos: err,
    });
  }

  return res.status(200).json(databaseUserToUser(dbUser));
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handlerUpdateUserPasswordById(req, res) {
  const { id } = req.params;
  if (!validate(id)) {
    return res.status(400).json({
      error: "invalid uuid format",
    });
  }

  const { new_password, old_password } = req.body;
  if (!new_password || !old_password) {
    return res.status(400).json({
      error: "new_password and old_password params required",
    });
  }

  let dbuser;
  try {
    dbuser = await getUserById(id);
  } catch (err) {
    if (err instanceof ErrorNotFound) {
      return res.status(404).json({
        error: "user with given id not found",
      });
    }
    return res.status(500).json({
      error: "could not get user",
      error_infos: err,
    });
  }

  let authenticated;
  try {
    authenticated = await compareHashFromPassword(
      old_password,
      dbuser.salt,
      dbuser.password
    );
  } catch (err) {
    return res.status(500).json({
      error: "could not compare password",
      error_infos: err,
    });
  }

  if (!authenticated) {
    return res.status(401).json({
      error: "unauthorized",
    });
  }

  let updatedUser;
  try {
    updatedUser = await updateUserPasswordById(id, new_password);
  } catch (err) {
    return res.status(500).json({
      error: "could not update user",
      error_infos: err,
    });
  }

  return res.status(200).json(databaseUserToUser(updatedUser));
}

export {
  handlerCreateUser,
  handlerGetUserById,
  handlerUpdateAllUserInfosById,
  handlerGetAllUsers,
  handlerGetUserByEmail,
  handlerUpdateUserPasswordById,
};
