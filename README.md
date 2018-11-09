# dynamic-mock-express
### A middleWare based on express to handle http request when real server is unfinished
[![Coveralls](https://img.shields.io/coveralls/xcatliu/pagic.svg)](https://coveralls.io/github/xcatliu/pagic)

### feature

>1.Suport Restful API friendly               
>2.Flexible configuration to support custom filtering URL                   
>3.Could accept pathParams, query, body in different request methods.          
>4.No cache, config‘s change does not need to be restarted.             

### include

```javascript
npm i dynamic-mock-express -S

```
#### express server
```javascript
const app = express();
const mock = require("dynamic-mock-express");
app.use(
  mock({
    mockDir: path.resolve(__dirname, "../mock")
  })
);
```
#### webpack-dev-server, such as vue-cli or create-react-app
```javascript
const mock = require("dynamic-mock-express");
new WebpackDevServer(compiler, {
  ...
  setup: (app) => {
    app.use(
        mock({
          mockDir: path.resolve(__dirname, "../mock"),
          entry: "index.js" // default is index.js
        })
    );
  }
})
```
### usage
`mock/index.js`
```javascript
module.exports = {
  needMock: true,
  prefix: "api",
  tip: true,
  ignore: url => {// could filter some request url by return true}
  routes: {
    "GET:a/b": require("./mock_1"),
    "GET:a/b/:id": (data) =>{ // suport return a dynamic json
      return {
        data: "mock_2",
        params: data.params,
      };
    },
    "GET:b/:id/:code": require("./mock_3"),
    "POST:a/b": require("./mock_4"),
    "POST:b/c": {      // suport return a json directly
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

### example
>If http request is `${host}/api/a/b/10`, dynamic -mock-express returns the following results based on the above configuration
```javascript
{
   data: "mock_2",
   params: {
     id: "10"
   }
}
```


### config params
|paramsName|means|type|default|
|-|-|-|-|
|needMock|allow mock|Boolean|true|
|prefix|prefix of request url|String|""|
|ignore|filter some request|Function[return a boolean]|(url) => {return false}|
|tip|open warn when not match url |Boolean|true|


