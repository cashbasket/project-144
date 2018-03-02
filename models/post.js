module.exports = function(sequelize, DataTypes) {
	var Post = sequelize.define('Post', {
		body: { type: DataTypes.TEXT, allowNull: false, validate: { len: [1] } },
		isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
	}, {
		freezeTableName: true
	});

	Post.associate = function(models) {
		models.Post.belongsTo(models.User);
		models.Post.belongsTo(models.Album);
		models.Post.hasMany(models.Comment);
	};

	return Post;
};