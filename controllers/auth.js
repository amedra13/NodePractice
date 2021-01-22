const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(
	sendgridTransport({
		auth: {
			api_key:
				'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',
		},
	})
);

exports.getLogin = (req, res, next) => {
	let message = req.flash('error');
	message = message.length > 0 ? message[0] : null;
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		isAuthenticated: false,
		errorMessage: message,
	});
};

exports.getSignup = (req, res, next) => {
	let message = req.flash('error');
	message = message.length > 0 ? message[0] : null;
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		isAuthenticated: false,
		errorMessage: message,
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
			if (userDoc) {
				req.flash('error', 'E-mail exits already, please pick a different one');
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
			return transporter.sendMail({
				to: email,
				from: 'andresthedev5@gmail.com',
				subject: 'Signup succeeded!',
				html: '<h1>YOu have successfully signed up </h1>',
			});
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

exports.getReset = (req, res, next) => {
	let message = req.flash('error');
	message = message.length > 0 ? message[0] : null;

	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset Password',
		errorMessage: message,
	});
};
