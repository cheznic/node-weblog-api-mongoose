const jwt = require('jsonwebtoken');

const { jwtSecret } = require('../secure');

module.exports = (req, res, next) => {
   const authHeader = req.get('Authorization');
   if (!authHeader) {
      const error = new Error('401.AUTH.NOT_AUTHENTICATED');
      error.statusCode = 401;
      throw error;
   }

   const token = authHeader.split(' ')[1];
   let decodedToken;
   try {
      decodedToken = jwt.verify(token, jwtSecret)
   }
   catch (error) {
      if (!error.message) {
         error.message = '500.SYSTEM.ENCRYPTION_ERROR';
      }
      error.statusCode = 500;
      throw error;
   }
   if (!decodedToken) {
      const error = new Error('401.AUTH.NOT_AUTHENTICATED');
      error.statusCode = 401;
      throw error;
   }
   req.userId = decodedToken.userId;
   next();
};
