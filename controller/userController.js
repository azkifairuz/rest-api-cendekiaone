const { user } = require("../models");
const { responseMessage, responseData } = require("../utils/responseHandle");
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'your-project-id',
  keyFilename: 'path/to/your/keyfile.json', 
});

// Create a bucket reference
const bucket = storage.bucket('your-bucket-name');


async function getUser(req, res) {
  try {
    const data = await user.findAll();
    responseData(res, 200, data, "success");
  } catch (error) {
    responseMessage(res, 404, `failed get user ${error}`);
  }
}


async function getUserById(req, res) {
  try {
    const {id_user} = req.body
    console.log(id_user);
    const data = await user.findOne({ where: { id:id_user } })
    if (!data) {
      return responseMessage(res,404,`user not found`)
    }
    responseData(res, 200, data, "success");
  } catch (error) {
    responseMessage(res, 404, `failed get user ${error}`);
  }
}

async function updateUser(req, res) {
  try {
    const { id_user, name, username, bio } = req.body;

    // Check if a file was uploaded
    if (!req.file) {
        await user.update({ name, username, bio }, { where: { id:id_user } });
        responseMessage(res, 200, 'User updated successfully', false);
    } else {
      // File uploaded
      const file = req.file;
      const fileName = `${Date.now()}_${file.originalname}`;

      // Create a writable stream to upload the file to Google Cloud Storage
      const fileStream = bucket.file(fileName).createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      fileStream.on('error', (err) => {
        console.error(err);
        responseMessage(res, 500, 'Failed to upload profile image', true);
      });

      fileStream.on('finish', async () => {
        const profil_url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Update user with the new profile URL
        await user.update({ name, username, bio, profil_url }, { where: { id:id_user } });

        responseMessage(res, 200, 'User updated successfully', false);
      });

      // Pipe the file buffer into the stream
      fileStream.end(file.buffer);
    }
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, 'Internal server error', true);
  }
}



module.exports = {
  getUser,
  updateUser,
  getUserById,
};
