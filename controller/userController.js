const { user, following, follower, sequelize, post } = require("../models");
const { responseMessage, responseData } = require("../utils/responseHandle");
const { Storage } = require("@google-cloud/storage");
const path = require('path')
// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname,'../config/usman-project-404306-f6a7db49c320.json'),
  projectId: "usman-project-404306",
});

const bucket = storage.bucket("cendikiaone");

async function getUser(req, res) {
  try {
    const data = await user.findAll();
    responseData(res, 200, data, "success");
  } catch (error) {
    responseMessage(res, 404, `failed get user ${error}`);
  }
}

async function profilePicture(req, res) {
  try {
    const { id } = req.params;

    const userResult = await user.findOne({ where: { id: id } });

    if (!userResult) {
      return responseMessage(res, 404, `user not found`);
    }

    const jumlahPost = await post.count({
      where: {
        id_user: id,
      },
    });

    const jumlahFollower = await follower.count({
      where: {
        account_owner: id,
      },
    });

    const jumlahFollowing = await following.count({
      where: {
        account_owner: id,
      },
    });

    const formattedData = {
      id: userResult.id,
      name:userResult.name,
      username:userResult.username,
      bio:userResult.bio,
      follower:jumlahFollower,
      following:jumlahFollowing,
      post:jumlahPost,
      profile_picture:userResult.profile_picture,
    }

    responseData(res, 200, formattedData, "success");
  } catch (error) {
    responseMessage(res, 404, `failed get user ${error}`);
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const userResult = await user.findOne({ where: { id: id } });

    if (!userResult) {
      return responseMessage(res, 404, `User not found`);
    }

    const jumlahPost = await post.count({
      where: {
        id_user: id,
      },
    });

    const jumlahFollower = await follower.count({
      where: {
        account_owner: id,
      },
    });

    const jumlahFollowing = await following.count({
      where: {
        account_owner: id,
      },
    });

    // Cek apakah pengguna saat ini mengikuti pengguna yang ditampilkan
    const isFollowedThisUser = await follower.findOne({
      where: {
        followers: req.params.userId,
        account_owner: id,
      },
    });

    const formattedData = {
      id: userResult.id,
      name: userResult.name,
      username: userResult.username,
      bio: userResult.bio,
      follower: jumlahFollower,
      following: jumlahFollowing,
      post: jumlahPost,
      profile_picture: userResult.profile_picture,
      isFollowedThisUser: Boolean(isFollowedThisUser), // Convert to boolean
    };

    responseData(res, 200, formattedData, "Success");
  } catch (error) {
    responseMessage(res, 500, `Failed to get user ${error}`);
  }
}


async function updateUser(req, res) {
  try {
    const { id_user, name, username, bio } = req.body;
    
    if (!id_user) {
      return responseMessage(res, 400, "user not found", false)
    }
    
    if (!req.file) {
      await user.update({ name, username, bio }, { where: { id: id_user } });
      responseMessage(res, 200, "User updated successfully", false);
    } else {
      
      const file = req.file;
      const fileName = `${Date.now()}_${file.originalname}`;

      const fileStream = bucket.file(fileName).createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      fileStream.on("error", (err) => {
        console.error(err);
        responseMessage(res, 500, "Failed to upload profile image", true);
      });

      fileStream.on("finish", async () => {
        const profil_url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        await user.update(
          { name:name, username:username, bio:bio, profile_picture:profil_url },
          { where: { id: id_user } }
        );

        responseMessage(res, 200, "User updated successfully", false);
      });

      fileStream.end(file.buffer);
    }
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, "Internal server error", true);
  }
}

async function follow(req, res) {
  try {
    const t = await sequelize.transaction();
    const { account_owner, followed_user } = req.body;
    if (!account_owner || !followed_user) {
      return responseMessage(res, 404, "user cannot empty");
    }

    const isAlreadyFollow = await following.findOne({
      where: [
        { following_user: followed_user },
        { account_owner: account_owner },
      ],
    });

    if (isAlreadyFollow) {
      await following.destroy({
        where:[{ following_user: followed_user},{ account_owner: account_owner}]
      },
      { transaction: t }
      );
      await follower.destroy({
        where:[{  followers: account_owner},{  account_owner: followed_user}]
      },
      { transaction: t }
      );
      return responseMessage(res, 400, " unfollow this user");
    }

    await following.create(
      {
        following_user: followed_user,
        account_owner: account_owner,
      },
      { transaction: t }
    );
    await follower.create(
      {
        followers: account_owner,
        account_owner: followed_user,
      },
      { transaction: t }
    );
    await t.commit();
    return responseMessage(res, 200, "successfully followed this user");
  } catch (error) {
    return responseMessage(res, 500, error);
  }
}

async function getFollowing(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return responseMessage(res, 400, "user cannot empty", true);
    }

    const followingList = await following.findAll({
      attributes: ["following_user", "account_owner"],
      include: [
        {
          model: user,
          as: "followingsDetails",
          attributes: ["id", "name", "username","profile_picture"],
        },
        {
          model: user,
          as: "accountOwner",
          attributes: ["name", "username"],
        },
      ],
      where: {
        account_owner: id,
      },
    });

    const data = followingList.map((item) => ({
      id_user: item.account_owner,
      following_id: item.following_user,
      following_name: item.followingsDetails.name,
      following_username: item.followingsDetails.username,
      profile_picture: item.followingsDetails.profile_picture,
      account_owner_name: item.accountOwner.name,
      account_owner_username: item.accountOwner.username,
    }));

    return responseData(res, 200, data, "Success");
  } catch (error) {
    console.error(error);
    return responseMessage(res, 500, `${error}`);
  }
}

async function getFollowers(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return responseMessage(res, 400, "user cannot empty", true);
    }
    const followersList = await follower.findAll({
      attributes: ["followers", "account_owner"],
      include: [
        {
          model: user,
          as: "followerDetails",
          attributes: ["id", "name", "username","profile_picture"],
        },
        {
          model: user,
          as: "accountOwner",
          attributes: ["name", "username"],
        },
      ],
      where: {
        account_owner: id,
      },
    });
    const data = followersList.map((item) => ({
      id_user: item.account_owner,
      following_id: item.followers,
      follower_name: item.followerDetails.name,
      profile_picture: item.followerDetails.profile_picture,
      follower_username: item.followerDetails.username,
      account_owner_name: item.accountOwner.name,
      account_owner_username: item.accountOwner.username,
    }));
    return responseData(res, 200, data, "Success");
  } catch (error) {
    console.error(error);
    return responseMessage(res, 500, "Internal server error");
  }
}

const { Op } = require("sequelize");

async function searchUser(req, res) {
  try {
    const { username } = req.query;

    const usersResult = await user.findAll({
      where: {
        username: {
          [Op.like]: `%${username}%`,
        },
      },
    });

    if (usersResult.length > 0) {
      return responseData(res, 200, usersResult, "Success");
    } 
    responseMessage(res, 404, "User not found");
  } catch (error) {
    console.error(error);
    return responseMessage(res, 500, "Internal server error");
  }
}

module.exports = {
  getUser,
  updateUser,
  profilePicture,
  getUserById,
  follow,
  getFollowers,
  getFollowing,
  searchUser,
};
