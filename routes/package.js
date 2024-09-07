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

        const newPackage = await Package.create({
            tag_id: packageData.tag_id,
            package_id: newID,
            type: packageData.type,
            package_condition: packageData.package_condition,
            destination: packageData.destination,
            price: packageData.price,
            tracking_device_id: packageData.tracking_device_id,
            sender_id: sender.sender_id,
            sender_type: sender.sender_type,
            receiver_id: receiver.receiver_id,
            receiver_type: receiver.receiver_type,
            submitted_by: emp_id
        }, { transaction: t });

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

// New route for fetching by ID
// Fetch package by ID using Sequelize
router.get('/fetchbyid/:id', async (req, res) => {
    const fetchid = req.params.id;
    
    try {
        // Fetch package details, including sender_id and receiver_id
        const packageResult = await Package.findOne({
            where: { package_id: fetchid },
            attributes: ['type', 'package_condition', 'destination', 'sender_id', 'receiver_id']  // Include sender_id and receiver_id
        });
        
        if (!packageResult) {
            return res.status(404).json({ message: 'Package not found' });
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
  


// Route for tracking
router.get('/tracking', async (req, res) => {
    try {
      // Fetch all tracking devices
      const trackingDevices = await TrackingDevice.findAll();
  
      // Send the result as the response
      res.status(200).json(trackingDevices);
    } catch (err) {
      console.error('Error fetching tracking devices:', err);
      res.status(500).json({ message: 'Error fetching tracking devices', error: err });
    }
  });

// Route for deleting a package by ID
router.delete('/deletepackage/:id', async (req, res) => {
    const packageId = req.params.id;
    const con = getConnection();

    try {
        con.beginTransaction(async (err) => {
            if (err) {
                console.error('Transaction Error:', err);
                res.status(500).json({ Error: "Database Transaction Error" });
                return;
            }

            con.query('DELETE FROM trackingdevice WHERE package_id = ?', [packageId], (err) => {
                if (err) {
                    console.error('Error deleting from trackingdevice:', err);
                    return con.rollback(() => {
                        res.status(500).json({ Error: "Error deleting tracking data" });
                    });
                }

                con.query('DELETE FROM package WHERE package_id = ?', [packageId], (err) => {
                    if (err) {
                        console.error('Error deleting package:', err);
                        return con.rollback(() => {
                            res.status(500).json({ Error: "Error deleting package" });
                        });
                    }

                    con.commit((err) => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return con.rollback(() => {
                                res.status(500).json({ Error: "Transaction Commit Error" });
                            });
                        }
                        res.status(200).json({ message: 'Package and associated data deleted successfully' });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Unexpected Error deleting package:', error);
        res.status(500).json({ message: 'Unexpected Database Error', error });
    }
});

// Route for editing user by package receiver ID
router.put('/edituser/:id', async (req, res) => {
    const packageId = req.params.id;
    const { receiver_first_name, receiver_last_name, receiver_email, receiver_mobile_number } = req.body;
  
    let updates = {};
  
    if (receiver_first_name) updates.first_name = receiver_first_name;
    if (receiver_last_name) updates.last_name = receiver_last_name;
    if (receiver_email) updates.email = receiver_email;
    if (receiver_mobile_number) updates.mobile_number = receiver_mobile_number;
  
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least one field to update." });
    }
  
    try {
      // Find the receiver's user ID from the package
      const packageData = await Package.findOne({ where: { package_id: packageId } });
  
      if (!packageData) {
        return res.status(404).json({ message: "Package not found." });
      }
  
      // Update the user's details
      await User.update(updates, { where: { id: packageData.receiver_id } });
  
      res.status(200).json({ message: "Receiver updated successfully" });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Database error", error: err });
    }
  });

module.exports = router;
