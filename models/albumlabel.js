module.exports = function(sequelize, DataTypes) {
	var AlbumLabel = sequelize.define('AlbumLabel', {}, {
		timestamps: false,
		freezeTableName: true
	});

	return AlbumLabel;
};