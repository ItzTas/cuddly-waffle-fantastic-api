import moment from "moment";

/**
 *
 * @param {Object} obj
 * @returns {Object}
 */
function formatObject(obj) {
  return JSON.stringify(obj, null, 2);
}
function getNowUTC() {
  return moment().utc().format();
}

export { formatObject, getNowUTC };
