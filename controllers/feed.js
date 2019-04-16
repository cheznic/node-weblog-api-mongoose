const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check')

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
   const currentPage = req.query.page || 1;
   const perPage = 2;
   let totalItems;
   Post.find()
      .countDocuments()
      .then(count => {
         totalItems = count;
         return Post
            .find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
      })
      .then(posts => {
         res
            .status(200)
            .json({
               message: '200.HTTP.OK',
               posts: posts,
               totalItems: totalItems
            })
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.DATABASE_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};

exports.createPost = (req, res, next) => {
   const errors = validationResult(req);
   let creator;
   if (!errors.isEmpty()) {
      const error = new Error('422.APP.FAILED-INPUT-VALIDATION');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
   }
   // check for attached image
   if (!req.file) {
      const error = new Error('422.APP.IMAGE-REQUIRED');
      error.statusCode = 422;
      throw error;
   }
   // Create post in db
   const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imageUrl: req.file.path,
      creator: req.userId
   });
   post.save()
      .then(result => {
         return User.findById(req.userId);
      })
      .then(user => {
         creator = user;
         user.posts.push(post);
         return user.save();
      })
      .then(result => {
         res
            .status(201)
            .json({
               message: '201.HTTP.CREATED',
               post: post,
               creator: { _id: creator._id, name: creator.name }
            })
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.DATABASE_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};

exports.getPost = (req, res, next) => {
   const postId = req.params.postId;
   Post.findById(postId)
      .then(post => {
         if (!post) {
            const error = new Error('404.HTTP.RESOURCE_NOT_FOUND');
            error.statusCode = 404;
            throw error;
         }
         res
            .status(200)
            .json({
               message: '200.HTTP.OK',
               post: post
            })
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.DATABASE_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
}

exports.updatePost = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      const error = new Error('422.APP.FAILED-INPUT-VALIDATION');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
   }
   const postId = req.params.postId;
   let imageUrl = req.body.image;
   if (req.file) {
      imageUrl = req.file.path;
   }
   if (!imageUrl) {
      const error = new Error('422.APP.IMAGE-REQUIRED');
      error.statusCode = 422;
      throw error;
   }
   Post.findById(postId)
      .then(post => {
         if (!post) {
            const error = new Error('404.HTTP.RESOURCE_NOT_FOUND');
            error.statusCode = 404;
            throw error;
         }
         if (post.creator.toString() !== req.userId) {
            const error = new Error('403.HTTP.USER_NOT_AUTHORIZED');
            error.statusCode = 403;
            throw error;
         }
         if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
         }
         post.title = req.body.title;
         post.content = req.body.content;
         post.imageUrl = imageUrl;
         return post.save();
      })
      .then(result => {
         res
            .status(200)
            .json({
               message: '200.HTTP.UPDATED',
               post: result
            })
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.DATABASE_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
}

exports.deletePost = (req, res, next) => {
   const postId = req.params.postId;
   Post.findById(postId)
      .then(post => {
         if (!post) {
            const error = new Error('404.HTTP.RESOURCE_NOT_FOUND');
            error.statusCode = 404;
            throw error;
         }
         if (post.creator.toString() !== req.userId) {
            const error = new Error('403.HTTP.USER_NOT_AUTHORIZED');
            error.statusCode = 403;
            throw error;
         }
         clearImage(post.imageUrl);
         return Post.findByIdAndRemove(postId);
      })
      .then(result => {
         return User.findById(req.userId)
      })
      .then(user => {
         user.posts.pull(postId);
         return user.save();
      })
      .then(result => {
         res
            .status(200)
            .json({
               message: `200.HTTP.DELETED`,
               id: postId
            });
      })
      .catch(err => {
         if (!err.message) {
            err.message = '500.SYSTEM.DATABASE_ERROR';
         }
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
}

const clearImage = (filePath) => {
   filePath = path.join(__dirname, '..', filePath);
   fs.unlink(filePath, err => console.log(err));
};
