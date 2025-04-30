const { Router } = require("express");
const multer = require('multer');
const { analyse } = require("../complaint/analyse");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = new Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(async (req, res) => {
  console.log("GET / called");
  res.status(200).json({ msg: "Hi I am working" });
}));

router.post('/analyse', upload.single('image'), asyncHandler(async (req, res) => {
  analyse(req,res)
}));

module.exports = { router };
