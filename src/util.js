
module.exports.bind = (fn, ...args) => fn.bind(null, ...args); 
module.exports.average = arr => arr.reduce((acc, val) => acc + val, 0) / arr.length;
module.exports.toTuples = obj => Object.keys(obj).map(key => [key, obj[key]]);
module.exports.identity = arg => arg; 