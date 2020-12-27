const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
	MongoClient.connect(
		'mongodb+srv://Andres:8Wijs9lpBV2HtrM9@cluster0.afspz.mongodb.net/shop?retryWrites=true&w=majority'
	)
		.then((client) => {
			console.log('connected!');
			_db = client.db();
			callback(client);
		})
		.catch((err) => {
			console.log(err);
			throw err;
		});
};

const getDb = () => {
	if (_db) {
		return _db;
	}
	throw 'No Database found!';
};
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
