module.exports = function(sequelize, DataTypes) {
	var Style = sequelize.define('Style', {
		style_name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	Style.associate = function(models) {
		models.Style.belongsToMany(models.Album, { through: models.AlbumStyle });
	};

	return Style;
};