const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(
	'sk_test_51INSSaHx218zEeuwuNckHtsWzlcZFVc2bMydnD7xBcxubctkp0YoDm8ZDi2GItiL4nNRQaP9LdJ5dEgQiktuQ5T700yhWVnLS5'
);
const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
	const page = +req.query.page || 1;
	let totalItems;

	Product.find()
		.countDocuments()
		.then((numberOfDocs) => {
			totalItems = numberOfDocs;
			return Product.find()
				.skip((page - 1) * ITEMS_PER_PAGE)
				.limit(ITEMS_PER_PAGE);
		})
		.then((products) => {
			console.log(products);
			res.render('shop/product-list', {
				prods: products,
				pageTitle: 'Shop',
				path: '/products',
				currentPage: page,
				previousPage: page - 1,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				hasNextPage: ITEMS_PER_PAGE * page < totalItems,
				lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			res.render('shop/product-detail', {
				product: product,
				pageTitle: product.title,
				path: '/products',
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getIndex = (req, res, next) => {
	const page = +req.query.page || 1;
	let totalItems;

	Product.find()
		.countDocuments()
		.then((numberOfDocs) => {
			totalItems = numberOfDocs;
			return Product.find()
				.skip((page - 1) * ITEMS_PER_PAGE)
				.limit(ITEMS_PER_PAGE);
		})
		.then((products) => {
			res.render('shop/index', {
				prods: products,
				pageTitle: 'Shop',
				path: '/',
				currentPage: page,
				previousPage: page - 1,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				hasNextPage: ITEMS_PER_PAGE * page < totalItems,
				lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
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
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
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
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCartProductDelete = (req, res, next) => {
	const prodId = req.body.productId;
	req.user
		.deleteItemFromCart(prodId)
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
exports.getCheckout = (req, res, next) => {
	let products;
	let total;

	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			products = user.cart.items;
			total = 0;
			products.forEach((p) => {
				total += p.quantity * p.productId.price;
			});

			return stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: products.map((p) => {
					return {
						name: p.productId.title,
						description: p.productId.description,
						amount: Math.round(p.productId.price * 100),
						currency: 'usd',
						quantity: p.quantity,
					};
				}),
				success_url:
					req.protocol + '://' + req.get('host') + '/checkout/success',
				cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
			});
		})
		.then((session) => {
			res.render('shop/checkout', {
				path: '/checkout',
				pageTitle: 'Checkout',
				products: products,
				totalSum: total,
				sessionId: session.id,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getCheckoutSuccess = (req, res, next) => {
	console.log('INSIDE SUCCESS FUNCTION');
	const productItems = req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const productItems = user.cart.items.map((i) => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					email: req.user.email,
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
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
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
					email: req.user.email,
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
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then((orders) => {
			res.render('shop/orders', {
				path: '/orders',
				pageTitle: 'Your Orders',
				orders: orders,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	Order.findById(orderId)
		.then((order) => {
			if (!order) {
				return next(new Error('No Order found!'));
			}
			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error('User not Authorized'));
			}
			const invoiceName = 'invoice-' + orderId + '.pdf';
			const invoicePath = path.join('data', 'invoices', invoiceName);
			// fs.readFile(invoicePath, (err, data) => {
			// 	if (err) {
			// 		return next(err);
			// 	}
			// 	res.setHeader('Content-Type', 'application/pdf');
			// 	res.setHeader(
			// 		'Content-Disposition',
			// 		'inline; filename="' + invoiceName + '"'
			// 	);
			// 	res.send(data);

			// });
			const pdfDoc = new PDFDocument();
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader(
				'Content-Disposition',
				'inline; filename="' + invoiceName + '"'
			);
			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);

			pdfDoc.fontSize(26).text('Invoice: ');
			pdfDoc.text('-----------------------------------------');

			let totalPrice = 0;
			order.products.forEach((product) => {
				totalPrice += product.quantity * product.product.price;
				pdfDoc
					.fontSize(14)
					.text(
						`${product.product.title} - ${product.quantity}x, price: $ ${product.product.price}`
					);
			});
			pdfDoc.text('------');
			pdfDoc.fontSize(12).text(`Total: ${totalPrice}`);
			pdfDoc.end();

			// const file = fs.createReadStream(invoicePath);
			// file.pipe(res);
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
