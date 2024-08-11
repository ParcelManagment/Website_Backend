const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const Package = require("../models/package");
const validateNewPackage = require('../util/validation/package/input');
const findParticipant = require("../util/validation/participant/findParticipant");
const isStaff = require('../util/auth/staffAuth');

// MySQL Connection
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: null,
    database: "parcel"
});

con.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("CONNECTED!");
    }
});

// Existing route for creating a new package
router.post('/new', isStaff, validateNewPackage, findParticipant, async (req, res, next) => {
    const t = req.transaction;
    try {
        const packageData = req.body.package;
        const sender = req.body.sender;
        const receiver = req.body.receiver;
        const emp_id = req.staff_id;

        const newPackage = await Package.create({
            tag_id: packageData.tag_id,
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
        res.status(201).send("Package Inserted");
        console.log('Inserted Package:');
    } catch (error) {
        console.error('Error inserting newParcel', error);
        t.rollback();
        res.status(500).json({ Error: "Something went wrong" });
    }
});

// New route for fetching by ID
router.get('/fetchbyid/:id', (req, res) => {
    const fetchid = req.params.id;
    
    // First query to get the package details
    const packageQuery = `
        SELECT 
            type, 
            package_condition, 
            destination 
        FROM 
            package 
        WHERE 
            package_id = ?
    `;
    
    // Second query to get the sender details
    const senderQuery = `
        SELECT 
            u.first_name AS sender_first_name, 
            u.last_name AS sender_last_name, 
            u.email AS sender_email, 
            u.mobile_number AS sender_mobile_number
        FROM 
            user u
        JOIN 
            package p ON u.id = p.sender_id
        WHERE 
            p.package_id = ?
    `;
    
    // Third query to get the receiver details
    const receiverQuery = `
        SELECT 
            u.first_name AS receiver_first_name, 
            u.last_name AS receiver_last_name, 
            u.email AS receiver_email, 
            u.mobile_number AS receiver_mobile_number
        FROM 
            user u
        JOIN 
            package p ON u.id = p.receiver_id
        WHERE 
            p.package_id = ?
    `;
    
    // Execute the first query (package details)
    con.query(packageQuery, [fetchid], (err, packageResult) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);  // Send error response if there is an error
        } else {
            // Execute the second query (sender details)
            con.query(senderQuery, [fetchid], (err, senderResult) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);  // Send error response if there is an error
                } else {
                    // Execute the third query (receiver details)
                    con.query(receiverQuery, [fetchid], (err, receiverResult) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send(err);  // Send error response if there is an error
                        } else {
                            // Combine all results into a single object
                            const response = {
                                package: packageResult[0],  // Assuming packageResult is an array with one object
                                sender: senderResult[0],    // Assuming senderResult is an array with one object
                                receiver: receiverResult[0] // Assuming receiverResult is an array with one object
                            };
                            res.send(response);
                        }
                    });
                }
            });
        }
    });
});



// New route for tracking
router.get('/tracking', (req, res) => {
    con.query("SELECT * FROM trackingdevice", (err, result, fields) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);  // Send error response if there is an error
        } else {
            res.send(result);
        }
    });
});

module.exports = router;
