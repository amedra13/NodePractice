const User = require('../models/user');

exports.getLogin = (req, res, next) => {
	// const loggedIn = req.get('Cookie').split('=')[1] === 'true';
	console.log(req.session);
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		isAuthenticated: false,
	});
};
exports.postLogin = (req, res, next) => {
	User.findById('6003794b05fec52b2c9961fa')
		.then((user) => {
			req.session.user = user;
			req.session.isLoggedIn = true;
			res.session.save((err) => {
				console.log(err);
				res.redirect('/');
			});
		})

		.catch((err) => console.log(err));
};
exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log(err);
		res.redirect('/');
	});
};
