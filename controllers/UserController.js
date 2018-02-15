var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');

// creates a new user
router.post('/register', function(req, res) {
	models.User.create({ 
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		name: req.body.name,
		location: req.body.location
	}).then(function(post) {
		res.json(post);
	}).catch(function(err) {
		res.json(err);
	});
});

// updates a user's information
router.put('/:id/update', function(req, res) {
	// TODO: authenticate user based on JSON web token.
	// if token's ID matches :id, let them do stuff
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
router.post('/api/album/:albumId/add/:userId', function(req, res) {
	// TODO: authenticate user based on JSON web token.
	// if token's ID matches :id, let them do stuff
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
router.post('/:id/search', function(req, res) {
	// TODO: authenticate user based on JSON web token.
	// if token's ID matches :id, let them add albums to this collection
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

// searches for albums in the current user's collection
router.post('/user/:id/search', function(req, res) {
	// TODO: authenticate user based on JSON web token.
	// if token's ID matches :id, let them add albums to this collection
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