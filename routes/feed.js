const express = require('express');

const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

const inputValidations = [
   body('title')
      .trim()
      .isLength({ min: 5 }),
   body('content')
      .trim()
      .isLength({ min: 5 })
];

// GET: /feed/posts
router.get(
   '/posts',
   isAuth,
   feedController.getPosts
);

// POST /feed/posts
router.post(
   '/posts',
   isAuth,
   inputValidations,
   feedController.createPost
)

router.get(
   '/posts/:postId',
   isAuth,
   feedController.getPost
);

router.put(
   '/posts/:postId',
   isAuth,
   inputValidations,
   feedController.updatePost
);

router.delete(
   '/posts/:postId',
   isAuth,
   feedController.deletePost
);

module.exports = router;
