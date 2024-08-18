const express = require("express");
const router = express.Router();
const sequelize = require("../database/connectSequelize");
const isStaff = require("../util/auth/staffAuth");

// Route to handle sending a hello message
router.get("/hello", async (req, res, next) => {
  try {

    const message = "Hello message";


    res.status(200).json({ message });
  } catch (error) {
    console.error("Error sending hello message", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});

router.get("/default", async (req, res, next) => {
  try {
    const message = "Hello message";

    res.status(200).json({ message });
  } catch (error) {
    console.error("Error sending hello message", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});
router.post("/custom", async (req, res, next) => {
  try {
    const { customMessage,uId,deviceId,dateTime } = req.body;

    if (!customMessage) {
      return res.status(400).json({ Error: "No custom message provided" });
    }
    res.status(200).json({
      customMessage,
      uId,
      deviceId,
      dateTime,
    });
  } catch (error) {
    console.error("Error sending custom message", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});

module.exports = router;
