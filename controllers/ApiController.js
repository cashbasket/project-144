var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');
var auth = require('../lib/helpers');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var querystring = require('querystring');
var gravatar = require('gravatar');

// creates a new user
router.post('/user/register', function(req, res) {
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	models.User.findOne({
		where: {
			$or: [
				{ username : { $eq: req.body.username } },
				{ email: { $eq: req.body.email} }
			]
		}
	}).then(function(user) {
		if (user) {
			if (user.email === req.body.email)
				return res.json({ error: 'email' });
			if (user.username === req.body.username)
				return res.json({ error: 'username' });
		} else {
			var gravatarUrl = gravatar.url(req.body.email, {s: '200', r: 'pg', d: '404'}, true);
			return models.User.create({ 
				username: req.body.username,
				password: hashedPassword,
				email: req.body.email,
				gravatarUrl: gravatarUrl
			});
		}
	}).then(function() {
		auth.handler(req, res, 'register');
	}).catch(function(err) {
		res.json(err);
	});
});

// updates a user's information
router.put('/user/:username/edit', auth.validate, function(req, res) {
	if (req.username !== req.params.username)
		return res.redirect('/');

	models.User.findOne({
		where: {
			username: req.params.username
		}
	}).then(function(currentUser) {
		if(currentUser.dataValues) {
			return models.User.findOne({
				where: {
					email: req.body.email
				}
			});
		}
	}).then(function(user) {
		var passwordsMatch = bcrypt.compareSync(req.body.currentPassword, user.dataValues.password);
		if (user && user.dataValues.username !== req.params.username) {
			res.json({ error: 'email in use' });
		}	
		if(req.body.currentPassword.length && req.body.newPassword.length && !passwordsMatch) {
			res.json({ error: 'bad password' });
		}
		var gravatarUrl = gravatar.url(req.body.email, {s: '200', r: 'pg', d: '404'}, true);
		return models.User.update({ 
			email: req.body.email,
			password: req.body.currentPassword.length ? bcrypt.hashSync(req.body.newPassword, 8) : user.dataValues.password,
			name: req.body.name,
			location: req.body.location,
			bio: req.body.bio,
			gravatarUrl: gravatarUrl
		}, {
			where: {
				username: req.params.username
			}
		});
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.json(err);
	});
});

// adds an album to the current user's collection
router.post('/album/:userId/:albumId', auth.validate, function(req, res) {
	if(req.userId !== req.params.userId)
		res.redirect('/login');
	models.UserAlbum.create({
		AlbumId: req.params.albumId,
		UserId: req.params.userId
	}).then(function(result) {
		var resultObj = {
			username: req.username
		};
		res.json(resultObj);
	}).catch(function(err) {
		res.json(err);
	});
});

// searches for albums in the current user's collection
router.post('/user/:username/search', auth.validate, function(req, res) {	
	var whereObj;
	var canEdit = false;
	var loggedIn = false;
	if (req.username === req.params.username)
		canEdit = true;
	if (req.username)
		loggedIn = true;
	if (req.body.type === 'title') {
		whereObj = {
			$or: [
				{ title : { like: '%' + req.body.query + '%' } },
			]
		};
	} else if (req.body.type === 'artist') {
		whereObj = {
			$or: [
				{ '$Albums.Artist.artist_name$' : { $like: '%' +  req.body.query + '%' } }
			]
		};
	}

	models.User.findOne({
		where: {
			username: req.params.username
		},
		include: [{
			model: models.Album,
			where: whereObj,
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
			extra: {
				loggedIn: loggedIn,
				canEdit: canEdit
			}
		};
		res.json(userObj);
	}).catch(function(err) {
		res.json(err);
	});
});

// creates a new post for the current user
router.post('/post/:userId/:albumId', auth.validate, function(req, res) {
	if (req.userId !== req.params.userId) {
		return res.redirect('/login');
	}
	models.Post.create({ 
		body: req.body.body,
		isPublic: req.body.isPublic,
		UserId: req.params.userId,
		AlbumId: req.params.albumId
	}).then(function(post) {
		res.json(post);
	}).catch(function(err) {
		res.json(err);
	});
});

// updates a post for the current user
router.put('/post/:userId/:postId', auth.validate, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.redirect('/login');
	models.Post.update({ 
		body: req.body.body,
		isPublic: req.body.isPublic,
	}, {
		where: {
			id: req.params.postId
		}
	}).then(function(post) {
		res.json(post);
	}).catch(function(err) {
		res.json(err);
	});
});

// deletes a post
router.delete('/post/:userId/:postId', auth.validate, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.redirect('/login');
	models.Post.destroy({
		where: {
			id: req.params.postId,
		}
	}).then(function(result) {
		res.status(200).end();
	}).catch(function(err) {
		res.json(err);
	});
});

module.exports = router;