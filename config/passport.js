var	passport = require('passport'),
	bcrypt = require('bcrypt-nodejs'),
	LocalStrategy = require('passport-local').Strategy,
	gravatar = require('gravatar'),
	models = require('../models');

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id)
		.then(function(user) {
			done(null, user);
		}).catch(function(error) {
			done(error);
		});
});

passport.use('local-signup', new LocalStrategy({           
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback : true // allows us to pass back the entire request to the callback
}, function(req, email, password, done){
	models.User.findOne({
		where: {
			email: email
		}
	}).then(function(user){
		if(user && user.email === email)
			return done(null, false, {message: 'That email is already in use'});
		if(user && user.username === req.body.username)
			return done(null, false, {message: 'That username is already taken'});
		models.User.create({
			email: req.body.email,
			username: req.body.username,
			password: bcrypt.hashSync(password, bcrypt.genSaltSync(8), null),
			gravatarUrl: gravatar.url(email, {s: '200', r: 'pg', d: '404'}, true)
		}).then(function(newUser, created){
			if(!newUser)
				return done(null, false);
			else
				return done(null, newUser);
		});
	}); 
}));

passport.use('local-login', new LocalStrategy({
	usernameField : 'email',
	passwordField : 'password'
},
function(email, password, done) {
	models.User.findOne({
		where: {
			email: email
		}
	}).then(function(user){
		if(!user || user && !user.validPassword(password)) {
			return done(null, false, { message: 'Invalid email address or password' });
		}
		return done(null, user);
	}); 
}));

module.exports = passport;