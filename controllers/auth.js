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
         throw401();
      }

      const match = await bcrypt.compare(req.body.password, user.password);

      if (!match) {
         throw401();
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
      return;
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500;
         err.message = '500.http.INTERNAL_SERVER_ERROR';
      }
      next(err);
      return err;
   }
};

exports.getUserStatus = async (req, res, next) => {
   try {
      const user = await User.findById(req.userId)
      if (!user) {
         throw404();
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
         throw404();
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

const throw401 = () => {
   throwErr(401, '401.http.UNAUTHORIZED');
}

const throw404 = () => {
   throwErr(404, '404.http.NOT_FOUND');
}

const throw422 = () => {
   throwErr(422, '422.http.UNPROCESSABLE_ENTITY');
}
const throw500 = () => {
   throwErr(500, '500.http.INTERNAL_SERVER_ERROR');
}

const throwErr = (code, message) => {
   const error = new Error(message);
   error.statusCode = code;
   throw error;
} 
