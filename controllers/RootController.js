var express = require('express');
var router = express.Router();
var models = require('../models');
var RateLimit = require('express-rate-limit');
var crypto = require('crypto');
var passport = require('../config/passport');
var passportAuth  = require('../lib/passportAuth');
var helpers = require('../lib/helpers');
var bcrypt = require('bcrypt-nodejs');
var Discogs = require('disconnect').Client;
var discogsDb = new Discogs({
	consumerKey: process.env.DISCOGS_CONSUMER_KEY, 
	consumerSecret: process.env.DISCOGS_CONSUMER_SECRET}).database();

router.use(passport.initialize());
router.use(passport.session());

var loginLimiter = new RateLimit({
	windowMs: 15*60*1000, // 15 minutes
	max: 10,
	delayMs: 0, // disabled
	message: 'Too many logins from this IP address. Please try again in 15 minutes.'
});

var createAccountLimiter = new RateLimit({
	windowMs: 60*60*1000,
	delayAfter: 1,
	delayMs: 3*1000,
	max: 5,
	message: 'Too many accounts created from this IP address. Please try again after an hour'
});

// default route (if user is logged in, redirects them to their profile page)
router.get('/', function(req, res) {
	if (req.user) {
		models.User.findOne({
			where: {
				username: req.user.username
			}
		}).then(function (user) {
			res.redirect('/user/' + user.username);
		});
	}
	//Otherwise, send them to the index page, which will let them sign in or register.
	else {
		res.render('index', {layout: 'landingpage.handlebars'});
	}
});

router.post('/', createAccountLimiter, function(req, res, next) {
	passport.authenticate('local-signup', function(err, user, info) {
		if (err) {
			return next(err); // will generate a 500 error
		}
		if (!user) {
			return res.status(409).render('index', {layout: 'landingpage.handlebars', message: 'The email address or username you selected is already in use.'});
		}
		req.login(user, function(err){
			if(err){
				console.error(err);
				return next(err);
			}
			return res.redirect('/user/' + req.user.username);
		});
	})(req, res, next);
});

router.get('/login', function(req, res) {
	if (!req.user)
		res.render('login', { hideNav: true });
	else
		res.redirect('/user/' + req.user.username);
});

router.post('/login', loginLimiter, function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(409).render('login', { message: 'Invalid email address or password.' });
		}
		req.login(user, function(err){
			if(err){
				console.error(err);
				return next(err);
			}
			return res.redirect('/user/' + req.user.username);
		});
	})(req, res, next);
});

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

// HELP I FORGOT MY PASSWORD
router.get('/forgot', function(req, res) {
	res.render('forgot' , { hideNav: true });
});

router.post('/forgot', function(req, res, next) {
	crypto.randomBytes(20, function(err, buf) {
		var token = buf.toString('hex');
		models.User.findOne({ 
			where: {
				email: req.body.email 
			}
		}).then(function(user) {
			return models.User.update({
				resetPasswordToken: token,
				resetPasswordExpires: Date.now() + 3600000
			}, {
				where: {
					email: req.body.email
				}
			});
		}).then(function(result) {
			if(result[0] === 1) 
				// send password reset email
				return helpers.sendMail('reset', req.body.email, req.headers.host, token);
		}).then(function(result) {
			res.json(result);
		}).catch(function(err) {
			res.redirect('/forgot');
		});
	});
});

// Password reset page
router.get('/reset/:token', function(req, res) {
	models.User.findOne({ 
		where: {
			resetPasswordToken: req.params.token, 
			resetPasswordExpires: { $gt: Date.now() } 
		}
	}).then(function(user) {
		if (!user) {
			return res.redirect('/forgot');
		}
		res.render('reset', { hideNav: true });
	});
});

router.put('/reset/:token', function(req, res) {
	var userEmail;
	models.User.findOne({ 
		where: {
			resetPasswordToken: req.params.token, 
			resetPasswordExpires: { $gt: Date.now() } 
		}
	}).then(function(user) {
		if (!user.dataValues) {
			return res.redirect('/forgot');
		}
		userEmail = user.dataValues.email;

		return models.User.update({
			password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null),
			resetPasswordToken: null,
			resetPasswordExpires: null
		}, {
			where: {
				email: userEmail
			}
		});
	}).then(function(result) {
		// send confirmation email
		return helpers.sendMail('confirm-reset', userEmail, null, null);
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.redirect('/');
	});
});

// gets all data for current user, including user info, albums owned and posts made
router.get('/user/:username', function(req, res) {
	var canEdit = false;
	var loggedIn = false;

	if (req.user) {
		loggedIn = true;
		if (req.user.username === req.params.username)
			canEdit = true;
	}
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
			required: false,
			include: [{
				model: models.Album,
				required: false,
				include: [{
					model: models.Artist,
					required: false,
				}, {
					model: models.Label,
					required: false
				}, {
					model: models.Genre,
					required: false
				}],
			}, {
				model: models.Comment,
				required: false,
				include: [{
					model: models.User,
					required: true
				}]
			}]
		}],
		order: [
			[models.Post, 'createdAt', 'DESC']
		]
	}).then(function(userData) {
		var userObj = {
			user: userData,
			extra: {
				username: req.user ? req.user.username : null,
				loggedIn: loggedIn,
				canEdit: canEdit,
			}
		};
		//res.json(userObj);
		res.render('profile', userObj);
	}).catch(function(err) {
		res.json(err);
	});
});

// route for the user edit page
router.get('/user/:username/edit', passportAuth.ensureAuthenticated, function(req, res) {
	if (req.user.username && req.user.username === req.params.username) {
		models.User.findOne({
			where: {
				username: req.params.username
			}
		}).then(function(user) {
			if(user) {
				var userObj = {
					user: user.dataValues,
					extra: {
						loggedIn: req.user.username ? true : false
					}
				};
				res.render('user', userObj);
			}
		}).catch(function(err) {
			res.json(err);
		});
	} else {
		res.redirect('/');
	}
});

// route for the post page
router.get('/user/:username/post', passportAuth.ensureAuthenticated, function(req, res) {
	models.User.findOne({
		where: {
			username: req.params.username
		},
		include: [{
			model: models.Album,
			required: true,
			include: [{
				model: models.Artist,
				required: true,
			}, {
				model: models.Label,
				required: true
			}, {
				model: models.Genre,
				required: true
			}, {
				model: models.Style,
				required: true
			}]
		}, {
			model: models.Post,
			where: {
				id: req.query.postId
			},
			required: false,
			include: [{
				model: models.Album,
				required: false,
				include: [{
					model: models.Artist,
					required: false,
				}, {
					model: models.Label,
					required: false
				}, {
					model: models.Genre,
					required: false
				}, {
					model: models.Style,
					required: false
				}]
			}]
		}]
	}).then(function(user) {
		var userObj = {
			user: user,
			extra: {
				loggedIn: true
			}
		};
		if(user.username === req.user.username)
			//res.json(userObj);
			res.render('post', userObj);
		else
			res.redirect('/');
	}).catch(function(err) {
		res.json(err);
	});
});

// gets all data for the specified album
router.get('/album/:id', passportAuth.ensureAuthenticated, function(req, res) {
	var loggedIn = false;
	if (req.user.username)
		loggedIn = true;
	models.Album.findOne({
		where: {
			id: req.params.id
		},
		include: [{
			model: models.Artist,
			through: {
				model: models.AlbumArtist
			},
			required: true
		}, {
			model: models.Genre,
			through: {
				model: models.AlbumGenre
			},
			required: true
		}, {
			model: models.Label,
			through: {
				model: models.AlbumLabel
			},
			required: true	
		}, {
			model: models.Style,
			through: {
				model: models.AlbumStyle
			},
			required: true
		}, {
			model: models.Post,
			where: {
				isPublic: true
			},
			required: false,
			include: [{
				model: models.User,
				required: true
			}, {
				model: models.Comment,
				required: false,
				include: [{
					model: models.User,
					required: true
				}]
			}]
		}, {
			model: models.User,
			through: models.UserAlbum,
			required: false,
			where: {
				id: req.user.id
			}
		}],
		order: [
			[models.Post, 'createdAt', 'DESC']
		]
	}).then(function(albumData) {
		if (albumData) {
			var owned = false;
			if (albumData.Users.length) {
				owned = true;
			}
			var albumObj = {
				album: albumData,
				extra: {
					userId: req.user.id,
					username: req.user.username,
					title: true,
					loggedIn: loggedIn,
					inDb: true,
					owned: owned
				}
			};
			//res.json(albumObj);
			res.render('album', albumObj);
		} else {
			// not in our database, so call Discogs!
			discogsDb.getMaster(req.params.id, function(err, masterData) {
				var urlSplit = masterData.main_release_url.split('/');
				var mainReleaseId = urlSplit[urlSplit.length - 1];
				discogsDb.getRelease(mainReleaseId, function(err, releaseData) {
					var albumObj = {
						album: releaseData,
						extra: {
							userId: req.user.id,
							username: req.user.username,
							title: true,
							loggedIn: loggedIn,
							inDb: false
						}
					};
					//res.json(albumObj);
					res.render('album', albumObj);
				});
			});
		}
	}).catch(function(err) {
		res.json(err);
	});
});

router.get('/albums/search', passportAuth.ensureAuthenticated, function(req, res) {
	var loggedIn = false;
	if (req.user)
		loggedIn = true;
	
	models.Album.findAll({
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
			model: models.Style,
			required: true
		}, { 
			model: models.Post,
			where: {
				isPublic: true
			},
			required: true
		}],
		limit: 100,
		subQuery: false,
		order: [
			[ models.Post,'createdAt', 'DESC' ]
		]
	}).then(function(albums) {
		var albumsObj = {
			albums: albums,
			extra: {
				loggedIn: loggedIn,
				username: req.user.username,
				album: false
			}
		};
		//res.json(albumsObj);
		res.render('search', albumsObj);
	}).catch(function(err){
		res.json(err);
	});
});

// searches for all albums that match the search parameters
router.post('/albums/search', passportAuth.ensureAuthenticated, function(req, res) {
	var loggedIn = false;
	if (req.user)
		loggedIn = true;

	var searchParams = {
		type: 'master'
	};

	if (req.body.type === 'artist') {
		searchParams.artist = req.body.query;
		searchParams.per_page = 500;
	} else {
		searchParams.release_title = req.body.query;
	}

	discogsDb.search(req.body.query, searchParams, function(err, data) {
		var results = data.results;
		var titles = [];
		var filtered = [];
		for (var i = 0; i < results.length; i++) {
			var titleSplit = results[i].title.split(' - ');
			var artist = titleSplit[0];
			var album = titleSplit[1];
			var title = results[i].title;
			results[i].albumName = album;
			results[i].artistName = artist;
			if(!titles.includes(title)) {
				filtered.push(results[i]);
				titles.push(title);
			}
		}
		var resultObj = {
			albums: filtered,
			extra: {
				userId: req.user.id,
				username: req.user.username,
				title: true,
				loggedIn: loggedIn,
				searched: true,
				album: req.body.type === 'album' ? true : false
			}
		};
		res.render('search', resultObj);
		//res.json(resultObj);
	});
});

module.exports = router;