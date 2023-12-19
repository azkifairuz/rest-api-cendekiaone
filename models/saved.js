'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class saved extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  saved.init({
    id_posts: DataTypes.INTEGER,
    saved_by_user: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'saved',
  });
  return saved;
};