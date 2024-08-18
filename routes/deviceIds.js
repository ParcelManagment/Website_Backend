const express = require("express");
const router = express.Router();
const sequelize = require("../database/connectSequelize");


router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    //fetch tracking_device_id for given userId(sender ,receiver)
    const [results] = await sequelize.query(
      `SELECT tracking_device_id FROM package WHERE sender_id = ? OR receiver_id = ?`,
      {
        replacements: [userId, userId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Extract tracking_device_ids
    const deviceIds = results.map((row) => row.tracking_device_id);

    if (deviceIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No devices found for this user" });
    }

    res.status(200).json({ deviceIds });
  } catch (error) {
    console.error("Error fetching device IDs", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});

module.exports = router;
