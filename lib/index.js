'use strict';
const url = require('url');
const path = require('path');
const chalk = require('chalk');
const queryString = require('query-string');
module.exports = ({
  mockDir = 'mock',
  entry = 'index.js'
}) => (req, res, next) => {
  const target = require(path.join(mockDir, entry));
  const {
    ignore = () => false,
      storePath,
      routes = createEmpty(),
      prefix = '',
      tip = true,
      delay = 0,
      needMock = true,
  } = target;
  let query = req.query,
    data = createEmpty(),
    params = createEmpty(),
    args = createEmpty(),
    reg = /:(\w+)/,
    contentType = req.headers['content-type'] || 'text/plain;charset=UTF-8',
    method = req.method.toUpperCase(),
    buffer = [],
    value = null,
    resData = null,
    apiPath = url.parse(req.url).pathname,
    restPath = '',
    store = storePath ? require(storePath) : createEmpty();

  deleteCache();
  // No need for dynamic-mock-express to handle request
  if (
    !needMock ||
    apiPath.split('/')[1] !== prefix ||
    ignore(apiPath, method)
  ) {
    return next();
  }

  restPath = `${method}:${apiPath.substring (prefix.length + 2)}`;

  // request url matches routes config completely
  if (!routes[restPath]) {
    // request url matches routes config completely with pathParams
    if (!isMatch(restPath, Object.keys(routes))) {
      if (tip) {
        console.log(
          chalk.bgYellow.black(` Warn: `),
          chalk.blue(`No routes configuration in your exist mock for ${method} request '${apiPath}' or configuration has error `)
        );
      }
      return next();
    }
  }
  if (!value) {
    value = routes[restPath];
  }

  // test request url whether match routes with pathParams 
  function isMatch(path, arr) {
    let units = path.split('/');
    return arr.some(function (rule) {
      let temp = rule.split('/');
      if (units.length === temp.length) {
        let len = temp.length;
        if (units[0] !== temp[0]) {
          return false;
        }
        for (let i = 1; i < len; i++) {
          if (units[i] !== temp[i] && !reg.test(temp[i])) {
            return false;
          }
        }
        value = routes[rule];
        params = getParams(units, temp, len, reg);
        return true;
      } else {
        return false;
      }
    });
  }

  req.on('data', function (chunk) {
    buffer.push(chunk);
  });
  req.on('end', function () {
    try {
      buffer = buffer.toString();
      if (contentType.includes('application/x-www-form-urlencoded')) {
        data = buffer ? queryString.parse(buffer) : data;
      } else if (contentType.includes('application/json')) {
        data = buffer ? JSON.parse(buffer) : data;
      } else if (contentType.includes('multipart/form-data')) {
        data = buffer ? getFormData(buffer) : data;
      }
      args = {
        query,
        params,
        body: data,
        store,
      };
      if (isFunc(value)) {
        let argArray = getFuncParams(value);
        // custom response when arguments contains 'res'
        if (isArray(argArray) && argArray.includes('res')) {
          req.params = params;
          req.body = data;
          value(req, res, next);
          return;
        }
        resData = value(args);
      } else {
        resData = value || createEmpty();
      }

      resData = travel(resData, args);

      if (!isArray(resData) && !isObject(resData)) {
        console.error('Type of response is incorrect');
        return next();
      }

      if (delay !== 0) {
        setTimeout(() => {
          try {
            startResponse(res, resData);
          } catch (error) {
            console.log(err);
            next();
          }
        }, delay);
      } else {
        startResponse(res, resData);
      }
    } catch (err) {
      console.log(err);
      next();
    }
  });

  function startResponse(res, resData) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
    });
    res.write(JSON.stringify(resData));
    res.end();
  }

  function createEmpty() {
    return Object.create(null);
  }

  function getFuncParams(func) {
    let temp = func.toString().match(/\([\s\S]*?\)/);
    if (temp && isArray(temp)) {
      return temp[0].match(/\w+/g);
    }
  }

  function getType(any) {
    return Object.prototype.toString.call(any);
  }

  function isArray(any) {
    return getType(any) === '[object Array]';
  }

  function isFunc(any) {
    return getType(any) === '[object Function]';
  }

  function isObject(any) {
    return getType(any) === '[object Object]';
  }

  function convert(str) {
    return isNaN(str) ? str : Number(str);
  }

  function travel(data, args) {
    if (isObject(data)) {
      Object.keys(data).forEach(function (key) {
        data[key] = travel(data[key], args);
      });
    }

    if (isFunc(data)) {
      data = travel(data(args), args);
    }

    if (isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = travel(data[i], args);
      }
    }

    return typeof data === 'string' ? convert(data) : data;
  }

  function getFormData(str) {
    const regForm = /name="(\w+)"(\r\n|\n)+(\w+)/g;
    const res = createEmpty();
    str.replace(regForm, function (all, key, ctrl, val) {
      if (!res[key]) {
        res[key] = convert(val);
      }
    });
    return res;
  }

  function getParams(pathArr, ruleArr, len, reg) {
    const params = createEmpty();
    for (let i = 1; i < len; i++) {
      if (reg.test(ruleArr[i])) {
        let key = ruleArr[i].substring(1).trim();
        if (!params[key]) {
          params[key] = convert(pathArr[i]);
        }
      }
    }
    return params;
  }

  // delete cache in require
  function deleteCache() {
    purgeCache(path.join(mockDir, entry));
  }

  function purgeCache(moduleName) {
    searchCache(moduleName, function (mod) {
      delete require.cache[mod.id];
    });
    Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
      if (cacheKey.indexOf(moduleName) > 0) {
        delete module.constructor._pathCache[cacheKey];
      }
    });
  }

  function searchCache(moduleName, callback) {
    let mod = require.resolve(moduleName);
    if (mod && (mod = require.cache[mod]) !== undefined) {
      (function traverse(mod) {
        mod.children.forEach(function (child) {
          traverse(child);
        });
        callback(mod);
      })(mod);
    }
  }
};