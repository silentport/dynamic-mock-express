"use strict";
const url = require("url");
const fs = require("fs");
const path = require("path");
const queryString = require("query-string");
module.exports = function (config) {
    return function (req, res, next) {
        var mockDir = config.mockDir || "mock",
            entry = config.entry || "index.js",
            target = require(path.join(mockDir, entry)),
            ignore = target.ignore || function () {
                return false;
            },
            routes = target.routes || Object.create(null),
            prefix = target.prefix || "",
            tip = target.hasOwnProperty("tip") ? target.tip : true,
            needMock = target.hasOwnProperty("needMock") ? target.needMock : true,
            query = req.query,
            data = Object.create(null),
            params = Object.create(null),
            reg = /:(\w+)/,    
            contentType = req.headers["content-type"] || "text/plain;charset=UTF-8",
            method = req.method.toUpperCase(),
            buffer = [],
            value = null,
            resData = null,
            apiPath = url.parse(req.url).pathname,
            restPath = "";
            deleteCache();
        // 不需要拦截的情况
        if (!needMock || apiPath.split("/")[1] !== prefix || ignore(apiPath, method)) {
            next();
            return;
        }

        restPath = method + ":" + apiPath.substring(prefix.length + 2);
        
        // 路径是否完全匹配
        if (!routes[restPath]) {
            if (!isMatch(restPath, Object.keys(routes))) {
                if (tip) {
                    console.log("\x1B[33m%s\x1b[0m", "Warn:");
                    console.log("\x1B[36m%s\x1B[0m", "     没有对" + method + "请求" + apiPath + "建立mock文件或配置路径错误")
                }
                next();
                return;
            }
        }
        if (!value) {
            value = routes[restPath];
        }
            
        // pathParams匹配规则校验
        function isMatch(path, arr) {
            var units = path.split("/");
            return arr.some(function (rule) {
                var temp = rule.split("/");
                if (units.length === temp.length) {
                    var len = temp.length;
                    if (units[0] !== temp[0]) {
                        return false;
                    }
                    for (var i = 1; i < len; i++) {
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
      
        req.on("data", function (chunk) {
            buffer.push(chunk);
        });
        req.on("end", function () {
            try {
                buffer = buffer.toString();
                if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
                    data = buffer
                        ? queryString.parse(buffer)
                        : data;
                } else if (contentType.indexOf("application/json") > -1) {
                    data = buffer
                        ? JSON.parse(buffer)
                        : data;
                } else if (contentType.indexOf("multipart/form-data") > -1) {
                    data = buffer
                        ? getFormData(buffer)
                        : data;
                }

                if (typeof value === "function") {
                    resData = value({query: query, params: params, body: data});
                } else {
                    resData = value || {};
                }
        
                // 深度遍历value，存在值为函数的key则将函数替换为函数的执行结果
                resData = travel(resData, {query: query, params: params, body: data});

                res.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
                res.write(JSON.stringify(resData));
                res.end();
            } catch (err) {
                console.log(err)
                next();
            }
        });

        function getType(any) {
            return Object.prototype.toString.call(any);
        }

        function isArray(any) {
            return getType(any) === "[object Array]";
        }

        function isFunc(any) {
            return getType(any) === "[object Function]";
        }

        function isObject(any) {
            return getType(any) === "[object Object]";
        }

        function travel(data, args) {
            if (isObject(data)) {
              Object.keys(data).forEach(function(key) {
                  data[key] = travel(data[key], args);
              })
            }
          
            if (isFunc(data)) {
              data = travel(data(args), args);
            }
          
            if (isArray(data)) {
              for (var i = 0; i < data.length; i++) {
                data[i] = travel(data[i], args);
              }
            } 
            return data;
        }

        function getFormData(str) {
            var regForm = /name="(\w+)"(\r\n|\n)+(\w+)/g;
            var res = Object.create(null);
            str.replace(regForm, function (all, key, ctrl, val) {
                if (!res[key]) {
                    res[key] = val;
                }
            });
            return res;
        }

        function getParams(pathArr, ruleArr, len, reg) {
            var params = Object.create(null);
            for (var i = 1; i < len; i++) {
                if (reg.test(ruleArr[i])) {
                    var key = ruleArr[i].substring(1).trim();
                    if (!params[key]) {
                        params[key] = pathArr[i];
                    }
                }
            }
            return params;
        }
        
        // 清除require缓存
        function deleteCache() {
            purgeCache(path.join(mockDir, entry))
        }

        function purgeCache(moduleName) {
            searchCache(moduleName, function (mod) {
                delete require.cache[mod.id];
            });
            Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
                if (cacheKey.indexOf(moduleName) > 0) {
                    delete module.constructor._pathCache[cacheKey];
                }
            });
        };
        
        function searchCache(moduleName, callback) {
            var mod = require.resolve(moduleName);
            if (mod && ((mod = require.cache[mod]) !== undefined)) {
                (function traverse(mod) {
                    mod.children.forEach(function (child) {
                        traverse(child);
                    });
                    callback(mod);
                }(mod));
            }
        };
        
    };
};
