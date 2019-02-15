const express = require("express");
const request = require("supertest");
const path = require("path");
const mock = require(path.resolve(__dirname, "../../lib/index"));
const app = express();

app.use(
  mock({
    mockDir: path.resolve(__dirname, "../mock_exp03")
  })
);

app.listen(3003, function () {
  console.log("Example app listening on port 3003!");
});

describe("not match prefix", function () {
  describe("GET:api/a/b", function () {
    it("should return 404", function (done) {
      request(app)
        .get("/api/a/b")
        .expect(404, {

        }, done);
    });
  });
});