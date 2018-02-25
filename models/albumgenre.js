module.exports = function(sequelize, DataTypes) {
	var AlbumGenre = sequelize.define('AlbumGenre', {}, {
		timestamps: false,
		freezeTableName: true
	});

	return AlbumGenre;
};