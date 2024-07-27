// functions that imitate the functionality of types

/**
 *
 * @param {String} id
 * @param {String} real_name
 * @param {String} user_name
 * @param {String} email
 * @param {String | EpochTimeStamp | Date} created_at
 * @param {String | EpochTimeStamp | Date} updated_at
 */
function User(id, real_name, user_name, email, created_at, updated_at) {
  this.id = id;
  this.real_name = real_name;
  this.user_name = user_name;
  this.email = email;
  this.created_at = created_at;
  this.updated_at = updated_at;
}

/**
 *
 * @param {String} id
 * @param {String} real_name
 * @param {String} user_name
 * @param {String} email
 * @param {String} password
 * @param {String} salt
 * @param {String | EpochTimeStamp | Date} created_at
 * @param {String | EpochTimeStamp | Date} updated_at
 */
function DatabaseUser(
  id,
  real_name,
  user_name,
  email,
  password,
  salt,
  created_at,
  updated_at
) {
  this.id = id;
  this.real_name = real_name;
  this.user_name = user_name;
  this.email = email;
  this.password = password;
  this.salt = salt;
  this.created_at = created_at;
  this.updated_at = updated_at;
}

/**
 * @readonly database user to user hides secure user informations
 * @param {DatabaseUser} dbUser
 * @returns {User}
 */
function databaseUserToUser(dbUser) {
  return new User(
    dbUser.id,
    dbUser.real_name,
    dbUser.user_name,
    dbUser.email,
    dbUser.created_at,
    dbUser.updated_at
  );
}

export { databaseUserToUser, User, DatabaseUser };
