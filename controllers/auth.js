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
	req.session.loggedIn = true;
	res.redirect('/');
};
