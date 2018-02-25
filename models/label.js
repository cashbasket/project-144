module.exports = function(sequelize, DataTypes) {
	var Label = sequelize.define('Label', {
		label_name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } }
	}, {
		timestamps: false,
		freezeTableName: true
	});

	Label.associate = function(models) {
		models.Label.belongsToMany(models.Album, { through: models.AlbumLabel });
	};

	return Label;
};