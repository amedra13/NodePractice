const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URL =
	'mongodb+srv://Andres:8Wijs9lpBV2HtrM9@cluster0.afspz.mongodb.net/shop';
const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongodbStore({
	uri: MONGODB_URL,
	collection: 'sessions',
});
const csrfProtection = csrf();

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.get('/favicon.ico', (req, res) => res.status(204));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
	session({
		secret: 'my secret',
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}
	User.findById(req.session.user._id)
		.then((user) => {
			req.user = user;
			next();
		})
		.catch((err) => console.log(err));
});

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
	.connect(MONGODB_URL)
	.then((result) => {
		app.listen(3000);
	})
	.catch((err) => {
		console.log(err);
	});
