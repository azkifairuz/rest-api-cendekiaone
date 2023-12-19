const router = require("express").Router();
const postController = require("../controller/postController.js");
const saveController = require("../controller/saveController.js");
const multer = require('multer');
// Multer configuration for handling file uploads
const multerStorage = multer.memoryStorage();
const multerUpload = multer({ storage: multerStorage });

router.get("/posts", postController.getAllPost);
router.get("/post/:detail", postController.getPostById);
router.post("/post", multerUpload.single('postImage'), postController.posted);
router.post("/like", postController.likePost);
router.get("/likes/:id", postController.getLikedUsers);
router.post("/comment", postController.commentPost);
router.get("/comments/:id", postController.getCommentedUser)
router.delete("/post/:id", postController.deletePost);
router.get("/save/:id")
router.post("/saved",saveController.savePost)

module.exports = router;