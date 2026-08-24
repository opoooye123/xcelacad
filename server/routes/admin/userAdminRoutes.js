const express = require("express");

const {
  getUsersAdmin,
  getUserAdminById,
  setUserRole,
  setUserBlocked,
} = require("../../controllers/userController");

const router = express.Router();

router.get("/", getUsersAdmin);
router.get("/:id", getUserAdminById);
router.patch("/:id/role", setUserRole);
router.patch("/:id/block", setUserBlocked);

module.exports = router;
