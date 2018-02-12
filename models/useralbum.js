module.exports = function(sequelize) {
	var UserAlbum = sequelize.define('UserAlbum', {
		timestamps: false,
		freezeTableName: true
	});

	return UserAlbum;
};