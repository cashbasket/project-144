var bcrypt = require('bcrypt-nodejs');
module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('User', {
		username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } },
		password: { type: DataTypes.CHAR, allowNull: false, validate: { len: [1,60] } },
		verifyAccountToken: { type: DataTypes.STRING, allowNull: true },
		resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
		resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
		email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [1,255] } },
		name: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		location: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		bio: { type: DataTypes.STRING, allowNull: true, validate: { len: [0,255] } },
		gravatarUrl: { type: DataTypes.STRING, allowNull: true },
		isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
	}, {
		freezeTableName: true
	});

	User.associate = function(models) {
		models.User.hasMany(models.Post);
		models.User.hasMany(models.Comment);
		models.User.belongsToMany(models.Album, { through: models.UserAlbum });
	};

	User.prototype.toJSON =  function () {
		var values = Object.assign({}, this.get());
		delete values.password;
		delete values.resetPasswordToken;
		delete values.resetPasswordExpires;
		return values;
	};
	
	User.prototype.validPassword = function(password) {
		return bcrypt.compareSync(password, this.password);
	};

	return User;
};