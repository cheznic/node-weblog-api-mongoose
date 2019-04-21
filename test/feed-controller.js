const expect = require('chai').expect;
// const sinon = require('sinon');

const mongoose = require('mongoose');

const User = require('../models/user');
const FeedController = require('../controllers/feed');
const { testConnectionString } = require('../secure');

describe('[ Feed Controller... ]', function () {

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

   it(`should add a new post to the posts property of the creator.`, function (done) {
      const req = {
         body: {
            title: 'Test Post Title',
            content: 'Test post content.'
         },
         file: {
            path: '/path/file.ext'
         },
         userId: '54759eb3c090d83494e2d804'
      };

      const res = {
         status: function () { return this },
         json: function () { },
      };

      FeedController
         .createPost(req, res, () => { })
         .then(savedUser => {
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            done();
         });
   });

   after(function (done) {
      User.deleteMany({})
         .then(result => {
            return mongoose.disconnect();
         })
         .then(result => {
            done();
         });
   });
});
