module.exports = {
  needMock: true,
  prefix: "api",
  tip: true,
  ignore: url => {},
  routes: {
    "GET:a/b": require("./mock_1"),
    "GET:a/b/:id": (data) =>{
      return {
        data: "mock_2",
        params: data.params,
        query: data.query,
        body: data.body
      };
    },
    "GET:b/:id/:code": require("./mock_3"),
    "POST:a/b": require("./mock_4"),
    "POST:b/c/:id/:code/:region": require("./mock_5"),
    "POST:b/c": require("./mock_6"),
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
    },
    "DELETE:a/b/c/:id": {
      a: 1,
      b: () => {
        return 2 * 3;
      },
      c: {
        d: 7,
        e: () => {
          return 88 ;
        }
      },
      f: [
        1,
        () => {
          return 6;
        },
        {
            b: 5,
            c: {
                d: (data) => {
                    return data.params.id;
                }
            }
        }
      ]
    }
  }
};
