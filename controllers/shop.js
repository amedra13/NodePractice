const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
	Product.find()
		.then((products) => {
			console.log(products);
			res.render('shop/product-list', {
				prods: products,
				pageTitle: 'Shop',
				path: '/',
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => console.log(err));
};
exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			res.render('shop/product-detail', {
				product: product,
				pageTitle: product.title,
				path: '/products',
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
	Product.find()
		.then((products) => {
			res.render('shop/index', {
				prods: products,
				pageTitle: 'Shop',
				path: '/',
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => console.log(err));
};
exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items;
			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products: products,
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => console.log(err));
};
exports.postCart = (req, res, next) => {
	const prodId = req.body.productId;

	Product.findById(prodId)
		.then((product) => {
			req.user.addToCart(product);
			res.redirect('/cart');
		})
		.then((result) => {
			console.log(result);
		});
};

exports.postCartProductDelete = (req, res, next) => {
	const prodId = req.body.productId;
	req.user
		.deleteItemFromCart(prodId)
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => console.log(err));
};
exports.getCheckout = (req, res, next) => {
	res.render('shop/checkout', {
		path: '/checkout',
		pageTitle: 'Checkout',
		isAuthenticated: req.session.isLoggedIn,
	});
};
exports.postOrder = (req, res, next) => {
	const productItems = req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const productItems = user.cart.items.map((i) => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					name: req.user.name,
					userId: req.user._id,
				},
				products: productItems,
			});
			return order.save();
		})
		.then((result) => {
			return req.user.clearCart();
		})
		.then((result) => {
			res.redirect('/orders');
		})
		.catch((err) => console.log(err));
};
exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then((orders) => {
			res.render('shop/orders', {
				path: '/orders',
				pageTitle: 'Your Orders',
				orders: orders,
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => console.log(err));
};
