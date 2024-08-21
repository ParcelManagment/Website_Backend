const express = require('express');
const router = express.Router();
const Package = require("../models/package");
const validateNewPackage = require('../util/validation/package/input');
const findParticipant = require("../util/validation/participant/findParticipant");
const isStaff = require('../util/auth/staffAuth');
const sequelize = require('../database/connectSequelize');
const generateId = require('../util/IdGen/generateId');
const validateSender = require('../util/validation/participant/validateSender');
const validateReceiver = require('../util/validation/participant/validateReceiver');
const userValiadation = [validateSender,validateReceiver]


router.post('/new',isStaff, validateNewPackage, findParticipant, userValiadation,async (req, res, next) => {

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

    const newID = generateId(last_id[0].package_id)
    const packageData= req.body.package;
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const emp_id = req.staff_id;
    
    const newPackage = await Package.create({
        tag_id: packageData.tag_id,
        package_id : newID,
        type: packageData.type,
        package_condition: packageData.package_condition,
        destination: packageData.destination,
        price: packageData.price,
        tracking_device_id: packageData.tracking_device_id,
        sender_id: sender.sender_id, 
        sender_type: sender.sender_type,
        receiver_id: receiver.receiver_id,
        receiver_type: receiver.receiver_type,
        submitted_by:emp_id
    }, {transaction: t});

    t.commit()
    res.status(201).json({packageID: newID})
    console.log('Inserted Package:');////////////////////////////

  } catch (error) {

    t.rollback()
    console.log("new Package insertion error :" ,error.parent.code)

    const foreign_key_tracking_id = "package_ibfk_1";
    if(error.parent.errno === 1452 && error.index === foreign_key_tracking_id){
      res.status(400).json({Error: [
        {
            "type": "field",
            "value": req.body.package.tracking_device_id,
            "msg": "Tracking device ID is not valid",
            "path": "package.tracking_device_id",
            "location": "body"
        }
    ]});
      return;
    }

    if(error.parent.errno === 1062){
      const key = Object.keys(error.fields);
      res.status(400).json({Error: [
        {
            "type": "field",
            "value": key[0],
            "msg": "Duplicate entry",
            "path": error.fields.key,
            "location": "body"
        }
    ]});
      return;
    }
    
    res.status(500).json({Error: "Something went wrong"})
    return

  }
})


module.exports = router;