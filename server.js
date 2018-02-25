require('dotenv').config();
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var handlebars = require('./lib/handlebars')(exphbs);
var db = require('./models');

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, for instance)

app.use(express.static('public'));

// Set Handlebars as the default templating engine.
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Import controllers
var RootController = require('./controllers/RootController');
app.use(RootController);

var ApiController = require('./controllers/ApiController');
app.use('/api', ApiController);

// app.listen(PORT, function() {
// 	console.log('Listening on port %s', PORT);
// });

//To create the database tables automatically from the Sequelize models, uncomment the following code:
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Listening on port %s', PORT);
	});
});