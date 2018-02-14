module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('User', {
		username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } },
		password: { type: DataTypes.CHAR, allowNull: false, validate: { len: [1,60] } },
		email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } },
		name: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		location: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		bio: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
	}, {
		freezeTableName: true
	});

	User.associate = function(models) {
		models.User.hasMany(models.Post);
		models.User.belongsToMany(models.Album, { through: models.UserAlbum });
	};

	User.prototype.toJSON =  function () {
		var values = Object.assign({}, this.get());
		delete values.password;
		return values;
	};

	return User;
};