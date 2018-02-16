var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');
var auth = require('../lib/helpers');
var querystring = require('querystring');
var url = require('url');

// default route (if user is logged in, redirects them to their profile page)
router.get('/', auth.validate, function(req, res) {
	if (req.userId) {
		models.User.findOne({
			where: {
				id: req.userId
			}
		}).then(function (user) {
			res.redirect('/user/' + user.username);
		});
	}
	//Otherwise, send them to the index page, which will let them sign in or register.
	else {
		//res.render('index');
		res.json('RENDER INDEX TEMPLATE');
	}
});

router.get('/login', function(req, res) {
	res.render('login');
});

router.post('/login', function(req, res) {
	models.User.findOne({ 
		where: {
			$or: [
				{ email : { $eq: req.body.login } },
				{ username : { $eq: req.body.login } },
			]
		}
	}).then(function (user) {
		// if no user is returned, then... d'oh
		if (!user.dataValues) auth.notFound();
		auth.handler(req, res, 'login');
	}).catch(function(err) {
		return res.status(500).send('Error on the server.');
	});
});

router.post('/logout', function(req, res) {
	auth.logout(req, res, function() {
		res.redirect(200, '/');
	});
});

// gets all data for current user, including user info, albums owned and posts made
router.get('/user/:username', auth.validate, function(req, res) {
	var canEdit = false;
	if (req.username === req.params.username)
		canEdit = true;
	models.User.findOne({
		where: {
			username: req.params.username
		},
		include: [{
			model: models.Album,
			required: false,
			include: [{
				model: models.Artist,
				required: true,
			}, {
				model: models.Label,
				required: true
			}, {
				model: models.Genre,
				required: true
			}]
		}, {
			model: models.Post,
			required: false
		}]
	}).then(function(userData) {
		var userObj = {
			user: userData,
			canEdit: canEdit
		};
		//res.render('user', userObj);
		res.json(userObj);
	}).catch(function(err) {
		res.json(err);
	});
});

// route for the post page
router.get('/user/:username/post', auth.validate, function(req, res) {
	if (req.query.postId) {
		models.Post.findOne({
			where: {
				id: req.query.postId
			}
		}).then(function(post) {
			if(post.dataValues) {
				var postObj = {
					post: post
				};
				//return res.render('post', postObj);
				return res.json(postObj);
			}
		}).catch(function(err) {
			return res.json(err);
		});
	} else {
		//res.render('post');
		return res.json('NEW POST');
	}
});

// gets all data for the specified album
router.get('/album/:id', auth.validate, function(req, res) {
	models.Album.findOne({
		where: {
			id: req.params.id
		},
		attributes: { 
			include: [[Sequelize.fn('COUNT', Sequelize.col('posts.AlbumId')), 'postCount']] 
		},
		include: [{
			model: models.Artist,
			required: true
		}, {
			model: models.Genre,
			required: true
		}, {
			model: models.Label,
			required: true	
		}, {
			model: models.Post,
			required: false,
			include: [{
				model: models.User,
				required: true
			}]
		}]
	}).then(function(albumData) {
		var albumObj = {
			album: albumData
		};
		//res.render('album', albumObj);
		res.json(albumObj);
	}).catch(function(err) {
		res.json(err);
	});
});

module.exports = router;
