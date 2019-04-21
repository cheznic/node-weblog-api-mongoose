const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check')

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
   const currentPage = req.query.page || 1;
   const perPage = 2;
   try {
      const totalItems = await Post.find().countDocuments();
      const posts = await Post.find()
         .skip((currentPage - 1) * perPage)
         .limit(perPage);

      res
         .status(200)
         .json({
            message: '200.HTTP.OK',
            posts: posts,
            totalItems: totalItems
         });
   } catch (err) {
      next(err);
   }
};

exports.createPost = async (req, res, next) => {
   // check for validation errors
   const errors = validationResult(req);
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
   // try the database
   try {
      await post.save();
      const user = await User.findById(req.userId);
      user.posts.push(post);
      const savedUser = await user.save();
      res
         .status(201)
         .json({
            message: '201.HTTP.CREATED',
            post: post,
            creator: { _id: user._id, name: user.name }
         });
      return savedUser;
   } catch (err) {
      next(err);
   }
};

exports.getPost = async (req, res, next) => {
   const postId = req.params.postId;
   try {
      const post = await Post.findById(postId);
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
   } catch (err) {
      next(err);
   };
}

exports.updatePost = async (req, res, next) => {
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

   try {
      const post = await Post.findById(postId);

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
         await clearImage(post.imageUrl);
      }
      post.title = req.body.title;
      post.content = req.body.content;
      post.imageUrl = imageUrl;
      const savedPost = await post.save();

      res
         .status(200)
         .json({
            message: '200.HTTP.UPDATED',
            post: savedPost
         })
   } catch (err) {
      next(err);
   };
}

exports.deletePost = async (req, res, next) => {
   const postId = req.params.postId;
   try {
      const post = await Post.findById(postId);
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

      await Post.findByIdAndRemove(postId);

      const user = await User.findById(req.userId)
      user.posts.pull(postId);
      await user.save();

      res
         .status(200)
         .json({
            message: `200.HTTP.DELETED`,
            id: postId
         });
   } catch (err) {
      next(err);
   };
};

const clearImage = (filePath) => {
   filePath = path.join(__dirname, '..', filePath);
   fs.unlink(filePath, err => {
      if (err) { console.log(err) }
   });
};
