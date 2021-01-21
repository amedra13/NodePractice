const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		isAuthenticated: false,
		errorMessage: req.flash('error'),
	});
};

exports.getSignup = (req, res, next) => {
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		isAuthenticated: false,
	});
};

exports.postLogin = (req, res, next) => {
	const { email, password } = req.body;

	User.findOne({ email: email })
		.then((user) => {
			if (!user) {
				req.flash('error', 'Invalid email or password');
				return res.redirect('/login');
			}
			bcrypt.compare(password, user.password).then((doMatch) => {
				if (doMatch) {
					req.session.isLoggedIn = true;
					req.session.user = user;
					return req.session.save((err) => {
						console.log(err);
						res.redirect('/');
					});
				}
				req.flash('error', 'Invalid email or password');
				res.redirect('/login');
			});
		})
		.catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
	const { email, password, confirmPassowrd } = req.body;
	User.findOne({ email: email })
		.then((userDoc) => {
			console.log(userDoc);
			if (userDoc) {
				return res.redirect('/signup');
			}
			return bcrypt.hash(password, 12).then((hashPassword) => {
				const user = new User({
					email: email,
					password: hashPassword,
					cart: { items: [] },
				});
				return user.save();
			});
		})

		.then((result) => {
			res.redirect('/login');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log(err);
		res.redirect('/');
	});
};
