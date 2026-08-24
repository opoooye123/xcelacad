const express = require("express");

const {
  getSubjectCatalog,
  getSubjectDetail,
} = require("../controllers/catalogController");

const router = express.Router();

router.get("/subjects", getSubjectCatalog);
router.get("/subjects/:slug", getSubjectDetail);

module.exports = router;
