const { user, auth } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { responseMessage, responseData } = require("../utils/responseHandle");

async function register(req, res) {
  try {
    const { name, username, email, password } = req.body;

    const existingEmail = await auth.findOne({ where: { email: email } });
    
    if (existingEmail) {
      return responseMessage(res, 400, "Email already exists", "false");
    }

    const existingUsername = await user.findOne({
      where: { username: username },
    });
    if (existingUsername) {
      return responseMessage(res, 400, "Username already exists", "false");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await user.create({ name: name, username: username });
    await auth.create({
      email: email,
      password: passwordHash,
      id_user: newUser.id,
    });

    responseMessage(res, 201, `register success`, false);
  } catch (error) {
    responseMessage(res, 404, `failed get user ${error}`, true);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const account = await auth.findOne({ where: { email } });
    const profile = await user.findOne({ where: { id: account.id_user } });

    if (!account) {
      return responseMessage(res, 401, "email not registered");
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);

    if (!isPasswordValid) {
      return responseMessage(res, 401, "Invalid password");
    }

    const token = jwt.sign(
      { userId: account.id },
      "a40a47053167cb92bcb9b46ceff99ae2b734f758fbd565b1d70fb73ca2c16458",
      { expiresIn: "360d" }
    );
    await auth.update({ token }, { where: { id: account.id } });

    responseData(
      res,
      200,
      {
        token: token,
        id_user: account.id_user,
        username: profile.username,
      },
      "Login successful"
    );
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, "Internal server error");
  }
}

async function changePassword(req, res) {
  try {
    const { id_user, currentPassword, newPassword } = req.body;

    const account = await auth.findOne({ where: { id_user } });

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      account.password
    );
    if (!isPasswordValid) {
      return responseMessage(res, 401, "Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await auth.update({ password: newPasswordHash }, { where: { id_user } });

    responseMessage(res, 200, "Password updated successfully", false);
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, "Internal server error");
  }
}

async function deleteAkun(req, res) {
  try {
    const { id_user } = req.body;

    await auth.destroy({ where: { id_user } });

    await user.destroy({ where: { id: id_user } });

    responseMessage(res, 200, "Account deleted successfully", false);
  } catch (error) {
    console.error(error);
    responseMessage(res, 500, "Internal server error");
  }
}
module.exports = {
  login,
  register,
  deleteAkun,
  changePassword,
};
