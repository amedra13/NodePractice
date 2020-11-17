const products = [];

const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

const getProductFromFile = (cb) => {
	const p = path.join(rootDir, 'data', 'products.json');
	fs.readFile(p, (err, fileContent) => {
		if (err) {
			cb([]);
		} else {
			cb(JSON.parse(fileContent));
		}
	});
};

module.exports = class Product {
	constructor(t) {
		this.title = t;
	}

	save() {
		const p = path.join(rootDir, 'data', 'products.json');

		fs.readFile(p, (err, fileContent) => {
			getProductFromFile((products) => {
				products.push(this);
				fs.writeFile(p, JSON.stringify(products), (err) => {
					console.log(err);
				});
			});
		});
	}

	static fetchAll(cb) {
		getProductFromFile(cb);
	}
};
