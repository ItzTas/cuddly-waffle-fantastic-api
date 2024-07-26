/**
 *
 * @param {Object} obj
 * @returns {Object}
 */
function formatObject(obj) {
  return JSON.stringify(obj, null, 2);
}

export { formatObject };
