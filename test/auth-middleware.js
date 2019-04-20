const jwt = require('jsonwebtoken');
const expect = require('chai').expect;
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');

const message = '401.http.UNAUTHORIZED';
const code = 401;

describe('[ is-auth middleware... ]', function () {
   it(
      `should throw error with message '${message}' if auth header is undefined`,
      function () {
         const req = {
            get: function (headerName) {
               return undefined;
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('message', message);
      });

   it(
      `should throw an error with statusCode '${code}' if authorization header is null`,
      function () {
         const req = {
            get: function (headerName) {
               return null;
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('statusCode', code);
      });

   it(
      `should throw an error with statusCode '${code}' if authorization header does not contain 'Bearer ' as the token type`,
      function () {
         const req = {
            get: function (headerName) {
               return 'Brr xyzabc'
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('statusCode', code);
      });

   it(
      `should throw an error with statusCode '${code}' if authorization header does not contain a two part token`,
      function () {
         const req = {
            get: function (headerName) {
               return 'sdfgsdfgsdfgxyzabc'
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('statusCode', code);
      });

   it(
      `should throw an error with statusCode '${code}' if token cannot be verified`,
      function () {
         const req = {
            get: function (headerName) {
               return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
                  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
                  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('statusCode', code);
      });

   it(
      `should return a request object with userId property after verifying the token`,
      function () {
         const req = {
            get: function (headerName) {
               return 'Bearer abc123';
            }
         };
         sinon.stub(jwt, 'verify');
         jwt.verify.returns({ userId: 'T4fwpMeJf36P' });
         authMiddleware(req, {}, () => { });
         expect(req).to.have.property('userId');
         expect(req).to.have.property('userId', 'T4fwpMeJf36P');
         expect(jwt.verify.called).to.be.true;
         jwt.verify.restore();
      })

   it(
      `should throw an error with statusCode '${code}' if token is malformed`,
      function () {
         const req = {
            get: function (headerName) {
               return 'Bearer eyJhbGciOiJIUzI1NiIsIn';
            }
         };
         expect(authMiddleware.bind(this, req, {}, () => { })).to.throw().property('statusCode', code);
      });
});