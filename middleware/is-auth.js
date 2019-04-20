const jwt = require('jsonwebtoken');

const { jwtSecret } = require('../secure');

const throw401 = () => {
   const error = new Error('401.http.UNAUTHORIZED');
   error.statusCode = 401;
   throw error;
}

module.exports = (req, res, next) => {
   const authHeader = req.get('Authorization');
   if (!authHeader) {
      throw401();
   }
   const tokenArray = authHeader.split(' ')
   const tokenType = tokenArray[0];
   if (tokenType !== 'Bearer') {
      throw401();
   }
   const token = tokenArray[1];
   let decodedToken;
   try {
      decodedToken = jwt.verify(token, jwtSecret)
   }
   catch (err) {
      throw401();
   }
   if (!decodedToken) {
      throw401();
   }
   req.userId = decodedToken.userId;
   next();
};
