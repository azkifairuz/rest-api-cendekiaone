const { post, user,saved,sequelize } = require("../models");
const {
  responseMessage,
  responseData,
  responseWithPagination,
} = require("../utils/responseHandle");

async function savePost(req, res) {
  const { id_post,saved_by } = req.body;

  try {
    if (!id_post) {
      return responseMessage(res, 404, "post_not_found", "true");
    }
    if (!saved_by) {
      return responseMessage(res, 404, "must login first", "true");
    }
    const isAlreadySave = await saved.findOne({
      where:[{id_posts:id_post},{saved_by_user:saved_by}]
    })
    if (isAlreadySave) {
      return responseMessage(res,400,"post already save")
    }
    const returnSave = saved.create({
      id_posts: id_post,
      saved_by_user: saved_by
    });

    if (!returnSave) {
      return responseMessage(res,400,"failed post")
    }

    return responseMessage(res,200,"post saved")
  } catch (error) {
    return responseMessage(res,500,`${error}`)
  }
}

module.exports = {
  savePost,
}