module.exports = {
  needMock: true,
  prefix: "noapi",
  tip: false,
  ignore: url => {},
  routes: {
    "GET:a/b": () => {}
  }
};