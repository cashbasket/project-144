module.exports = function(sequelize, DataTypes) {
	var Album = sequelize.define('Album', {
		title: { type: DataTypes.STRING, allowNull: false, validate: { len: [1,255] } },
		album_art: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		release_year: { type: DataTypes.INTEGER, allowNull: false }
	}, {
		freezeTableName: true
	});

	Album.associate = function(models) {
		models.Album.belongsToMany(models.User, { through: models.UserAlbum });
		models.Album.hasMany(models.Post);
	};

	return Album;
};