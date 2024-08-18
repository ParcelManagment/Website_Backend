const express = require("express");
const router = express.Router();
const sequelize = require("../database/connectSequelize");

// Route to fetch the latest longitude, latitude, and last_update for a specific device ID
router.get("/device/:deviceId", async (req, res, next) => {
  const { deviceId } = req.params;

  try {
    // latest longitude, latitude, and last_update for given deviceId
    const [results] = await sequelize.query(
      `SELECT Longitude, Latitude, Last_update 
       FROM trackingdevice 
       WHERE device_id = ? 
       ORDER BY Last_update DESC 
       LIMIT 1`,
      {
        replacements: [deviceId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!results) {
      return res.status(404).json({ message: "Device not found" });
    }

    const { Longitude, Latitude, Last_update } = results;

    res.status(200).json({
      deviceId,
      Longitude,
      Latitude,
      Last_update,
    });
  } catch (error) {
    console.error("Error fetching device data", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});

module.exports = router;
