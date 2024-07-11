const AppBranding = require("../models/adminAppBranding.models")
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("../utils/asyncHandler")


const createdBranding = asyncHandler(async(req,res,next)=>{

    const { brandName , description , url } = req.body

    //Validate brandName
    if (!brandName || typeof brandName !== 'string' || brandName.trim() === '') {
        return next(new ErrorHandler('Brand name is required and must be a non-empty string' , 400))
    }
    // Validate description
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return next(new ErrorHandler("Description is required and must be a non-empty string" , 400))
    }

    // Validate url (optional)
    if (url !== undefined) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        if (!urlPattern.test(url)) {
            return next(new ErrorHandler('URL must be a valid URL', 400))
        }
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
        url: url,
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

    const {brandName, description , url } = req.body
    
    // Validate brandName (optional)
    if (brandName !== undefined) {
        if (typeof brandName !== 'string') {
            errors.push({ msg: 'Brand name must be a string' });
        }
    }

    // Validate description (optional)
    if (description !== undefined) {
        if (typeof description !== 'string') {
            errors.push({ msg: 'Description must be a string' });
        }
    }

    // Validate url (optional)
    if (url !== undefined) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        if (!urlPattern.test(url)) {
            errors.push({ msg: 'URL must be a valid URL' });
        }
    }
      
    if (!brandName && !description && !url) {
        return next(new ErrorHandler("brandName or description fields are required", 400))
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

     // Only include fields that are provided and valid
     const updateFields = {};
     if (brandName !== undefined) updateFields.brandName = brandName;
     if (description !== undefined) updateFields.description = description;
     if (url !== undefined) updateFields.url = url;

    await AppBranding.update(
        updateFields,
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
