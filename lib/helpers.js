var jwt  = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var models = require('../models');
var uuidv1 = require('uuid/v1');

var secret = process.env.JWT_SECRET;

// show fail page (login)
function authFail(res) {
	return res.redirect(401, '/login');
}

// create JWT
function generateToken(req, uuid, userId, username) {
	var expiresDefault = 60 * 60 * 24 * 7;
	var token = jwt.sign({
		auth:  uuid,
		id: userId,
		username: username,
		agent: req.headers['user-agent']
	}, secret, { expiresIn: expiresDefault });
	return token;
}

function generateAndStoreToken(req, username, userId, callback) {
	var uuid = uuidv1();
	var token = generateToken(req, uuid, userId, username);
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

function authSuccess(req, res, username, userId) {
	generateAndStoreToken(req, username, userId, function(token) {
		res.cookie('p144jwt', token , { expires : new Date(Date.now() + 2629746000), httpOnly: true }); // expires after a month
		res.redirect(200, '/user/' + username);
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
		if (req.method === 'POST') {
			if (action === 'register' && user.dataValues) {
				return authSuccess(req, res, user.username, user.dataValues.id);
			} else {
				var passwordValid = bcrypt.compareSync(req.body.password, user.password);
				if((req.body.login === user.username || req.body.login === user.email) && req.body.password && passwordValid) {
					return authSuccess(req, res, user.username, user.dataValues.id);
				} else {
					return authFail(res);
				}
			}
		} else {
			return authFail(res);
		}
	});
}

function verify(res, token, callback) {
	jwt.verify(token, secret, function(err, decoded) {
		if (err) return res.redirect(500, '/login');
		callback();
	});
}

function validate(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.p144jwt;

	// if it's the homepage or a profile page, user doesn't have to be logged in to just view it.
	if (!token && (req.url === '/' || req.url.indexOf('/user/')) >= 0)
		return next();

	if(token) {
		jwt.verify(token, secret, function(err, decoded) {   
			if (err) {
				return res.redirect(500, '/login');    
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
					return res.redirect(401, '/login');
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
	var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.p144jwt;
	if (!token) 
		return res.redirect(403, '/login');

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
				return callback(res);
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