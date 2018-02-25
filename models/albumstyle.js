module.exports = function(sequelize, DataTypes) {
	var AlbumStyle = sequelize.define('AlbumStyle', {}, {
		timestamps: false,
		freezeTableName: true
	});

	return AlbumStyle;
};