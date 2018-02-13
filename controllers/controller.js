var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');

router.get('/', function(req, res) {
	//res.render('index');
});

router.get('/album/:id', function(req, res) {
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

router.get('/user/:id', function(req, res) {
	models.User.findOne({
		where: {
			id: req.params.id
		},
		attributes: { 
			include: [[Sequelize.fn('COUNT', Sequelize.col('posts.UserId')), 'postCount']] 
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

router.post('/api/album/add/:albumId/:userId', function(req, res) {
	models.UserAlbum.create({
		AlbumId: req.params.albumId,
		UserId: req.params.userId
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.json(err);
	});
});

router.post('/api/post/create/:userId', function(req, res) {
	models.Post.create({ 
		body: req.body.body,
		isPublic: req.body.isPublic,
		UserId: req.params.userId,
		AlbumId: req.body.albumId
	}).then(function(post) {
		res.json(post);
	}).catch(function(err) {
		res.json(err);
	});
});

router.put('/api/post/update/:id', function(req, res) {
	models.Post.update({ 
		body: req.body.body,
		isPublic: req.body.isPublic,
		UserId: req.params.id,
		AlbumId: req.params.albumId
	}, {
		where: {
			id: req.params.id
		}
	}).then(function(post) {
		res.json(post);
	}).catch(function(err) {
		res.json(err);
	});
});

router.delete('/api/post/delete/:postId', function(req, res) {
	models.Post.destroy({
		where: {
			id: req.params.postId,
		}
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.json(err);
	});
});

router.post('/search', function(req, res) {
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
			albums: albumData
		};
			//res.render('album', albumObj);
		res.json(albumObj);
	}).catch(function(err) {
		res.json(err);
	});
});

router.post('/user/:id/album/search', function(req, res) {
	var whereObj;
	if (req.body.type === 'title') {
		whereObj = {
			//'$Users.id$': req.params.id,
			$or: [
				{ title : { $eq: req.body.query } },
				{ title : { like: req.body.query + ' %' } },
				{ title: { like: '% ' + req.body.query } },
				{ title: { like: '% ' + req.body.query + ' %' } }
			]
		};
	} else if (req.body.type === 'artist') {
		whereObj = {
			//'$Users.id$': req.params.id,
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