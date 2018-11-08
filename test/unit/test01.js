const express = require("express");
const request = require("supertest");
const path = require("path");
const mock = require(path.resolve(__dirname, "../../index"));
const app = express();

app.use(
  mock({
    mockDir: path.resolve(__dirname, "../mock_exp01")
  })
);

app.listen(3001, function() {
  console.log("Example app listening on port 3001!");
});

describe("allow mock", function() {
  describe("GET:api/a/b", function() {
    it("should execute mock_1 as response", function(done) {
      request(app)
        .get("/api/a/b?q=liyonglong")
        .expect(200, {
          data: "mock_1",
          params: {},
          query: {
              q: "liyonglong"
          },
          body: {}
        }, done);
    });
  });

  describe("GET:api/a/b/:id", function() {
    it("should execute mock_2 as response", function(done) {
      request(app)
        .get("/api/a/b/10")
        .expect(200, {
          data: "mock_2",
          params: {
              id: "10"
          },
          query: {},
          body: {}
        }, done);
    });
  });

  describe("GET:api/b/:id/:code", function() {
    it("should execute mock_3 as response", function(done) {
      request(app)
        .get("/api/b/10/IN")
        .expect(200, {
          data: "mock_3",
          params: {
              id: "10",
              code: "IN"
          },
          query: {},
          body: {}
        }, done);
    });
  });

  describe("POST:a/b", function() {
    it("should execute mock_4 as response", function(done) {
      request(app)
        .post("/api/a/b")
        .send("name=liyonglong")
        .expect(200, {
          data: "mock_4",
          params: {},
          query: {},
          body: {
              name: "liyonglong"
          }
        }, done);
    });
  });

  describe("POST:b/c/:id/:code/:region", function() {
    it("should execute mock_5 as response", function(done) {
      request(app)
        .post("/api/b/c/12/EN/CHINA")
        .send({name: 'liyonglong'})
        .expect(200, {
          data: "mock_5",
          params: {
              id:"12",
              code: "EN",
              region: "CHINA"
          },
          query: {},
          body: {
              name: "liyonglong"
          }
        }, done);
    });
  });

  describe("POST:b/c", function() {
    it("should execute mock_6 as response", function(done) {
      request(app)
        .post("/api/b/c")
        .send({name: 'liyonglong'})
        .expect(200, {
          data: "mock_6"
        }, done);
    });
  });

  describe("POST:a/b/c", function() {
    it("should execute custom function as response", function(done) {
      request(app)
        .post("/api/a/b/c")
        .send({name: 'liyonglong'})
        .expect(200, {
          status: true,
          params: {},
          query: {},
          body: {
              name: "liyonglong"
          }
        }, done);
    });
  });

  describe("POST:a/b/c/d", function() {
    it("should return 404", function(done) {
      request(app)
        .post("/api/a/b/c/d")
        .send({name: 'liyonglong'})
        .expect(404, {
  
        }, done);
    });
  });

  describe("DELETE:a/b", function() {
    it("should execute custom function as response", function(done) {
      request(app)
        .delete("/api/a/b/100")
        .expect(200, {
         id: "100"
        }, done);
    });
  });
});
