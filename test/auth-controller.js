const expect = require('chai').expect;
const sinon = require('sinon');

const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');
const { testConnectionString } = require('../secure');

describe('[ Auth Controller... ]', function () {

   before(function (done) {
      mongoose.connect(testConnectionString, { useNewUrlParser: true })
         .then(result => {
            const user = new User({
               email: 'test@test.com',
               password: 'password',
               name: 'Test-user1',
               posts: [],
               _id: "54759eb3c090d83494e2d804"
            });
            return user.save();
         })
         .then(result => {
            done();
         });
   });

   it(`should throw an error with statusCode '500' if accessing the database fails`, function (done) {
      sinon.stub(User, 'findOne');
      User.findOne.throws();

      const req = {
         body: {
            email: 'fake@faker.com',
            password: 'bad-password'
         }
      };

      AuthController
         .login(req, {}, () => { })
         .then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('statusCode', 500);
            done();
         });

      User.findOne.restore();
   });

   it('should send a response with a valid user status for an existing user', function (done) {
      const req = { userId: "54759eb3c090d83494e2d804" };
      const res = {
         statusCode: 500,
         userStatus: null,
         status: function (code) {
            this.statusCode = code;
            return this;
         },
         json: function (data) {
            this.userStatus = data.status;
         }
      };
      AuthController.getUserStatus(req, res, () => { })
         .then(result => {
            expect(res).property('statusCode', 200);
            expect(res.userStatus).to.be.equal('New');
         })
         .then(result => {
            done();
         });
   });

   after(function (done) {
      User.deleteMany({})
         .then(result => {
            return mongoose.disconnect();
         })
         .then(result => {
            done()
         });
   });
});
