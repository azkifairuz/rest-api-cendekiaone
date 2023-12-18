const { post, user, likes, comments, sequelize } = require("../models");
const {
  responseMessage,
  responseData,
  responseWithPagination,
} = require("../utils/responseHandle");

async function savePost(req, res) {
  const { id_post } = req.body;

  try {
    if (!id_post) {
      responseMessage(res, 400, "user not found", "true");
    }
    post.update({
      saved: true,
    });
  } catch (error) {}
}
