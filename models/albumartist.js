module.exports = function(sequelize, DataTypes) {
	var AlbumArtist = sequelize.define('AlbumArtist', {}, {
		timestamps: false,
		freezeTableName: true
	});

	return AlbumArtist;
};