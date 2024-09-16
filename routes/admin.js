const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../database/database');
const { isAdmin } = require('../util/auth/staffAuth');

// to create hash password for admin registration
// always keep as commented
/*
router.get('/hash',async (req, res, next)=>{
    const saltRound = 10;
    console.log(req.body)
    const hash = await bcrypt.hash(req.body.password,saltRound);
    res.send(hash)
})*/



router.post('/login', async (req, res, next)=>{

    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const data = req.body;
    const employee_id = data.employee_id;
    const password = data.password;
    console.log(employee_id, password)
    // check empty fields
    if (!employee_id || !password) {
        res.status(400).json({ Error: "Empty Fields. Please Try Again" });
        connection.release();
        return;
    }
    try {
        const user = await findUser(employee_id, connection);
        if (!user) {
            res.status(401).json({ Error: "User not found" });
            return;
        }
       
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ Error: "Invalid Password" });
            return;
        }

        const token = jwt.sign({ employee_id: user.employee_id, role: user.role}, process.env.JWT_SECRET, { expiresIn: '3h'});
        res.cookie('token', token, {httpOnly: true })
        res.status(200).json({ Error: null, message: "Login Successful" });

    } catch (err) {
        res.status(500).json({ Error: "Something went Wrong while login" });
        console.log(err)
    }finally{
        connection.release();
    }
})

router.post('/createuser', isAdmin, async (req, res, next)=>{
      // database connection
      const connection = await getConnection();
      if(!connection){
          console.log("Database connection unavailable")
          res.status(500).json({Error: "Database Error"})
          return;
      }
  
        // extracting the submitted data
      const {employee_id, fname, lname, station, role} = req.body
      const password = employee_id;
      const created_by = req.staff_id;
      
      console.log(req.body)
  
      if(!employee_id || !fname || !lname || !station || !role){
         
          res.status(400).json({Error: "Please submit all the required field"})
          return;
      }
      
      // checking the user email is already registered
      try{
          const result = await registered(employee_id, connection);
          if(result.length>0){
              res.status(409).json({Error: "User has already registered"})
              connection.release();
              return;
          }
          
      }catch(err){
          res.status(500).json({Error: err, message: 'Registration Failed'})
          connection.release();
          return;
      }
      
      // validate the user inputs
      const validationError = validate(employee_id, fname, lname,password, station, role);
      if(validationError){
          res.status(400).json({Error: validationError})
          connection.release();
          return;
      }
      
      try{
          const hash = await hashPassword(password)
  
          // SAVE DATA IN DATABSE
          const result = await savaUserCredientials(employee_id, fname, lname, hash, station,role,created_by, connection)
          res.status(201).json({Error: null, message: 'Registration Successful', userId: result.employee_id, 
          })
  
      }catch(err){
          try{
          console.log("registration error occured", err);  // developing//////////////////////////////////////////////////
          res.status(500).json({Error: "Registration Failed"})
          }catch(error){
              console.log('error occured while responding to the client')
          }
  
      }finally{
          connection.release();
      }
})

router.get('/employees', async(req, res, next)=>{
    const {role, station} = req.query;

    const connection = await getConnection();
     if(!connection){
         console.log("Database connection unavailable")
         res.status(500).json({Error: "Database Error"})
         return;
     }
     parameters = []
     let sql = "SELECT employee_id, first_name, last_name, station, role, created_by, DATE_FORMAT(created_at, '%d-%b-%Y') as created_at FROM station_staff WHERE 1=1";

     if(role){
        sql +=" AND role = ?";
        parameters.push(role);
     }
     if(station){
        sql += " AND station = ?";
        parameters.push(station);
    }


    try{
        const result = await getEmployees(sql, parameters, connection);
        if(result.length==0){
            res.status(200).json({Error: "Currently No Registered Users"})
            connection.release();
            return;
        }else{
            res.status(200).json(result);
            connection.release()
        }

    }catch(err){
        res.status(500).json({Error: err, message: 'Failed to fetch data'})
        connection.release();
        return;
    }




})
router.post('/createdevice',isAdmin, async(req,res,next)=>{
     // database connection
     const connection = await getConnection();
     if(!connection){
         console.log("Database connection unavailable")
         res.status(500).json({Error: "Database Error"})
         return;
     }
       // extracting the submitted data
    const {mac_id, iccid, status} = req.body;
    const staff_id = req.staff_id
     console.log(req.body)
    if(!mac_id || !iccid || !status){
        res.status(400).json({Error: "Please submit all the required field"})
        return;
    }


     try{
        const result = await findDevice(mac_id, connection);
        if(result.length>0){
            res.status(409).json({Error: "Device has already registered"})
            connection.release();
            return;
        }
        
    }catch(err){
        res.status(500).json({Error: err, message: 'Registration Failed'})
        connection.release();
        return;
    }
       // 0--------->>>>>>>>>>>>>>>>>> importatnt <<<<<<<<<<<<<<<<<<<<<------------0
    // validate device attributes
   // const validationError = validate(mac_id, sim_num);    /// need to be implemented
   // !!!!!#####%%%^^^^^^^^^ importatnt ^^^^^^%%%#####!!!!!!!
   /* if(validationError){
        res.status(400).json({Error: validationError})
        connection.release();
        return;
    }
    */
    try{
        
        const result = await createDevice(mac_id,iccid, staff_id, status, connection)
        res.status(201).json({Error: null, message: 'Registration Successfull', device_id: result.insertId})

    }catch(err){
        try{
        console.log("registration error occured", err);  // developing//////////////////////////////////////////////////
        res.status(500).json({Error: "Registration Failed"})
        }catch(error){
            console.log('error occured while responding to the client')
        }

    }finally{
        connection.release();
    }

})

router.get('/alldevices',isAdmin, async(req,res,next)=>{
   
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    try{
        const result = await allDevices(connection);
        if(result.length==0){
            res.status(200).json({Error: "Zero devices"})
            connection.release();
            return;
        }else{
            res.status(200).json(result);
            connection.release()
        }
        
    }catch(err){
        res.status(500).json({Error: err, message: 'Failed to fetch data'})
        connection.release();
        return;
    }
    
})


async function findUser(employee_id, connection){
    try {
        const [rows] = await connection.query('SELECT * FROM station_staff WHERE employee_id = ?', [employee_id]);
        return rows[0];
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
};


// validation of the user inputs
function validate(employee_id, fname, lname, password, station, role){

    if(typeof fname !== 'string'){
        return 'Invalid Username'
    }
    const roles = ["station_master","general_staff"]
    if(!roles.includes(role)){
       
        return "invalid user role"
    }

    if (fname.length < 3 || fname.length > 20) {
        return "invalid username, too short or too long"
      }
    
      if(typeof lname !== 'string'){
        return 'Invalid Username'
    }

    if (lname.length < 3 || lname.length > 20) {
        return "invalid username, too short or too long"
      }

    if(typeof password !== 'string'){
        return 'Invalid Password'
    }
/*
    if(password.length<6){
        return "Password should have minimum 6 characters"
    }
    const containsUppercase = /[A-Z]/.test(password);
    const containsSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if(!containsUppercase || !containsSymbol){
        return "Oops! Make sure your password has at least one uppercase letter and one special character."
    }*/

    if(!(/^\d{5}$/.test(employee_id))){
        return "invalid employee number"
    }
    const cities = [
        'Colombo',
        'Kandy',
        'Galle',
        'Jaffna',
        'Negombo',
        'Anuradhapura',
        'Trincomalee',
        'Batticaloa',
        'Matara',
        'Kurunegala',
        'Puttalam',  
        'Vavuniya',  
        'Polonnaruwa',  
        'Kilinochchi',  
        'Mannar',  
        'Vavuniya',  
        'Mullaitivu',  
      ];

    if(!cities.includes(station)){
        return "invalid station"
    }
}

// save user details in the database
async function savaUserCredientials(employee_id,fname, lname, hashPassword, station,role,created_by, connection){
    
    try {
        const query = 'INSERT INTO station_staff (employee_id, first_name, last_name, password, station, role, created_by) VALUES (?,?, ?, ?, ?, ?, ?)';
        const [result] = await connection.query(query, [employee_id, fname, lname, hashPassword, station, role, created_by]);
        return result;
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }

}
// validatae whether already registered or not using the employee_id. 
async function registered(employee_id, connection){
  
    try {
        const [rows] = await connection.query('SELECT * FROM station_staff WHERE employee_id = ?', [employee_id]);
        return rows;
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
};

async function findDevice(mac_id, connection){
  
    try {
        const [rows] = await connection.query('SELECT * FROM trackingDevice WHERE MAC_id = ?', [mac_id]);
        return rows;
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
};

async function hashPassword(password){
    const saltRound = 10;
    const hash = await bcrypt.hash(password,saltRound);
    return hash;
}

async function createDevice(mac_id, iccid, staff_id, status, connection){
    
    try {
        const query = 'INSERT INTO trackingDevice (MAC_id, iccid, installed_by, device_status) VALUES (?, ?, ?, ?)';
        const [result] = await connection.query(query, [mac_id, iccid, staff_id, status]);
        return result;
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }

}
async function getEmployees(query, params, connection){
    try {
        [rows] = await connection.query(query,params);
        return rows;
    }catch(err){
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
}
async function allDevices( connection){
   
    try {
        const [rows] = await connection.query(
            "SELECT device_id, device_status, DATE_FORMAT(Last_update,'%d-%b-%Y %H:%i:%s') AS Last_update, MAC_id, iccid,DATE_FORMAT(installation, '%d-%b-%Y') AS installation,  installed_by FROM trackingDevice"
            );
        return rows;
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
};
module.exports = router;