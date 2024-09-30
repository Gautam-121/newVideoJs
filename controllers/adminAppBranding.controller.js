const AppBranding = require("../models/adminAppBranding.models")
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const removeUploadedFiles = require("../utils/removeUploadedFile")
const fs = require("fs")
const { checkPlanExpired } = require("../utils/saasApis")

const brandNameRegex = /^[a-zA-Z\s]+$/; // Allows only alphabetic characters and spaces

const createdBranding = asyncHandler(async(req,res,next)=>{

    const { brandName , description , url } = req.body

    //Validate brandName
    if (!brandName || typeof brandName !== 'string' || brandName.trim() === '' || !brandNameRegex.test(brandName.trim())) {
        removeUploadedFiles(req.files)
        return next(new ErrorHandler('Brand name is required, must be a non-empty string, and contain only alphabetic characters', 400));
    }
    // Validate description
    if (!description || typeof description !== 'string' || description.trim() === '' || description.trim().length > 500) {
        removeUploadedFiles(req.files)
        return next(new ErrorHandler('Description is required, must be a non-empty string, and cannot exceed 500 characters', 400));
    }

    // Validate url (optional)
    if (url !== undefined) {
      const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i')
        if (!urlPattern.test(url)) {
            removeUploadedFiles(req.files)
            return next(new ErrorHandler('URL must be a valid URL', 400))
        }
    }

    const token = req.headers['authorization'];
    const subscription = await checkPlanExpired(token)

    if(!subscription ||  subscription?.length == 0){
      removeUploadedFiles(req.files)
      return res.status(500).json({
        success: false,
        message: "something went wrong while accessing user subscription plan"
      })
    }

    if(!subscription?.data[0].isTrialActive){
      // Get all Active Plan
      const activeSubscriptions = subscription.data[0].subscriptions
      .filter( plan => new Date(plan.startDate) <= new Date() && new Date(plan.endDate) >= new Date())

      if(activeSubscriptions.length == 0){
        removeUploadedFiles(req.files)
        res.status(400).json({
          success: false,
          message: "Please renew your subscription plan. Your current subscription is expired."
        });      
      }
    }
    else if(subscription?.data[0].isTrialActive && subscription?.data[0]?.trialEndDate < new Date()){
      removeUploadedFiles(req.files)
      return next(new ErrorHandler("Your trial is expired , Please renew your plan" , 400))
    }

    const isAlreadyCreatedBranding = await AppBranding.findOne({
      where:{
        createdBy: req.user?.obj?.id
      }
    })

    if(isAlreadyCreatedBranding){
        removeUploadedFiles(req.files)
        return next(
            new ErrorHandler("Admin Branding details Already exist", 409)
        )
    }

    if(!(req.files && req.files && req.files.logo && req.files.logo[0].path)){
        removeUploadedFiles(req.files)
        return next(
            new ErrorHandler( "Logo is required and must be a file.", 400)
        )
    }

    if(!(req.files && req.files && req.files.coverImage && req.files.coverImage[0].path)){
        removeUploadedFiles(req.files)
        return next(
            new ErrorHandler("Cover image is required and must be a file.", 400)
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
        removeUploadedFiles(req.files)
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
        if (typeof brandName !== 'string' || !brandNameRegex.test(brandName.trim())) {
            return next(new ErrorHandler('Brand name must be a string and contain only alphabetic characters', 400))
        }
    }

    // Validate description (optional)
    if (description !== undefined) {
        if (typeof description !== 'string' || description.trim().length > 500) {
            return next(new ErrorHandler('description must be string and cannot exceed 500 characters', 400))
        }
    }

    // Validate url (optional)
    if (url !== undefined) {
      const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i')
      if (!urlPattern.test(url)) {
        removeUploadedFiles(req.files)
        return next(new ErrorHandler('URL must be a valid URL', 400))
      }
    }
      
    if (!brandName && !description && !url) {
        return next(new ErrorHandler("please provide a field", 400))
    }

    const token = req.headers['authorization'];
    const subscription = await checkPlanExpired(token)

    if(!subscription ||  subscription?.length == 0){
      return res.status(500).json({
        success: false,
        message: "something went wrong while accessing user subscription plan"
      })
    }

    if(!subscription?.data[0].isTrialActive){
      // Get all Active Plan
      const activeSubscriptions = subscription.data[0].subscriptions
      .filter( plan => new Date(plan.startDate) <= new Date() && new Date(plan.endDate) >= new Date())

      if(activeSubscriptions.length == 0){
        res.status(400).json({
          success: false,
          message: "Please renew your subscription plan. Your current subscription is expired."
        });      
      }
    }
    else if(subscription?.data[0].isTrialActive && subscription?.data[0]?.trialEndDate < new Date()){
      return next(new ErrorHandler("Your trial is expired , Please renew your plan" , 400))
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
     if (brandName !== undefined) updateFields.brandName = brandName.trim();
     if (description !== undefined) updateFields.description = description.trim();
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
        return next(new ErrorHandler("Logo image must be a file" , 400))
    }

    const token = req.headers['authorization'];
    const subscription = await checkPlanExpired(token)

    if(!subscription ||  subscription.length == 0){
       if(fs.existsSync(req.file.path)){
          fs.unlinkSync(req.file.path)
        }
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      })
    }

    if(!subscription?.data[0].isTrialActive){
      // Get all Active Plan
      const activeSubscriptions = subscription.data[0].subscriptions
      .filter( plan => new Date(plan.startDate) <= new Date() && new Date(plan.endDate) >= new Date())

      if(activeSubscriptions.length == 0){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
        res.status(400).json({
          success: false,
          message: "Please renew your subscription plan. Your current subscription is expired."
        });      
      }
    }
    else if(subscription?.data[0].isTrialActive && subscription?.data[0].trialEndDate < new Date()){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
      return next(new ErrorHandler("Your trial is expired , Please renew your plan" , 400))
    }

    const userBranding = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!userBranding){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
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

    // Remove the existing cover image file
    const existingLogoImagePath = userBranding.logo;
    if (existingLogoImagePath) {
       const logoImagePath = "public/temp/admin/" + userBranding.logo
       if(fs.existsSync(logoImagePath)){
           fs.unlinkSync(logoImagePath)
       }
    }

    return res.status(200).json({
        success: true,
        message: "Logo updated successfully"
    })
})

const updateCoverImage  = asyncHandler(async(req , res , next)=>{

    const coverImageLocalPath = req.file?.filename

    if (!coverImageLocalPath) {
        return next(new ErrorHandler("Cover image must be a file.", 400))
    }

    const token = req.headers['authorization'];
    const subscription = await checkPlanExpired(token)


    if(!subscription ||  subscription.length == 0){
       if(fs.existsSync(req.file.path)){
          fs.unlinkSync(req.file.path)
        }
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      })
    }

    if(!subscription?.data[0].isTrialActive){
      // Get all Active Plan
      const activeSubscriptions = subscription.data[0].subscriptions
      .filter( plan => new Date(plan.startDate) <= new Date() && new Date(plan.endDate) >= new Date())

      if(activeSubscriptions.length == 0){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
        res.status(400).json({
          success: false,
          message: "Please renew your subscription plan. Your current subscription is expired."
        });      
      }
    }
    else if(subscription?.data[0].isTrialActive && subscription?.data[0].trialEndDate < new Date()){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
      return next(new ErrorHandler("Your trial is expired , Please renew your plan" , 400))
    }

    const userBranding = await AppBranding.findOne({
        where:{
            createdBy: req.user?.obj?.id
        }
    })

    if(!userBranding){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
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

     // Remove the existing cover image file
     const existingCoverImagePath = userBranding.coverImage;
     if (existingCoverImagePath) {
        const coverImagePath = "public/temp/admin/" + userBranding.coverImage
        if(fs.existsSync(coverImagePath)){
            fs.unlinkSync(coverImagePath)
        }
     }

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
