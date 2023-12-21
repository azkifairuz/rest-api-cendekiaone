const router = require("express").Router();
const userController = require("../controller/userController.js");
const multer = require('multer');
// Multer configuration for handling file uploads
const multerStorage = multer.memoryStorage();
const multerUpload = multer({ storage: multerStorage });

router.get("/users", userController.getUser);
router.get("/myprofile/:id", userController.myProfile);
router.get("/user/:id/:userId", userController.getUserById);
router.post("/update-profile", multerUpload.single('profileImage'), userController.updateUser);
router.post("/follow", userController.follow);
router.get("/followers/:id", userController.getFollowers);
router.get("/followings/:id", userController.getFollowing);
router.get("/search",userController.searchUser) 

module.exports = router;  