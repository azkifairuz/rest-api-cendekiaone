const { post, user, likes, comments, sequelize } = require("../models");
const { responseMessage, responseData, responseWithPagination } = require("../utils/responseHandle");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  keyFilename: path.join(
    __dirname,
    "../config/usman-project-404306-f6a7db49c320.json"
  ),
  projectId: "usman-project-404306",
});

const bucket = storage.bucket("cendikiaone");

async function posted(req, res) {
  try {
    const { post_title, post_body, id_user, categories, sub_categories } =
      req.body;

    if (!id_user) {
      return responseMessage(res, 201, "Cannot create post before login", true);
    }
    // if (!req.file) {
    //   const postReturn = await post.create({
    //     post_title,
    //     post_body,
    //     id_user,
    //     image_url,
    //     categories,
    //     sub_categories,
    //   });

    //   const createdPost = await post.findByPk(postReturn.id, {
    //     include: [
    //       {
    //         model: user,
    //         attributes: ["username"],
    //         as: "createdByUser",
    //       },
    //     ],
    //   });

    //   const formattedResponse = {
    //     status: "Post Created",
    //     data: {
    //       idPost: createdPost.id,
    //       createBy: createdPost.createdByUser.username,
    //       postPicture: createdPost.image_url,
    //       description: createdPost.post_body,
    //       category: createdPost.categories,
    //       subCatergory: createdPost.sub_categories,
    //       likes: 0,
    //       comments: 0,
    //       following: false,
    //       saved: false,
    //       summary: false,
    //       createdAt: createdPost.createdAt,
    //     },
    //   };
    //   return responseMessage(res, 201, formattedResponse, false);
    // }

    const image = req.file;
    const imageName = `${Date.now()}_${image.originalname}`;

    const fileStream = bucket.file(imageName).createWriteStream({
      metadata: {
        contentType: image.mimetype,
      },
    });

    fileStream.on("error", (err) => {
      console.error(err);
      responseMessage(res, 500, "Failed to upload  image", true);
    });

    fileStream.on("finish", async () => {
      const image_url = `https://storage.googleapis.com/${bucket.name}/${imageName}`;

      const postReturn = await post.create({
        post_title,
        post_body,
        id_user,
        image_url,
        categories,
        sub_categories,
      });

      const createdPost = await post.findByPk(postReturn.id, {
        include: [
          {
            model: user,
            attributes: ["username"],
            as: "createdByUser",
          },
        ],
      });

      const formattedResponse = {
        status: "Post Created",
        data: {
          idPost: createdPost.id,
          createBy: createdPost.createdByUser.username,
          postPicture: createdPost.image_url,
          description: createdPost.post_body,
          category: createdPost.categories,
          subCatergory: createdPost.sub_categories,
          likes: 0,
          comments: 0,
          following: false,
          saved: false,
          summary: false,
          createdAt: createdPost.createdAt,
        },
      };

     responseMessage(res, 201, formattedResponse, false);
    });
    fileStream.end(image.buffer);
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, "Internal server error");
  }
}

async function getAllPost(req, res) {
  const page = req.query.page || 1;
  const pageSize = 10;
  try {
    const { count, rows: postingans } = await post.findAndCountAll({
      include: [
        {
          model: user,
          attributes: ["name", "username", "profile_picture"],
          as: "createdByUser",
        },
      ],
      attributes: {
        exclude: ["id_user"],
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const totalPages = Math.ceil(count / pageSize);

    const postIds = postingans.map((postingan) => postingan.id);

    const likesCount = await likes.findAll({
      attributes: [
        "id_post",
        [
          sequelize.fn("COUNT", sequelize.literal("DISTINCT liked_by_user")),
          "likeCount",
        ],
      ],
      where: {
        id_post: postIds,
      },
      group: ["id_post"],
    });

    const commentCount = await comments.count({
      where: {
        id_post: postIds,
      },
    });

    const likesMap = {};

    likesCount.forEach((like) => {
      likesMap[like.id_post] = like.dataValues.likeCount;
    });

    const formattedPostings = postingans.map((postingan) => {
      const idPost = postingan.id;
      return {
        idPost,
        createBy: postingan.createdByUser.username,
        postPicture: postingan.image_url,
        body: postingan.post_body,
        category: postingan.categories,
        subCatergory: postingan.sub_categories,
        likes: likesMap[idPost] || 0,
        comment: commentCount || 0,
        following: postingan.following === "true",
        saved: postingan.saved === "true",
        summary: postingan.summary === "true",
        createdAt: postingan.created_at,
      };
    });

    const paginationInfo = {
      currentPage: page,
      totalPages: totalPages,
      totalPosts: count,
    };

    responseWithPagination(
      res,
      200,
      formattedPostings, 
      paginationInfo ,
      "Success"
    );
  } catch (error) {
    responseMessage(res, 500, `Internal server error ${error}`);
  }
}

async function getPostById(req, res) {
  try {
    const { detail } = req.params;
    const postingans = await post.findOne({
      include: [
        {
          model: user,
          attributes: ["name", "username", "profile_picture"],
          as: "createdByUser",
        },
      ],
      attributes: {
        exclude: ["id_user"],
      },
      where: { id: detail },
    });

    const likeCount = await likes.count({
      where: {
        id_post: detail,
      },
    });

    const commentCount = await comments.count({
      where: {
        id_post: detail,
      },
    });
    const formattedPostings = {
      idPost: postingans.id,
      createBy: postingans.createdByUser.username,
      postPicture: postingans.image_url,
      body: postingans.post_body,
      category: postingans.categories,
      subCatergory: postingans.sub_categories,
      likes: likeCount || 0,
      comments: commentCount || 0,
      following: postingans.following === "true",
      saved: postingans.saved === "true",
      summary: postingans.summary === "true",
      createdAt: postingans.created_at,
    };

    responseData(res, 200, formattedPostings, 0,"Success");
  } catch (error) {
    responseMessage(res, 500, `Internal server error${error}`);
  }
}

async function likePost(req, res) {
  const { post_id, liked_by } = req.body;

  try {
    const isAlreadyLike = await likes.findOne({
      where: [{ id_post: post_id }, { liked_by_user: liked_by }],
    });

    if (isAlreadyLike) {
      return responseMessage(res, 400, "already like this post");
    }

    await likes.create({
      id_post: post_id,
      liked_by_user: liked_by,
    });

    return responseMessage(res, 200, "successfully liked this post");
  } catch (error) {
    return responseMessage(res, 500, `${error}`);
  }
}

async function getLikedUsers(req, res){
    const { id } = req.params
    const page = req.query.page || 1;
    const pageSize = 10;
    try {
      const {count, rows: users } = await likes.findAndCountAll({
        include:[
          {
            model: user,
            attributes: ["username","profile_picture"],
            as: "likedByUser"
          }
        ],
        where:{
          id:id,
        },
        limit: pageSize,
        offset: (page - 1 ) * pageSize
      })

      const totalPages = Math.ceil(count / pageSize);

      const formattedLikes = users.map((likeBy) => {
        return {
          id:likeBy.id,
          username: likeBy.likedByUser.username,
          profilePicture: likeBy.likedByUser.profile_picture
        }
      })
      const paginationInfo = {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: count,
      };

      responseWithPagination(
        res,
        200,
        formattedLikes, 
        paginationInfo ,
        "Success"
      );
    } catch (error) {
      responseMessage(res, 200, `${error}`, true);
    }
}

async function commentPost(req, res) {
  const { post_id, comment_by, comment_body } = req.body;
  try {
    if (!post_id) {
      return responseMessage(res, 400, "post cannot be null");
    }

    const commentReturn = await comments.create({
      id_post: post_id,
      comment_by_user: comment_by,
      comment_body: comment_body,
    });

    if (!commentReturn) {
      return responseMessage(res, 500, "post not found");
    }

    const createdComment = await comments.findByPk(commentReturn.id, {
      include: [
        {
          model: user,
          attributes: ["username"],
          as: "commentByUser",
        },
      ],
    });

    return responseData(
      res,
      200,
      {
        username: createdComment.commentByUser.username,
        comments: createdComment.comment_body,
      },
      "success"
    );
  } catch (error) {
    return responseMessage(res, 500, `${error}`);
  }
}

async function getCommentedUser(req, res){
  const { id } = req.params
  const page = req.query.page || 1;
  const pageSize = 10;
  try {
    const {count, rows: users } = await comments.findAndCountAll({
      include:[
        {
          model: user,
          attributes: ["username","profile_picture"],
          as: "commentByUser"
        }
      ],
      where:{
        id:id,
      },
      limit: pageSize,
      offset: (page - 1 ) * pageSize
    })

    const totalPages = Math.ceil(count / pageSize);

    const formattedComments = users.map((comentBy) => {
      return {
        id:comentBy.id,
        username: comentBy.commentByUser.username,
        profilePicture: comentBy.commentByUser.profile_picture
      }
    })
    const paginationInfo = {
      currentPage: page,
      totalPages: totalPages,
      totalPosts: count,
    };

    responseWithPagination(
      res,
      200,
      formattedComments, 
      paginationInfo ,
      "Success"
    );
  } catch (error) {
    responseMessage(res, 200, `${error}`, true);
  }
}

async function deletePost(req, res) {
  const { id } = req.params;
  try {
    const deleteReturn = await post.destroy({
      where: {
        id: id,
      },
    });

    if (!deleteReturn) {
      responseMessage(res, 404, "post not found", false);
    }
    responseMessage(res, 200, "delete post success", false);
  } catch (error) {
    responseMessage(res, 200, `${error}`, true);
  }
}



module.exports = {
  posted,
  getAllPost,
  getPostById,
  likePost,
  commentPost,
  deletePost,
  getLikedUsers,
  getCommentedUser
};
