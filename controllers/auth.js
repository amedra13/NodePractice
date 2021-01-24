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

const crypto = require('crypto');

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

exports.postReset = (req, res, next) => {
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		console.log(token);
		User.findOne({ email: req.body.email })
			.then((user) => {
				if (!user) {
					req.flash('error', 'No Account with that email found');
					return res.redirect('/reset');
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				return user.save();
			})
			.then((result) => {
				res.redirect('/');
				transporter.sendMail({
					to: req.body.email,
					from: 'andresthedev5@gmail.com',
					subject: 'Password Reset!',
					html: `
					<p> You requested a password reset </p>
					<p> Click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new password.</p>
				`,
				});
			})
			.catch((err) => {
				console.log(err);
			});
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then((user) => {
			console.log(user._id);
			let message = req.flash('error');
			message = message.length > 0 ? message[0] : null;

			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'New Password',
				errorMessage: message,
				userId: user._id.toString(),
				passwordToken: token,
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;
	const passwordToken = req.body.passwordToken;
	let resetUser;

	User.findOne({
		resetToken: passwordToken,
		resetTokenExpiration: { $gt: Date.now() },
		_id: userId,
	})
		.then((user) => {
			resetUser = user;
			return bcrypt.hash(newPassword, 12);
		})
		.then((hashPassword) => {
			resetUser.password = hashPassword;
			resetUser.resetToken = null;
			resetUser.resetTokenExpiration = undefined;
			return resetUser.save();
		})
		.then((result) => {
			res.redirect('/login');
		})
		.catch((err) => {
			console.log(err);
		});
};
