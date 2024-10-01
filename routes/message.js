const express = require("express");
const router = express.Router();
const sequelize = require("../database/connectSequelize");
const isStaff = require("../util/auth/staffAuth");


//add message to database

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
router.get("/custom", async (req, res, next) => {
  try {
    const {trackingId} = req.body;

    //for debugging purposes
    console.log("Received custom message request:", {
      trackingId,
    });

     const response = await fetch(
       "https://parcelmanagement.netlify.app/model/chat",
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         //custom message chage in the ML server.get from ML cutomMessage
         body: JSON.stringify({
           customMessage,
         }),
       }
     );
    
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


// Route to handle incoming requests
router.get("/track", async (req, res) => {
  console.log("Received request with query:", req.query); // Debugging

  const trackingId = req.query.trackingId; // Assuming the query parameter is called "userID"

  if (!trackingId) {
    // Handle case where userID is not provided
    return res.status(400).json({
      error: "userID is missing from the request",
    });
  }
const packageId = 'your_package_id';  // You will replace this with the actual package_id

const result = await sequelize.query(`
  SELECT 
    p.package_id,
    td.Longitude,
    td.Latitude,
    td.Last_update
  FROM 
    package p
  JOIN 
    trackingDevice td
  ON 
    p.tracking_device_id = td.device_id
  WHERE 
    p.package_id = :packageId
  ORDER BY 
    td.Last_update DESC
  LIMIT 1;
`, {
    replacements: { packageId },  // Passing the packageId as a parameter to avoid SQL injection
    type: sequelize.QueryTypes.SELECT // Specify query type for SELECT queries
});

// Access Longitude and Latitude from the result
if (result.length > 0) {
  const { Longitude, Latitude } = result[0];
  console.log('Longitude:', Longitude);
  console.log('Latitude:', Latitude);
} else {
  console.log('No data found for the given package_id.');
}
    res.status(200).json({
      location: `${Longitude},${Latitude}`,
    });
  });



module.exports = router;
