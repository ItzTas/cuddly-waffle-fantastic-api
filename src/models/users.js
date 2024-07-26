/**
 *
 * @param {String} id
 * @param {String} real_name
 * @param {String} user_name
 * @param {String} email
 * @param {EpochTimeStamp} created_at
 * @param {EpochTimeStamp} updated_at
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
 * @param {Object} dbUser
 * @returns {User}
 */
function databaseUserToUser(dbUser) {
  return new User(
    // @ts-ignore
    dbUser.id,
    // @ts-ignore
    dbUser.real_name,
    // @ts-ignore
    dbUser.user_name,
    // @ts-ignore
    dbUser.email,
    // @ts-ignore
    dbUser.created_at,
    // @ts-ignore
    dbUser.updated_at
  );
}

export { databaseUserToUser };
