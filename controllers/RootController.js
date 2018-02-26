var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');
var auth = require('../lib/helpers');
var querystring = require('querystring');
var nodemailer = require('nodemailer');
var url = require('url');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var Discogs = require('disconnect').Client;
var discogsDb = new Discogs({
	consumerKey: process.env.DISCOGS_CONSUMER_KEY, 
	consumerSecret: process.env.DISCOGS_CONSUMER_SECRET}).database();

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
		res.render('index', {layout: 'landingpage.handlebars'});
	}
});

router.get('/login', auth.validate, function(req, res) {
	if (!req.username)
		res.render('login', { hideNav: true });
	else
		res.redirect('/user/' + req.username);
});

router.post('/login', function(req, res) {
	auth.handler(req, res, 'login');
});

router.post('/logout', function(req, res) {
	auth.logout(req, res, function() {
		res.redirect(200, '/');
	});
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
			if(result[0] === 1) {
				var smtpTransport = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.MAIL_ADDRESS,
						pass: process.env.MAIL_PW
					}
				});
				var mailOptions = {
					to: req.body.email,
					from: process.env.MAIL_ADDRESS,
					subject: 'Project 144 Password Reset',
					text: 'Greetings!\n\n You are receiving this email because you (or someone else) has requested a password reset for your Project 144 account.\n\n' + 'To complete the password reset process, please click on the link below, or paste it into your browser:\n\n' +
				'https://' + req.headers.host + '/reset/' + token + '\n\n' +
				'If you did not request this email, please ignore this email and your password will remain unchanged.\n'
				};
				return smtpTransport.sendMail(mailOptions);
			}
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
			password: bcrypt.hashSync(req.body.password, 8),
			resetPasswordToken: null,
			resetPasswordExpires: null
		}, {
			where: {
				email: userEmail
			}
		});
	}).then(function(result) {
		var smtpTransport = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.MAIL_ADDRESS,
				pass: process.env.MAIL_PW
			}
		});
		var mailOptions = {
			to: userEmail,
			from: process.env.MAIL_ADDRESS,
			subject: 'Your Project 144 password has been changed',
			text: 'Hello,\n\n' +
				'We\'re just letting you know that the password for your Project 144 account was successfully changed.\n'
		};
		return smtpTransport.sendMail(mailOptions);
	}).then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.redirect('/');
	});
});

// gets all data for current user, including user info, albums owned and posts made
router.get('/user/:username', auth.validate, function(req, res) {
	var canEdit = false;
	var loggedIn = false;

	if (req.username)
		loggedIn = true;
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
				}]
			}],
			order: [
				['createdAt', 'DESC']
			]
		}]
	}).then(function(userData) {
		var userObj = {
			user: userData,
			extra: {
				username: req.username,
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
router.get('/user/:username/edit', auth.validate, function(req, res) {
	if (req.username && req.username === req.params.username) {
		models.User.findOne({
			where: {
				username: req.params.username
			}
		}).then(function(user) {
			if(user) {
				var userObj = {
					user: user.dataValues,
					extra: {
						loggedIn: req.username ? true : false
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
router.get('/user/:username/post', auth.validate, function(req, res) {
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
		if(user.username === req.username)
			//res.json(userObj);
			res.render('post', userObj);
		else
			res.redirect('/');
	}).catch(function(err) {
		res.json(err);
	});
});

// gets all data for the specified album
router.get('/album/:id', auth.validate, function(req, res) {
	var loggedIn = false;
	if (req.username)
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
			}]
		}, {
			model: models.User,
			through: models.UserAlbum,
			required: false,
			where: {
				id: req.userId
			}
		}]
	}).then(function(albumData) {
		console.log(albumData);
		if (albumData) {
			var owned = false;
			if (albumData.Users) {
				owned = true;
			}
			var albumObj = {
				album: albumData,
				extra: {
					userId: req.userId,
					username: req.username,
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
							userId: req.userId,
							username: req.username,
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

router.get('/albums/search', auth.validate, function(req, res) {
	var loggedIn = false;
	if (req.username)
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
		}],
		limit: 100,
		subQuery: false,
		order: [
			['createdAt', 'DESC']
		]
	}).then(function(albums) {
		var albumsObj = {
			albums: albums,
			extra: {
				userId: req.userId,
				username: req.username,
				loggedIn: loggedIn,
				album: true
			}
		};
		//res.json(albumsObj);
		res.render('search', albumsObj);
	}).catch(function(err){
		res.json(err);
	});
});

// searches for all albums that match the search parameters
router.post('/albums/search', auth.validate, function(req, res) {
	var loggedIn = false;
	if (req.username)
		loggedIn = true;

	// var whereObj;
	// if (req.body.type === 'title') {
	// 	whereObj = {
	// 		$or: [
	// 			{ title : { $eq: req.body.query } },
	// 			{ title : { like: req.body.query + ' %' } },
	// 			{ title: { like: '% ' + req.body.query } },
	// 			{ title: { like: '% ' + req.body.query + ' %' } }
	// 		]
	// 	};
	// } else if (req.body.type === 'artist') {
	// 	whereObj = {
	// 		$or: [
	// 			{ '$Artist.artist_name$' : { $eq: req.body.query } },
	// 			{ '$Artist.artist_name$' : { like: req.body.query + ' %' } },
	// 			{ '$Artist.artist_name$': { like: '% ' + req.body.query } },
	// 			{ '$Artist.artist_name$': { like: '% ' + req.body.query + ' %' } }
	// 		]
	// 	};
	// }

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
				userId: req.userId,
				username: req.username,
				title: true,
				loggedIn: loggedIn,
				searched: true,
				album: req.body.type === 'album' ? true : false
			}
		};
		res.render('search', resultObj);
		//res.json(resultObj);
	});
		
	
	// models.Album.findAll({
	// 	where: whereObj,
	// 	include: [{
	// 		model: models.Artist,
	// 		required: true
	// 	}, {
	// 		model: models.Genre,
	// 		required: true
	// 	}, {
	// 		model: models.Label,
	// 		required: true	
	// 	}, {
	// 		model: models.User,
	// 		required: false,
	// 		where: {
	// 			id: req.userId
	// 		}
	// 	}, {
	// 		model: models.Post,
	// 		required: false,
	// 		include: [{
	// 			model: models.User,
	// 			required: true
	// 		}]
	// 	}],
	// 	limit: 100,
	// 	subQuery: false,
	// 	order: [
	// 		['createdAt', 'DESC']
	// 	]
	// }).then(function(albumData) {
	// 	var albumsObj = {
	// 		albums: albumData,
	// 		extra: {
	// 			userId: req.userId,
	// 			username: req.username,
	// 			loggedIn: loggedIn,
	// 			title: req.body.type === 'title' ? true : false,
	// 			searched: true
	// 		}
	// 	};
	// 	res.render('search', albumsObj);
	// }).catch(function(err) {
	// 	res.json(err);
	// });
});

module.exports = router;