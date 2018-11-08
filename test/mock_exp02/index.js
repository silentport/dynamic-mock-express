module.exports = {
  needMock: false,
  prefix: "api",
  tip: false,
  ignore: url => {},
  routes: {
    "GET:a/b": () => {}
  }
};
