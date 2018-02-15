var express = require('express');
var router = express.Router();
var models = require('../models');
var VerifyToken = require('./VerifyToken');

// searches for all albums that match the search parameters
router.post('/search', VerifyToken, function(req, res) {
	var isLoggedIn = false;

	if (req.userId) {
		isLoggedIn = true;
	}

	// TODO: authenticate user based on JSON web token.
	// if user is logged in, let them add albums
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

	models.Album.findAll({
		where: whereObj,
		limit: 100,
		order: [
			['createdAt', 'DESC']
		],
		include: [{
			model: models.Artist,
			required: true
		}, {
			model: models.Genre,
			required: true
		}, {
			model: models.Label,
			required: true	
		}]
	}).then(function(albumData) {
		var albumObj = {
			albums: albumData,
			isLoggedIn: isLoggedIn
		};
		//res.render('album', albumObj);
		res.json(albumObj);
	}).catch(function(err) {
		res.json(err);
	});
});

module.exports = router;