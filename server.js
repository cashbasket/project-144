var express = require('express');

var bodyParser = require('body-parser');
var db = require('./models');

var app = express();
var RateLimit = require('express-rate-limit');
var PORT = process.env.PORT || 3000;
global.__root   = __dirname + '/'; 

// Sets up the Express app to handle data parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.use(limiter);

// Import controllers
var RootController = require(__root + 'controllers/RootController');
app.use(RootController);

var UserController = require(__root + 'controllers/UserController');
app.use('/api/user', UserController);

var AlbumController = require(__root + 'controllers/AlbumController');
app.use('/api/album', AlbumController);

var PostController = require(__root + 'controllers/PostController');
app.use('/api/post', PostController);

var limiter = new RateLimit({
	windowMs: 15*60*1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	delayMs: 0 // disable delaying - full speed until the max limit is reached
  });

// Sync with DB and then listen
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Listening on port %s', PORT);
	});
});
