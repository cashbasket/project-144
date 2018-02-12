module.exports = function(sequelize, DataTypes) {
	var Genre = sequelize.define('Genre', {
		genre_name: { type: DataTypes.STRING, allowNull: false, validate: { len: [1,255] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	Genre.associate = function(models) {
		models.Genre.hasMany(models.Album);
	};

	return Genre;
};