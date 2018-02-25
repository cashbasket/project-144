module.exports = function(sequelize, DataTypes) {
	var Album = sequelize.define('Album', {
		id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
		title: { type: DataTypes.STRING, allowNull: false, validate: { len: [1,255] } },
		album_art: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		release_year: { type: DataTypes.INTEGER, allowNull: false },
		added_by: { type: DataTypes.INTEGER, allowNull: false }
	}, {
		indexes: [{
			unique: true,
			fields: ['title', 'ArtistId']
		}]
	});

	Album.associate = function(models) {
		models.Album.belongsTo(models.Artist);
		models.Album.belongsToMany(models.Genre, { through: models.AlbumGenre });
		models.Album.belongsToMany(models.Label, { through: models.AlbumLabel });
		models.Album.belongsToMany(models.User, { through: models.UserAlbum });
		models.Album.belongsToMany(models.Style, { through: models.AlbumStyle });
		models.Album.hasMany(models.Post);
	};

	return Album;
};