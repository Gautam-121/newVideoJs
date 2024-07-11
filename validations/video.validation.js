const { body } = require('express-validator');

module.exports = {
    createVideo: [
        body('title')
          .notEmpty().withMessage('Title is required')
          .isString().withMessage('Title must be a string'),
      
        body('videoFileUrl')
          .isArray().withMessage('Video file URL must be an array')
          .notEmpty().withMessage('Video file URL array cannot be empty')
          .custom((value) => value.every(url => typeof url === 'string' && url.trim() !== ''))
          .withMessage('All video file URLs must be non-empty strings'),
      
        body('videoData')
          .notEmpty().withMessage('Video data is required')
          .isObject().withMessage('Video data must be a JSON object'),
      
        body('videoSelectedFile')
          .notEmpty().withMessage('Selected video file is required')
          .isObject().withMessage('Selected video file must be a JSON object'),
      
        body('videoLength')
          .notEmpty().withMessage('Video length is required')
          .isInt({ min: 0 }).withMessage('Video length must be a non-negative integer'),
      
        body('isShared')
          .optional()
          .isBoolean().withMessage('isShared must be a boolean'),
      
        body('isDeleted')
          .optional()
          .isBoolean().withMessage('isDeleted must be a boolean'),
      
        body('createdBy')
          .notEmpty().withMessage('Creator ID is required')
          .isUUID(1).withMessage('Creator ID must be a valid UUID v1')
    ]
}