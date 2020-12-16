const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'Omfk7710!', {
	dialect: 'mysql',
	host: 'localhost',
});

module.export = sequelize;
