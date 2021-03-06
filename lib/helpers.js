var jwt  = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var models = require('../models');
var uuidv1 = require('uuid/v1');

var secret = process.env.JWT_SECRET;

// show fail page (login)
function authFail(res) {
	return res.redirect('/login');
}

// create JWT
function generateToken(req, uuid, userId, username, email) {
	var expiresDefault = 60 * 60 * 24 * 7;
	var token = jwt.sign({
		auth:  uuid,
		id: userId,
		username: username,
		email: email,
		agent: req.headers['user-agent']
	}, secret, { expiresIn: expiresDefault });
	return token;
}

function generateAndStoreToken(req, username, userId, email, callback) {
	var uuid = uuidv1();
	var token = generateToken(req, uuid, userId, username, email);
	var record = {
		valid : true,
		created : new Date().getTime() / 1000
	};
	models.Token.create({
		uuid: uuid,
		record: JSON.stringify(record)
	}).then(function(result) {
		if(result)
			callback(token);
	});
}

function authSuccess(req, res, username, userId, email) {
	generateAndStoreToken(req, username, userId, email, function(token) {
		res.cookie('p144jwt', token , { expires : new Date(Date.now() + 2629746000), httpOnly: true }); // expires after a month
		res.json({ username: username });
	});
}

function authHandler(req, res, action) {
	models.User.findOne({
		where: {
			$or: [
				{ username : { $eq: req.body.login } },
				{ email : { $eq: req.body.login } },
				{ username : { $eq: req.body.username } }
			]
		}
	}).then(function(user) {
		if (!user) return res.json({ error: 'no such user' });

		if (action === 'register' && user.dataValues) {
			return authSuccess(req, res, user.username, user.dataValues.id, user.email);
		} else {
			var passwordValid = bcrypt.compareSync(req.body.password, user.password);
			if((req.body.login === user.username || req.body.login === user.email) && req.body.password && passwordValid) {
				return authSuccess(req, res, user.username, user.dataValues.id, user.email);
			} else {
				return res.json({ error: 'bad password' });
			}
		}
	}).catch(function(err) {
		res.status(500).json(err);
	});
}

function verify(res, token, callback) {
	jwt.verify(token, secret, function(err, decoded) {
		if (err) return res.redirect('/login');
		callback();
	});
}

function validate(req, res, next) {
	var token = req.body.token || req.cookies.p144jwt;

	var regex = /^(\/)?(login|forgot|reset)?$/;
	var profileRegex = /^\/user\/(\w)*(\/)?(search(\/)?)?$/;

	if (!token && (regex.test(req.url) || profileRegex.test(req.url)))
		return next();

	if(token) {
		jwt.verify(token, secret, function(err, decoded) {   
			if (err) {
				return res.redirect('/login');    
			}
			
			// if token has expired, blacklist it
			var current = new Date().getTime() / 1000;
			if (decoded.exp < current) {
				res.clearCookie('jwt144');
				var record = { valid : false };
				models.Token.update({
					record: JSON.stringify(record)
				}, {
					where: {
						uuid: decoded.auth,
					}
				}).then(function(result) {
					return res.redirect('/login');
				});
			} else {
				models.Token.findOne({
					where: {
						uuid: decoded.auth
					}
				}).then(function(result) {
					if (result) {
						var record;
						try {
							record = JSON.parse(result.dataValues.record);
						} catch (e) {
							record = { valid : false };
						}
					}
					if (!record.valid) {
						authFail(res);
					} else {
						req.userId = decoded.id.toString();
						req.username = decoded.username;
						req.email = decoded.email;
						next();
					}
				}).catch(function(err) {
					return authFail(res);
				});
			}
		});
	} else {
		return authFail(res);
	}
}

function notFound(res) {
	res.writeHead(404, {'content-type': 'text/plain'});
	return res.end('Page not found!');
}

function logout(req, res, callback) {
	var token = req.cookies.p144jwt;
	if (!token) 
		return res.redirect('/login');

	jwt.verify(token, secret, function(err, decoded) {
		if(decoded) {
			models.Token.findOne({
				where: {
					uuid: decoded.auth
				}
			}).then(function(result) {
				var updated = JSON.parse(result.dataValues.record);
				updated.valid = false;
				return models.Token.update({
					record: JSON.stringify(updated)
				}, {
					where: {
						uuid: decoded.auth
					}
				});
			}).then(function(result) {
				res.clearCookie('p144jwt', { path: '/' });
				res.status(200).end();
			}).catch(function(err) {
				res.json(err);
			});
		} else {
			authFail(res);
			return callback(res);
		}
	});
}

module.exports = {
	fail : authFail,
	handler : authHandler,
	logout : logout,
	notFound : notFound,
	success : authSuccess,
	verify: verify,
	validate : validate,
	generateAndStoreToken: generateAndStoreToken
};