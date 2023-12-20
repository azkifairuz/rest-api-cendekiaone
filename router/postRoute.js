const router = require("express").Router();
const postController = require("../controller/postController.js");
const saveController = require("../controller/saveController.js");
const multer = require('multer');
// Multer configuration for handling file uploads
const multerStorage = multer.memoryStorage();
const multerUpload = multer({ storage: multerStorage });

router.get("/posts", postController.getAllPost);
router.get("/post/:detail", postController.getPostById);
router.get("/mypost/:userId", postController.getPostByidUser);
router.post("/post", multerUpload.single('postImage'), postController.posted);
router.post("/edit-post",postController.editPost);
router.get("/followed-post/:userId", postController.getFollowedPosts);
router.post("/like", postController.likePost);
router.get("/likes/:id", postController.getLikedUsers);
router.post("/comment", postController.commentPost);
router.get("/comments/:id", postController.getCommentedUser)
router.delete("/post/:id", postController.deletePost);
router.get("/save/:savedBy",saveController.getSavePost)
router.post("/saved",saveController.savePost)
router.delete("/save/:id",saveController.deleteSavePost)

module.exports = router;