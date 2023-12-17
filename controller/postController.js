const { post, user, likes, comments,sequelize } = require("../models");
const { responseMessage, responseData } = require("../utils/responseHandle");

async function posted(req, res) {
  try {
    const {
      post_title,
      post_body,
      id_user,
      image_url,
      categories,
      sub_categories,
    } = req.body;

    if (!id_user) {
      return responseMessage(res, 201, "Cannot create post before login", true);
    }

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

    // Format respons sesuai dengan kebutuhan
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
        following: false,
        saved: false,
        summary: false,
        createdAt: createdPost.createdAt,
      },
    };

    responseMessage(res, 201, formattedResponse, false);
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
        [sequelize.fn("COUNT", sequelize.literal("DISTINCT liked_by_user")), "likeCount"],
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
    // const commentMap = {};

    likesCount.forEach((like) => {
      likesMap[like.id_post] = like.dataValues.likeCount;
    });

    // commentCount.forEach((comment) => {
    //   commentMap[comment.id_post] = comment;
    // });

    const formattedPostings = postingans.map((postingan) => {
      const idPost = postingan.id;
      return {
        idPost,
        createBy: postingan.createdByUser.name,
        postPicture: postingan.image_url,
        description: postingan.body,
        category: postingan.categories,
        subCatergory: postingan.sub_categories,
        likes: likesMap[idPost] || 0, 
        comment: commentCount|| 0, 
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

    responseData(res, 200, { posts: formattedPostings, pagination: paginationInfo }, "Success");
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

    const formattedPostings = {
      idPost: postingans.id,
      createBy: postingans.createdByUser.name,
      postPicture: postingans.image_url,
      description: postingans.body,
      category: postingans.categories,
      subCatergory: postingans.sub_categories,
      likes: postingans.likes,
      following: postingans.following === "true",
      saved: postingans.saved === "true",
      summary: postingans.summary === "true",
      createdAt: postingans.created_at,
    };

    responseData(res, 200, formattedPostings, "Success");
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

async function commentPost(req, res) {
  const { post_id, comment_by, comment_body } = req.body;
  try {
    const commentReturn = await comments.create({
      id_post: post_id,
      comment_by_user:comment_by,
      comment_body:comment_body,
    });
    const createdComment = await comments.findByPk(commentReturn.id, {
      include: [
        {
          model: user,
          attributes: ["username"],
          as: "commentByUser",
        },
      ],
    });
    return responseData(res, 200, {
      username:createdComment.commentByUser.username,
      comments:createdComment.comment_body
    },"success");
  } catch (error) {
    return responseMessage(res, 500, `${error}`);
  }
}

module.exports = {
  posted,
  getAllPost,
  getPostById,
  likePost,
  commentPost,
};
