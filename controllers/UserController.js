var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');
var auth = require('../lib/helpers');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

// creates a new user
router.post('/register', function(req, res) {
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	models.User.create({ 
		username: req.body.username,
		password: hashedPassword,
		email: req.body.email,
		name: req.body.name,
		location: req.body.location
	}).then(function(user) {
		if (!user.dataValues) return res.status(500).send('There was a problem registering the user.');
		auth.handler(req, res, 'register');
	}).catch(function(err) {
		return res.status(500).send('There was a problem authenticating the user.');
	});
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

router.get('/logout', function(req, res) {
	res.status(200).send({ auth: false, token: null });
});

// updates a user's information
router.put('/update/:id', auth.validate, function(req, res) {
	if (req.userId !== req.params.id)
		return res.status(401).send('You aren\'t authorized to do this!');
	models.User.update({ 
		email: req.body.email,
		name: req.body.name,
		location: req.body.location,
		bio: req.body.bio
	}, {
		where: {
			id: req.params.id
		}
	}).then(function(user) {
		res.redirect(200, '/user/' + req.username);
	}).catch(function(err) {
		res.json(err);
	});
});

// adds an album to the current user's collection
router.post('/:userId/add/:albumId', auth.validate, function(req, res) {
	if(req.userId !== req.params.userId)
		res.redirect(401, '/login');
	models.UserAlbum.create({
		AlbumId: req.params.albumId,
		UserId: req.params.userId
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.json(err);
	});
});

// searches for albums in the current user's collection
router.post('/:id/search', auth.validate, function(req, res) {	
	var whereObj;
	if (req.body.type === 'title') {
		whereObj = {
			$or: [
				{ title : { $eq: req.body.query } },
				{ title : { like: req.body.query + ' %' } },
				{ title: { like: '% ' + req.body.query } },
				{ title: { like: '% ' + req.body.query + ' %' } }
			]
		};
	} else if (req.body.type === 'artist') {
		whereObj = {
			$or: [
				{ '$Albums.Artist.artist_name$' : { $eq: req.body.query } },
				{ '$Albums.Artist.artist_name$' : { like: req.body.query + ' %' } },
				{ '$Albums.Artist.artist_name$': { like: '% ' + req.body.query } },
				{ '$Albums.Artist.artist_name$': { like: '% ' + req.body.query + ' %' } }
			]
		};
	}

	models.User.findOne({
		where: {
			id: req.params.id
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
			user: userData
		};
		//res.render('user', userObj);
		res.json(userObj);
	}).catch(function(err) {
		res.json(err);
	});
});

module.exports = router;