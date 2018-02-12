module.exports = function(sequelize, DataTypes) {
	var UserAlbum = sequelize.define('UserAlbum', {
		rating: { type: DataTypes.INTEGER, allowNull: true, validate: { len: [1] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	return UserAlbum;
};