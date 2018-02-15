var express = require('express');
var router = express.Router();
var models = require('../models');
var VerifyToken = require('./VerifyToken');

// creates a new post for the current user
router.post('/:userId', VerifyToken, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.status(401).send('You aren\'t authorized to do this!');
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

// updates a post for the current user
router.put('/:postId/:userId', VerifyToken, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.status(401).send('You aren\'t authorized to do this!');
	models.Post.update({ 
		body: req.body.body,
		isPublic: req.body.isPublic,
		UserId: req.params.postId,
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

// deletes a post
router.delete('/delete/:userId/:postId', VerifyToken, function(req, res) {
	if (req.userId !== req.params.userId)
		return res.status(401).send('You aren\'t authorized to do this!');
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

module.exports = router;
