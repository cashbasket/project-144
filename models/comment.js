module.exports = function(sequelize, DataTypes) {
	var Comment = sequelize.define('Comment', {
		body: { type: DataTypes.TEXT, allowNull: false, validate: { len: [1] } },
	}, {
		freezeTableName: true
	});

	Comment.associate = function(models) {
		models.Comment.belongsTo(models.User);
		models.Comment.belongsTo(models.Post);
	};

	return Comment;
};