require('dotenv').config();
var express   = require('express'),
	session   = require('express-session'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	exphbs = require('express-handlebars'),
	handlebars = require('./lib/handlebars')(exphbs),
	flash = require('connect-flash'),
	db = require('./models');

var app = express();
var PORT = process.env.PORT || 3000;

app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, for instance)

app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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