module.exports = function(sequelize, DataTypes) {
	var Token = sequelize.define('Token', {
		uuid: { type: DataTypes.STRING, allowNull: false },
		record: { type: DataTypes.STRING, allowNull: false }
	}, {
		freezeTableName: true
	});

	return Token;
};