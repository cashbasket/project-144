var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');
var VerifyToken = require('./VerifyToken');
var jwt = require('jsonwebtoken');
var config = require('../config');
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
		// if user is registered without errors, create a token
		var token = jwt.sign({ id: user.id }, config.secret, {
			expiresIn: 86400 // expires in 24 hours
		});

		res.status(200).send({ auth: true, token: token });
		//res.redirect('/' + req.body.username);
	}).catch(function(err) {
		return res.status(500).send('There was a problem registering the user.');
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
		if (!user) return res.status(404).send('No user found.');
    
		// check if the password is valid
		var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
		if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

		// if user is found and password is valid, create a token
		var token = jwt.sign({ id: user.id }, config.secret, {
			expiresIn: 86400 // expires in 24 hours
		});

		// return the information including token as JSON
		res.status(200).json({ auth: true, token: token });
	}).catch(function(err) {
		return res.status(500).send('Error on the server.');
	});
});

router.get('/logout', function(req, res) {
	res.status(200).send({ auth: false, token: null });
});

// updates a user's information
router.put('/:id/update', VerifyToken, function(req, res) {
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
		res.json(user);
	}).catch(function(err) {
		res.json(err);
	});
});

// adds an album to the current user's collection
router.post('/api/album/:albumId/add/:userId', VerifyToken, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.status(401).send('You aren\'t authorized to do this!');
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
router.post('/:id/search', VerifyToken, function(req, res) {
	if (req.userId !== req.params.id)
		return res.status(401).send('You aren\'t authorized to do this!');
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
				{ '$Artist.artist_name$' : { $eq: req.body.query } },
				{ '$Artist.artist_name$' : { like: req.body.query + ' %' } },
				{ '$Artist.artist_name$': { like: '% ' + req.body.query } },
				{ '$Artist.artist_name$': { like: '% ' + req.body.query + ' %' } }
			]
		};
	}

	models.User.findOne({
		where: {
			id: req.params.id
		},
		attributes: { 
			include: [[Sequelize.fn('COUNT', Sequelize.col('posts.UserId')), 'postCount']] 
		},
		include: [{
			model: models.Album,
			through: models.UserAlbum,
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
			required: true
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