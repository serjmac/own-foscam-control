module.exports.formatTime = function (seconds) {
  function pad(s) {
    return (s < 10 ? "0" : "") + s;
  }
  var hours = Math.floor(seconds / (60 * 60));
  var minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);
  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
};

/**
 * Recurse through a JSON structure and remove array values equal to "" and object key: value pairs where the value === "".
 * Used to remove empty XML tags from the output JSON created by koaXmlBody.
 *
 * @param {Object[]} val The JSON structure
 * @returns {Object[]} The new JSON structure with empty values removed
 */
const removeEmptyValues = function (val) {
  if (Array.isArray(val)) {
    return val.reduce((res, cur) => {
      if (cur !== "") {
        return [...res, removeEmptyValues(cur)];
      }
      return res;
    }, []);
  } else if (Object.prototype.toString.call(val) === "[object Object]") {
    return Object.keys(val).reduce((res, key) => {
      if (val[key] !== "") {
        return Object.assign({}, res, { [key]: removeEmptyValues(val[key]) });
      }
      return res;
    }, undefined);
  }
  return val;
};

//delete props from object
module.exports.deleteProps = function (obj, propsArr) {
  for (let i = 0; i < propsArr.length; i++) {
    if (obj.hasOwnProperty(propsArr[i])) {
      delete obj[propsArr[i]];
    }
  }
  return obj;
};

module.exports.getConnThreadId = async (pool) => {
  await pool.getConnection().then((conn) => {
    const threadId = "connection threadId " + conn.threadId;
    console.log(threadId);
    conn.release();
  });
};
