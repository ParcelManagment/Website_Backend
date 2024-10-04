const express = require('express');
const router = express.Router();
const Package = require("../models/package");
const User = require("../models/user");
const validateNewPackage = require('../util/validation/package/input');
const findParticipant = require('../util/validation/participant/findParticipant');
const { isStaff } = require('../util/auth/staffAuth');
const sequelize = require('../database/connectSequelize');
const generateId = require('../util/IdGen/generateId');
const validateSender = require('../util/validation/participant/validateSender');
const validateReceiver = require('../util/validation/participant/validateReceiver');
const userValiadation = [validateSender, validateReceiver];
const { getConnection } = require('../database/database'); // Connection for raw MySQL queries
const { sendEmail } = require('../Email/mailConfig');

// Route for creating a new package
router.post('/new', isStaff, validateNewPackage, findParticipant, userValiadation, async (req, res, next) => {
    const t = req.transaction;
    try {
        const last_id = await sequelize.query(
            'SELECT package_id FROM package ORDER BY id DESC LIMIT 1',
            {
                transaction: t,
                lock: true,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const newID = generateId(last_id[0].package_id);
        const packageData = req.body.package;
        const sender = req.body.sender;
        const receiver = req.body.receiver;
        const emp_id = req.staff_id;
        const departure = req.station;
        

        const newPackage = await Package.create({
            tag_id: packageData.tag_id,
            package_id: newID,
            type: packageData.type,
            package_condition: packageData.package_condition,
            departure: departure,
            destination: packageData.destination,
            price: packageData.price,
            sender_id: sender.sender_id,
            sender_type: sender.sender_type,
            receiver_id: receiver.receiver_id,
            receiver_type: receiver.receiver_type,
            submitted_by: emp_id
        }, { transaction: t });
        
        sendEmail(sender.email, receiver.email, newID, packageData.type, packageData.destination)
        t.commit();
        res.status(201).json({ packageID: newID });
        console.log('Inserted Package:');

    } catch (error) {
        t.rollback();
        console.log("new Package insertion error:", error);

        const foreign_key_tracking_id = "package_ibfk_1";
        if (error.parent.errno === 1452 && error.index === foreign_key_tracking_id) {
            res.status(400).json({
                Error: [
                    {
                        "type": "field",
                        "value": req.body.package.tracking_device_id,
                        "msg": "Tracking device ID is not valid",
                        "path": "package.tracking_device_id",
                        "location": "body"
                    }
                ]
            });
            return;
        }

        if (error.parent.errno === 1062) {
            const key = Object.keys(error.fields);
            res.status(400).json({
                Error: [
                    {
                        "type": "field",
                        "value": key[0],
                        "msg": "Duplicate entry",
                        "path": error.fields.key,
                        "location": "body"
                    }
                ]
            });
            return;
        }

        res.status(500).json({ Error: "Something went wrong" });
        return;
    }
});


//route for fetching by ID
router.get('/fetchbyid/:id', async (req, res) => {
    const fetchid = req.params.id;
    
    try {
        // Fetch package details, including sender_id, receiver_id, cancelled status, and price
        const packageResult = await Package.findOne({
            where: { package_id: fetchid },
            attributes: ['type', 'package_condition', 'destination', 'sender_id', 'receiver_id', 'cancelled', 'price']  
        });
        
        if (!packageResult) {
            return res.status(404).json({ message: 'Package not found' });
        }

        // Check if the package is cancelled
        if (packageResult.cancelled) {
            return res.status(400).json({ message: 'This package has been cancelled and cannot be viewed.' });
        }

        // Fetch sender details
        const senderResult = await User.findOne({
            where: { id: packageResult.sender_id },
            attributes: ['first_name', 'last_name', 'email', 'mobile_number']
        });
  
        // Fetch receiver details
        const receiverResult = await User.findOne({
            where: { id: packageResult.receiver_id },
            attributes: ['first_name', 'last_name', 'email', 'mobile_number']
        });
  
        const response = {
            package: packageResult,
            sender: senderResult,
            receiver: receiverResult
        };
  
        res.status(200).json(response);
  
    } catch (error) {
        console.error('Error fetching package details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


  


//route to cancel a package
  router.delete("/deletepackage/:id", async (req, res) => {
    const packageId = req.params.id;

    try {
        // Start a transaction
        const transaction = await sequelize.transaction();

        try {
            // Fetch the package to check its current status
            const packageData = await Package.findOne({
                where: { package_id: packageId },
                transaction
            });

            // Check if package exists
            if (!packageData) {
                throw new Error("Package not found");
            }

            // Check if the package is already cancelled
            if (packageData.cancelled) {
                throw new Error("Package is already cancelled");
            }

            // Update the package to mark it as cancelled
            const packageUpdateResult = await Package.update(
                { cancelled: true },
                { where: { package_id: packageId }, transaction }
            );

            // Commit the transaction if the update is successful
            await transaction.commit();

            // Send success response
            res.status(200).json({ message: "Package cancelled successfully" });
        } catch (error) {
            // Rollback the transaction in case of an error
            await transaction.rollback();

            // Check if the error is related to package being already cancelled
            if (error.message === "Package is already cancelled") {
                return res.status(400).json({ message: "Package is already cancelled" });
            }

            // Handle other errors
            console.error("Error during deletion:", error);
            res.status(500).json({ message: "Error during deletion", error });
        }
    } catch (error) {
        // Handle unexpected errors (e.g., errors starting the transaction)
        console.error("Unexpected error:", error);
        res.status(500).json({ message: 'Unexpected database error', error });
    }
});


// Route for editing user by package receiver ID
router.put('/edituser/:id', async(req, res)=> {
    const userId = req.params.id;
    const { receiver_first_name, receiver_last_name, receiver_email, receiver_mobile_number } = req.body;

    let updates = {};

    //Collect updates if provided in request body
    if (receiver_first_name) updates.first_name = receiver_first_name;
    if (receiver_last_name) updates.last_name = receiver_last_name;
    if (receiver_email) updates.email = receiver_email;
    if (receiver_mobile_number) updates.mobile_number = receiver_mobile_number;

    //Check if any updates are provided
    if (Object.keys(updates).length === 0){
        return res.status(400).json({ message: "Provide at least one field to update"});

    }

    try {
        //Fetch the user by the provided user ID from the url
        const user = await User.findOne({ where: { id: userId }});

        if (!user) {
            return res.status(404).json({ message: "User not found"});
        }

        //Check if the user is not registered
        if (user.role !== 'user_nr') {
            return res.status(403).json({ message: "Cannot update details for registered users."});

        }
        //Check wheather the email already exists
        if (receiver_email){
            const existingEmailUser = await User.findOne({where: {email: receiver_email}});
            if (existingEmailUser && existingEmailUser.id !== userId){
                return res.status(400).json({message: "This email already exists"});
            }
        }

        //Update user details
        await User.update(updates, { where: { id: user.id }});

        res.status(200).json({ message: "User details updated successfully"});
    }

    catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Database error", error: err});
    }

    
});

//Route for mark the package as completed
router.put("/completepackage/:id", async (req, res) => {
    const packageId = req.params.id;

    try {
        console.log("Checking package status for ID:", packageId);

        // Fetch the current status of the package
        const packageResult = await Package.findOne({
            where: { package_id: packageId },
            attributes: ["completed"] // Fetch only the 'completed' status
        });

        if (!packageResult) {
            return res.status(404).json({ message: "Package not found" });
        }

        console.log("Package current status:", packageResult.completed);

        // Check if the package is already completed
        if (packageResult.completed === 1) {
            return res.status(400).json({ message: "Package is already marked as completed" });
        }

        // Proceed with updating the package to completed
        const [updatedRows] = await Package.update(
            { completed: 1 },
            { where: { package_id: packageId }, logging: console.log } // Log the SQL query
        );

        console.log("Rows updated:", updatedRows);

        if (updatedRows === 0) {
            return res.status(400).json({ message: "Failed to mark as completed" });
        }

        res.status(200).json({ message: "Package marked as completed!" });

    } catch (error) {
        console.error("Error during update operation:", error);
        res.status(500).json({ message: "Error marking package as completed", error });
    }
});




module.exports = router;
