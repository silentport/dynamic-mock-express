# dynamic-mock-express
### A middleWare based on express to handle http request when real server is unfinished

[![Build Status](https://travis-ci.org/silentport/dynamic-mock-express.svg?branch=master)](https://travis-ci.org/silentport/dynamic-mock-express)
[![Coverage Status](https://coveralls.io/repos/github/silentport/dynamic-mock-express/badge.svg?branch=master)](https://coveralls.io/github/silentport/dynamic-mock-express?branch=master)
<a href="https://www.npmjs.com/package/dynamic-mock-express">
<img src="https://img.shields.io/npm/v/dynamic-mock-express.svg?style=flat"/></a>
### feature

>1.Suport Restful API friendly               
>2.Flexible configuration to support custom filtering URL                   
>3.Could accept pathParams, query, body in different request methods.          
>4.No cache, config‘s change does not need to be restarted                 
>5.Suport dynamic, responsive result                                    
>6.Support function nesting.  
>7.Support custom response.              

### include

```javascript
npm i dynamic-mock-express -D

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
  ignore: url => {// could filter some request url by return true
  
  },
  routes: {
    "GET:a/b": require("./mock_1"),
    "GET:a/b/:id": (data) => { // suport return a dynamic json
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
    "POST:a/c": (req, res, next) => { //support custom response when res as arguement.
      res.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
      res.write(JSON.stringify({name: 'lyl'}));
      res.end();
    },
    "POST:a/b/c": data => {
      return {
        status: true,
        params: data.params,
        query: data.query,
        body: data.body
      };
    },
    "DELETE:a/b/:id": (data) => {
      return {
        id: data.params.id
      };
    },
    "DELETE:a/b/c/:id":  { // support function nesting.
       a: {
         b: 1,
         c: (data) => {
           return {
             id: data.params.id
           }
         }
       }
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

### responsive result

`mock/index.js`
```javascript
module.exports = {
  needMock: true,
  prefix: "api",
  storePath: Path.reslove(__dirname, "store"), //must a absolute path
  tip: true,
  routes: {
    "GET:a/b/:id": ({store, params}) => {
       return store.data.find(item => {return item.id == params.id});
    },
    "POST:a/b": ({store, body}) => {
       store.data.find(item => {
          return item.id == body.id
       }).name = body.name;
       return {
          status: true
       };
    }
  }
}
```
`mock/store.js`
```javascript
module.exports = {
    data: [
      {
	id: 10,
        name: "zhangsan"  
      },
      {
	id: 11,
        name: "lisi"  
      }
    ]
}

```

#### example
```javascript
// pseudocode
get("api/a/b/10").then(res => {
  console.log(res) // {id: 10, name: "zhangsan"}
  post("api/a/b")
     .send({id: 10, name: "wangwu"})
     .then(res => {
        get("api/a/b/10").then(res =>{
          console.log(res) // {id: 10, name: "wangwu"}
        })
     })
})

```

### config params
|paramsName|means|type|default|
|-|-|-|-|
|needMock|allow mock|Boolean|true|
|delay|delay of response|Number|0|
|storePath|store path|String|""|
|prefix|prefix of request url|String|""|
|ignore|filter some request|Function[return a boolean]|(url) => {return false}|
|tip|open warn when not match url |Boolean|true|



