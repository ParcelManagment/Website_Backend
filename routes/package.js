const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const Package = require("../models/package");
const validateNewPackage = require('../util/validation/package/input');
const findParticipant = require("../util/validation/participant/findParticipant");
const isStaff = require('../util/auth/staffAuth');

// MySQL Connection
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
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
            user_nr u
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



module.exports = router;




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

// New route for deleting a package by ID
// New route for deleting a package by ID
router.delete('/deletepackage/:id', async (req, res) => {
    const packageId = req.params.id;

    try {
        // Begin transaction
        con.beginTransaction(async (err) => {
            if (err) {
                console.error('Transaction Error:', err);
                res.status(500).json({ Error: "Database Transaction Error" });
                return;
            }

            // Delete related data from trackingdevice
            con.query('DELETE FROM trackingdevice WHERE package_id = ?', [packageId], (err, result) => {
                if (err) {
                    console.error('Error deleting from trackingdevice:', err);
                    return con.rollback(() => {
                        res.status(500).json({ Error: "Error deleting tracking data" });
                    });
                }

                // Delete the package itself
                con.query('DELETE FROM package WHERE package_id = ?', [packageId], (err, result) => {
                    if (err) {
                        console.error('Error deleting package:', err);
                        return con.rollback(() => {
                            res.status(500).json({ Error: "Error deleting package" });
                        });
                    }

                    // If no errors, commit the transaction
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


router.put('/edituser/:id', async (req, res) => {
    const packageId = req.params.id;
    const {  receiver_first_name, receiver_last_name, receiver_email, receiver_mobile_number } = req.body;

    let updates = [];
    let values = [];

    // Check if receiver-related fields are provided and add them to the update list
    if (receiver_first_name) {
        updates.push("first_name = ?");
        values.push(receiver_first_name);
    }

    if (receiver_last_name) {
        updates.push("last_name = ?");
        values.push(receiver_last_name);
    }

    if (receiver_email) {
        updates.push("email = ?");
        values.push(receiver_email);
    }

    if (receiver_mobile_number) {
        updates.push("mobile_number = ?");
        values.push(receiver_mobile_number);
    }

    // If no fields are provided, return an error
    if (updates.length === 0) {
        return res.status(400).json({ message: "Provide at least one field to update." });
    }

    values.push(packageId);
    //const con = await getConnection();
    const updateQuery = `UPDATE user_nr SET ${updates.join(', ')} WHERE id = (SELECT receiver_id FROM package WHERE package_id = ?)`;
    try {
       
        //const sql = `UPDATE user_nr SET ${updates.join(', ')} WHERE id = ?`;

        con.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).json({ message: "Database error", error: err });
            }

            res.status(200).json({ message: "Reciver updated successfully" });
        });

    } catch (error) {
        console.error("Error getting database connection:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
