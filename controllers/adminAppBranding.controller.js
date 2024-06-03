const AppBranding = require("../models/adminAppBranding.models")
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("../utils/asyncHandler")
const fs = require("fs");
const { IsValidUUID } = require("../constants");


const createdBranding = asyncHandler(async(req,res,next)=>{

    const { brandName , description } = req.body

    if(
        [brandName , description].some(field => field?.trim() === "")
    ){
        return next(new ErrorHandler("All field is Required",400 ))
    }

    const isAlreadyCreatedBranding = await AppBranding.findOne({
      where:{
        createdBy: req.user?.obj?.id
      }
    })

    if(isAlreadyCreatedBranding){
        return next(
            new ErrorHandler("Admin Branding details Already exist", 409)
        )
    }

    if(!(req.files && req.files && req.files.logo && req.files.logo[0].path)){
        return next(
            new ErrorHandler( "Logo is required", 400)
        )
    }

    if(!(req.files && req.files && req.files.coverImage && req.files.coverImage[0].path)){
        return next(
            new ErrorHandler( "CoverImage is required" , 400)
        )
    }

    const appBranding  = await AppBranding.create({
        brandName , 
        description,
        logo:  req.files.logo[0].filename,
        coverImage: req.files.coverImage[0].filename,
        createdBy: req.user?.obj?.id
    })

    const createdBranding = await AppBranding.findByPk(appBranding.id);
  
      if(!createdBranding){
          return next(
              new ErrorHandler( "Something went wrong while creating a AppBranding", 500 )
          )
      }

      return res.status(201).json({
        success: true,
        message: "AppBranding Created Successully",
        data:createdBranding
      })
})

const getAppBranding = asyncHandler(async(req , res , next)=>{

    const appBrandingByAdmin = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!appBrandingByAdmin){
        return next(
            new ErrorHandler( "AppBranding is not found", 404)
        )
    }

    return res.status(200).json({
        success: true,
        message: "Data send successfully",
        data: appBrandingByAdmin
    })

})

const updateAppBrandingDetails = asyncHandler(async(req , res , next)=>{

    const {brandName, description} = req.body

    if (!brandName && !description) {
        return next(new ErrorHandler("All fields are required", 400))
    }

    const appBrandingByAdmin = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!appBrandingByAdmin){
        return next(
            new ErrorHandler( "AppBranding is not found", 404)
        )
    }

    await AppBranding.update(
        {
           ...req.body
        },
        {
            where:{
                createdBy: req.user?.obj?.id
            },
            returning: true
        },
    )

    return res.status(200).json({
        success: true,
        message:"Data Updated Successfully"
    })
})

const updateLogo = asyncHandler(async(req , res , next)=>{

    const logoLocalPath = req.file?.filename

    if (!logoLocalPath) {
        return next(new ErrorHandler("Cover image file is missing" , 400))
    }

    const userBranding = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!userBranding){
        return next(new ErrorHandler("AppBranding not found" , 404))
    }

    if(userBranding.logo){
        fs.unlinkSync(`public/temp/admin/${userBranding.logo}`)
    }

    await AppBranding.update(
        {
            logo: logoLocalPath
        },
        {
            where:{
                createdBy: req.user?.obj?.id
            }
        },
    )

    return res.status(200).json({
        success: true,
        message: "Logo updated successfully"
    })
})

const updateCoverImage  = asyncHandler(async(req , res , next)=>{

    const coverImageLocalPath = req.file?.filename

    if (!coverImageLocalPath) {
        return next(new ErrorHandler("Cover image file is missing" , 400))
    }

    const userBranding = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!userBranding){
        return next(new ErrorHandler("AppBranding not found" , 404))
    }

    if(userBranding.coverImage){
        fs.unlinkSync(`public/temp/admin/${userBranding.coverImage}`)
    }

    await AppBranding.update(
        {
            coverImage: coverImageLocalPath
        },
        {
            where:{
                createdBy: req.user?.obj?.id
            }
        }
    )

    return res.status(200).json({
        success: true,
        message: "CoverImage updated successfully"
    })
})



module.exports = {
    createdBranding,
    getAppBranding,
    updateAppBrandingDetails,
    updateLogo,
    updateCoverImage
}
