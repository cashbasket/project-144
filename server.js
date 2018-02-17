require('dotenv').config();
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var db = require('./models');

var app = express();
var RateLimit = require('express-rate-limit');
var PORT = process.env.PORT || 3000;
var limiter = new RateLimit({
	windowMs: 15*60*1000,
	max: 100,
	delayMs: 0
});

// Sets up the Express app to handle data parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(limiter);

app.use(express.static('public'));

// Set Handlebars as the default templating engine.
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Import controllers
var RootController = require('./controllers/RootController');
app.use(RootController);

var ApiController = require('./controllers/ApiController');
app.use('/api', ApiController);

// Sync with DB and then listen
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Listening on port %s', PORT);
	});
});
