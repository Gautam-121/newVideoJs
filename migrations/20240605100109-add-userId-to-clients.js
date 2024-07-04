'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the columns to the Videos table
    await queryInterface.addColumn('Videos', 'isDeleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    
    await queryInterface.addColumn('Videos', 'videoLength', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the columns from the Videos table
    await queryInterface.removeColumn('Videos', 'isDeleted');
    await queryInterface.removeColumn('Videos', 'videoLength');
  }
};
