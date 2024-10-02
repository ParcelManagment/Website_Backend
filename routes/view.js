const express = require('express');
const router = express.Router();
const Package = require("../models/package");
const User = require("../models/user");

router.get("/", async (req, res) => {
    try {
        // Fetch details by joining tables and including the completed status
        const packageDetails = await Package.findAll({
            attributes: ["package_id", "destination", "completed", "price"],  
            include: [
                {
                    model: User,
                    as: "senderUser",
                    attributes: ["first_name", "last_name"],
                }
            ]
        });

        // Check if the package is found
        if (!packageDetails || packageDetails.length === 0) {
            return res.status(404).json({ message: "No packages found" });
        }

        // Send package details and sender details as response
        res.status(200).json(packageDetails);

    } catch (error) {
        console.error("Error fetching package details:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});


module.exports = router;
