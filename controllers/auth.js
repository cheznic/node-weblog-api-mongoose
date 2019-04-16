const { validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { jwtSecret } = require('../secure');

const User = require('../models/user');

exports.signup = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      const error = new Error('422.APP.FAILED_INPUT_VALIDATION');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
   }
   bcrypt.hash(req.body.password, 12)
      .then(hashedPass => {
         const user = new User(
            {
               email: req.body.email,
               password: hashedPass,
               name: req.body.name
            }
         );
         return user.save();
      })
      .then(result => {
         res.status(201)
            .json(
               {
                  message: 'User Created',
                  userId: result._id
               }
            )
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.ENCRYPTION_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};

exports.login = (req, res, next) => {
   let loadedUser;
   User.findOne({ email: req.body.email })
      .then(user => {
         if (!user) {
            const error = new Error('401.APP.EMAIL_NOT_FOUND');
            error.statusCode = 401;
            throw error;
         }
         loadedUser = user;
         return bcrypt.compare(req.body.password, loadedUser.password);
      })
      .then(passwordMatch => {
         if (!passwordMatch) {
            const error = new Error('401.APP.INCORRECT_PASSWORD');
            error.statusCode = 401;
            throw error;
         }
         const token = jwt.sign(
            {
               email: loadedUser.email,
               userId: loadedUser._id.toString()
            },
            jwtSecret,
            {
               expiresIn: '1h'
            }
         );
         res.status(200)
            .json(
               {
                  token: token,
                  userId: loadedUser._id.toString()
               }
            );
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.UNKNOWN_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};

exports.getUserStatus = (req, res, next) => {
   User.findById(req.userId)
      .then(user => {
         if (!user) {
            const error = new Error('404.HTTP.USER_NOT_FOUND');
            error.statusCode = 404;
            throw error;
         }
         res
            .status(200)
            .json({
               status: user.status
            });
      })
      .catch(err => {
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};

exports.updateUserStatus = (req, res, next) => {
   const newStatus = req.body.status;
   User.findById(req.userId)
      .then(user => {
         if (!user) {
            const error = new Error('404.HTTP.USER_NOT_FOUND');
            error.statusCode = 404;
            throw error;
         }
         user.status = newStatus;
         return user.save();
      })
      .then(result => {
         res
         .status(200)
         .json({ 
            message: 'User updated.' 
         });
      })
      .catch(err => {
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};