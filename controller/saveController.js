const { post, user, saved, likes, comments, sequelize } = require("../models");
const {
  responseMessage,
  responseData,
  responseWithPagination,
} = require("../utils/responseHandle");

async function savePost(req, res) {
  const { id_post, saved_by } = req.body;

  try {
    if (!id_post) {
      return responseMessage(res, 404, "post_not_found", "true");
    }
    if (!saved_by) {
      return responseMessage(res, 404, "must login first", "true");
    }
    const isAlreadySave = await saved.findOne({
      where: [{ id_posts: id_post }, { saved_by_user: saved_by }],
    });
    if (isAlreadySave) {
      await saved.destroy({
        where:[{ id_post: id_post},{saved_by_user: saved_by}]
      });
      return responseMessage(res, 400, "post unsaved");
    }
    const returnSave = saved.create({
      id_posts: id_post,
      saved_by_user: saved_by,
    });

    if (!returnSave) {
      return responseMessage(res, 400, "failed post");
    }

    return responseMessage(res, 200, "post saved");
  } catch (error) {
    return responseMessage(res, 500, `${error}`);
  }
}

async function getSavePost(req, res) {
  const page = req.query.page || 1;
  const { savedBy } = req.params;
  const pageSize = 10;
  try {
    const { count, rows: savedPosts } = await saved.findAndCountAll({
      include: [
        {
          model: user,
          attributes: [["id", "idUser"], "username", "profile_picture"],
          as: "savedByUser",
        },
        {
          model: post,
          attributes: [
            "id",
            "post_title",
            "post_body",
            ["id_user", "createdBy"],
            "image_url",
            "categories",
            "sub_categories",
            "createdAt",
          ],
          as: "savedPost",
          include: [
            {
              model: user,
              attributes: ["id", "username"],
              as: "createdByUser",
            },
          ],
        },
      ],
      where: {
        saved_by_user: savedBy,
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const totalPages = Math.ceil(count / pageSize);
    const postIds = savedPosts.map((postingan) => {
      if (postingan.savedPost && postingan.savedPost.id) {
        return postingan.savedPost.id;
      } else {
        return null; // or any default value you prefer
      }
    });
    
    // Filter out null values from postIds
    const validPostIds = postIds.filter((postId) => postId !== null);
    
    const likesCount = await likes.findAll({
      attributes: [
        "id_post",
        [
          sequelize.fn("COUNT", sequelize.literal("DISTINCT liked_by_user")),
          "likeCount",
        ],
      ],
      where: {
        id_post: validPostIds, // Use the filtered postIds
      },
      group: ["id_post"],
    });

    const commentCount = await comments.count({
      where: {
        id_post: validPostIds,
      },
    });

    const likesMap = {};

    likesCount.forEach((like) => {
      likesMap[like.id_post] = like.dataValues.likeCount;
    });

    const formattedPostings = savedPosts
    .filter((postingan) => postingan.savedPost && postingan.savedPost.id !== null)
    .map((postingan) => {
      const idPost = postingan.savedPost.id ;
      return {
        idPost: idPost,
        createBy: postingan.savedPost.createdByUser.username,
        createById: postingan.savedPost.createdByUser.id,
        savedBy: postingan.savedByUser.username,
        postPicture: postingan.savedPost.image_url,
        postTitle: postingan.savedPost.post_title,
        postBody: postingan.savedPost.post_body,
        category: postingan.savedPost.categories,
        subCatergory: postingan.savedPost.sub_categories,
        likes: likesMap[idPost] || 0,
        comment: commentCount || 0,
        createdAt: postingan.savedPost.createdAt,
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
      paginationInfo,
      "Success"
    );
  } catch (error) {
    responseMessage(res, 500, `Internal server error ${error}`);
  }
}

async function deleteSavePost(req, res) {
  const { id } = req.params;
  try {
    const deleteReturn = await saved.destroy({
      where: {
        id: id,
      },
    });
    if (!deleteReturn) {
      responseMessage(res, 404, "saved post not found", false);
    }
    responseMessage(res, 200, "delete post success", false);
  } catch (error) {
    responseMessage(res, 200, `${error}`, true);
  }
}

module.exports = {
  savePost,
  getSavePost,
  deleteSavePost,
};
