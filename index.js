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

                res.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
                res.write(JSON.stringify(resData));
                res.end();
            } catch (err) {
                console.log(err)
            }
        });


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

        function deleteCache() {

            purgeCache(path.join(mockDir, entry))
        }

        function purgeCache(moduleName) {
            // 遍历缓存来找到通过指定模块名载入的文件
            searchCache(moduleName, function (mod) {
                delete require.cache[mod.id];
            });
        
            // 删除模块缓存的路径
            // 多谢@bentael指出这点
          Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
                if (cacheKey.indexOf(moduleName) > 0) {
                    delete module.constructor._pathCache[cacheKey];
                }
            });
        };
        
        /**
         * 遍历缓存来查找通过特定模块名缓存下的模块
         */
        function searchCache(moduleName, callback) {
            //  通过指定的名字resolve模块
            var mod = require.resolve(moduleName);
        
            // 检查该模块在缓存中是否被resolved并且被发现
            if (mod && ((mod = require.cache[mod]) !== undefined)) {
                // 递归的检查结果
                (function traverse(mod) {
                    // 检查该模块的子模块并遍历它们
                    mod.children.forEach(function (child) {
                        traverse(child);
                    });
        
                    // 调用指定的callback方法，并将缓存的module当做参数传入
                    callback(mod);
                }(mod));
            }
        };
        
    };
};
