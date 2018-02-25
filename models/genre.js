module.exports = function(sequelize, DataTypes) {
	var Genre = sequelize.define('Genre', {
		genre_name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	Genre.associate = function(models) {
		models.Genre.belongsToMany(models.Album, { through: models.AlbumGenre });
	};

	return Genre;
};