const { sequelize } = require("../db/index.js")
const {DataTypes} = require("sequelize")

const AppBranding = sequelize.define("AppBranding" , {
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        unique: true
    },
    brandName:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty:{
                msg: "BrandName is required"
            }
        }
    },
    description:{
        type: DataTypes.TEXT,
        allowNull: false,
        validate:{
            notEmpty:{
                msg: "Description is required"
            }
        }
    },
    logo:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty:{
                msg: "Logo is required"
            }
        }
    },
    url:DataTypes.STRING,
    coverImage:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty:{
                msg:"Cover image is required"
            }
        }
    },
    createdBy:{
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    }
}, {
    hooks: {
        beforeCreate: (appBranding, options) => {
            // Trim leading and trailing spaces for brandName and description
            if (appBranding.brandName) {
                appBranding.brandName = appBranding.brandName.trim();
            }
            if (appBranding.description) {
                appBranding.description = appBranding.description.trim();
            }
        },
        beforeUpdate: (appBranding, options) => {
            // Trim leading and trailing spaces for brandName and description
            if (appBranding.brandName) {
                appBranding.brandName = appBranding.brandName.trim();
            }
            if (appBranding.description) {
                appBranding.description = appBranding.description.trim();
            }
        }
    }
})

module.exports = AppBranding