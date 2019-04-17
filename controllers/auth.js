const { validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { jwtSecret } = require('../secure');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      const error = new Error('422.APP.FAILED_INPUT_VALIDATION');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
   }

   try {
      const hashedPass = await bcrypt.hash(req.body.password, 12)
      const newUser = new User(
         {
            email: req.body.email,
            password: hashedPass,
            name: req.body.name
         }
      );
      const user = await newUser.save();
      res
         .status(201)
         .json(
            {
               message: 'User Created',
               userId: user._id
            }
         )
   } catch (err) {
      next(err);
   }
};

exports.login = async (req, res, next) => {
   try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) {
         const error = new Error('401.APP.EMAIL_NOT_FOUND');
         error.statusCode = 401;
         throw error;
      }

      const match = await bcrypt.compare(req.body.password, user.password);

      if (!match) {
         const error = new Error('401.APP.INCORRECT_PASSWORD');
         error.statusCode = 401;
         throw error;
      }
      const token = await jwt.sign(
         {
            email: user.email,
            userId: user._id.toString()
         },
         jwtSecret,
         {
            expiresIn: '1h'
         }
      );

      res
         .status(200)
         .json(
            {
               token: token,
               userId: user._id.toString()
            }
         );
   } catch (err) {
      next(err);
   }
};

exports.getUserStatus = async (req, res, next) => {
   try {
      const user = await User.findById(req.userId)
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

   } catch (err) {
      next(err);
   }
};

exports.updateUserStatus = async (req, res, next) => {
   try {
      const user = await User.findById(req.userId)
      if (!user) {
         const error = new Error('404.HTTP.USER_NOT_FOUND');
         error.statusCode = 404;
         throw error;
      }
      user.status = req.body.status;
      await user.save();
      res
         .status(200)
         .json({
            message: 'User updated.'
         });
   } catch (err) {
      next(err);
   };
};