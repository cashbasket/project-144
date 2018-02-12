module.exports = function(sequelize, DataTypes) {
	var Post = sequelize.define('Post', {
		body: { type: DataTypes.TEXT, allowNull: false, validate: { len: [1] } }
	}, {
		freezeTableName: true
	});

	Post.associate = function(models) {
		models.Post.belongsTo(models.User);
		models.Post.belongsTo(models.Album);
	};

	return Post;
};