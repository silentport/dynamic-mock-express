# dynamic-mock-express
### A middleWare based on express to handle http request when real server is unfinished
[![Coveralls](https://img.shields.io/coveralls/xcatliu/pagic.svg)](https://coveralls.io/github/xcatliu/pagic)


### usage

```javascript
module.exports = {
  needMock: true,
  prefix: "api",
  tip: true,
  ignore: url => {}
  routes: {
    "GET:a/b": require("./mock_1"),
    "GET:a/b/:id": require("./mock_2"),
    "GET:b/:id/:code": require("./mock_3"),
    "POST:a/b": require("./mock_4"),
    "POST:b/c/:id/:code/:region": require("./mock_5"),
    "POST:b/c": {
       a:1
    },
    "POST:a/b/c": data => {
      return {
        status: true,
        params: data.params,
        query: data.query,
        body: data.body
      };
    },
    "DELETE:a/b/:id": function(data) {
      return {
        id: data.params.id
      };
    }
  }
};

```
