const {S3Client , PutObjectCommand , DeleteObjectsCommand} = require("@aws-sdk/client-s3")
const fs = require("fs")

const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY
    }
})

const uploadFileToS3 = async (localFilePath) => {

    if(!localFilePath){
        return null
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: localFilePath,
    });

    try {
        const response = await client.send(command)
        //File has been uploded Successdully
        console.log("File Uploded Successufully", response)
        // Before returning unlink the file from local server
        fs.unlinkSync(localFilePath)

        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
};

const deleteObjectsFromS3 = async (objectsToDelete) => {

    const command = new DeleteObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete.map(obj => ({ Key: obj })),
      },
    });
  
    try {
      const { Deleted } = await client.send(command);
      
      // File has been successfully deleted from aws s3 cloud
      console.log(`Successfully deleted ${Deleted.length} objects from S3 bucket.`);
      
      console.log("Deleted objects:");
      Deleted.forEach(deletedObj => console.log(` • ${deletedObj.Key}`));
      
      return Deleted;
    } catch (error) {
        return null
    }
};

module.exports = {
    uploadFileToS3,
    deleteObjectsFromS3
}
  