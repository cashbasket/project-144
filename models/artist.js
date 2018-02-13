module.exports = function(sequelize, DataTypes) {
	var Artist = sequelize.define('Artist', {
		artist_name: { type: DataTypes.STRING, allowNull: false, validate: { len: [1,255] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	Artist.associate = function(models) {
		models.Artist.hasMany(models.Album);
	};

	return Artist;
};