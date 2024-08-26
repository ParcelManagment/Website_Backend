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
    const { customMessage, uId, deviceId, dateTime } = req.body;

    //for debugging purposes
    console.log("Received custom message request:", {
      customMessage,
      uId,
      deviceId,
      dateTime,
    });

    // Check fields
    if (!customMessage) {
      return res.status(400).json({ Error: "No custom message provided" });
    }
    if (!uId) {
      return res.status(400).json({ Error: "No user ID provided" });
    }
    if (!deviceId) {
      return res.status(400).json({ Error: "No device ID provided" });
    }
    if (!dateTime) {
      return res.status(400).json({ Error: "No date/time provided" });
    }




     const response = await fetch("http://server-url/custom", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       //custom message chage in the ML server.get from ML cutomMessage
       body: JSON.stringify({
         customMessage
       }),
     });
    
    const data = await response.json();

if (!response.ok) {
  res.status(200).json({
    customMessage:"Error from ML server",
    uId,
    deviceId,
    dateTime,
  });
  console.error("Error:", data.Error);
} else {
  res.status(200).json({
    data,
    uId,
    deviceId,
    dateTime,
  });
  console.log("Message sent successfully:", data);
}


    
  } catch (error) {
    console.error("Error sending custom message", error);
    res.status(500).json({ Error: "Something went wrong" });
  }
});


module.exports = router;
