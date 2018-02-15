var jwt  = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var models = require('../models');
var uuidv1 = require('uuid/v1');

var secret = process.env.JWT_SECRET;

// show fail page (login)
function authFail(res, callback) {
	res.writeHead(401, {'content-type': 'text/html'});
	return res.render('login');
}

// create JWT
function generateToken(req, UUID, userId, opts) {
	opts = opts || {};
	var expiresDefault = 60 * 60 * 24 * 7;

	var token = jwt.sign({
		auth:  UUID,
		userId: userId,
		agent: req.headers['user-agent']
	}, secret, { expiresIn: opts.expires || expiresDefault });

	return token;
}

function generateAndStoreToken(req, opts) {
	var UUID = uuidv1(); 
	var token = generateToken(req, UUID, opts);
	var record = {
		'valid' : true,
		'created' : new Date().getTime()
	};
	models.Token.create({
		uuid: UUID,
		record: record
	}).then(function(result) {
		if(result)
			return token;
	});
}

function authSuccess(req, res, username) {
	var token = generateAndStoreToken(req);
	res.writeHead(200, {
		'content-type': 'text/html',
		'authorization': token
	});
	return res.redirect('/user/' + username);
}

function authHandler(req, res) {
	models.User.findOne({
		where: {
			$or: [
				{ username : { $eq: req.body.query } },
				{ email : { $eq: req.body.query } }
			]
		}
	}).then(function(user) {
		if (req.method === 'POST') {
			var passwordValid = bcrypt.compareSync(req.body.password, user.password);
			if(req.body.username && req.body.username === user.username && req.body.password && passwordValid) {
				return authSuccess(req, res, user.username);
			} else {
				return authFail(res);
			}
		} else {
			return authFail(res);
		}
	});
}

function validate(req, res, next) {
	var token = req.headers.authorization;
	jwt.verify(token, secret, function(err, decoded) {      
		if (err) 
			return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });    
		models.Token.findOne({
			where: {
				uuid:  decoded.auth
			}
		}).then(function(result) {
			if (result) {
				var record;
				try {
					record = JSON.parse(result);
				} catch (e) {
					record = { valid : false };
				}
			}
			if (!record.valid) {
				authFail(res);
			} else {
				res.writeHead(200, {
					'content-type': 'text/html',
					'authorization': token
				});
				req.userId = decoded.userId;
				next();
			}
		}).catch(function(err) {
			authFail(res);
		});
	});

}

function notFound(res) {
	res.writeHead(404, {'content-type': 'text/plain'});
	return res.end('Page not found');
}

function done() {
	return;
}

function logout(req, res, callback) {
	var token = req.headers.authorization;
	jwt.verify(token, secret, function(err, decoded) {
		if(decoded) {
			models.Token.findOne({
				uuid: decoded.auth
			}).then(function(record) {
				var updated = JSON.parse(record);
				updated.valid = false;
				return models.Token.update({
					record: updated
				}, {
					where: {
						uuid: decoded.auth
					}
				});
			}).then(function() {
				res.writeHead(200, {'content-type': 'text/plain'});
				res.end('Logged Out!');
				res.redirect('/');
				return callback(res);
			}).catch(function(err) {
				res.json(err);
			});
		} else {
			authFail(res, done);
			return callback(res);
		}
	});
}

module.exports = {
	fail : authFail,
	done: done,
	handler : authHandler,
	logout : logout,
	notFound : notFound,
	success : authSuccess,
	validate : validate,
	generateAndStoreToken: generateAndStoreToken
};