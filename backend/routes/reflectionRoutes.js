const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getReflections,
  createReflection,
  updateReflection,
  deleteReflection
} =
  require("../controllers/reflectionController");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  getReflections
);

router.post(
  "/",
  createReflection
);

router.put(
  "/:id",
  updateReflection
);

router.delete(
  "/:id",
  deleteReflection
);

module.exports = router;