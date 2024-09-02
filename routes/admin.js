const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../database/database');

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

        const token = jwt.sign({ employee_id: user.employee_id, role: user.role}, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.cookie('token', token, { httpOnly: true});
        res.status(200).json({ Error: null, message: "Login Successful" });

    } catch (err) {
        res.status(500).json({ Error: "Something went Wrong while login" });
        console.log(err)
    }finally{
        connection.release();
    }
})

router.post('/createuser', async (req, res, next)=>{
      // database connection
      const connection = await getConnection();
      if(!connection){
          console.log("Database connection unavailable")
          res.status(500).json({Error: "Database Error"})
          return;
      }
  
        // extracting the submitted data
      const data = req.body;
      const employee_id = data.employee_id;
      const fname = data.fname;
      const lname = data.lname;
      const station = data.station;
      const role = data.role;
      const password = employee_id;
      
      
  
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
          const token = jwt.sign({fname: fname, lname: lname,  employee_id: employee_id },process.env.JWT_SECRET, {expiresIn:'1h'});
          const result = await savaUserCredientials(employee_id, fname, lname, hash, station,role, connection)
          res.cookie('token',token,{httpOnly: true}) // set cookie
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
async function savaUserCredientials(employee_id,fname, lname, hashPassword, station,role, connection){
    
    try {
        const query = 'INSERT INTO station_staff (employee_id, first_name, last_name, password, station, role) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await connection.query(query, [employee_id, fname, lname, hashPassword, station, role]);
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
async function hashPassword(password){
    const saltRound = 10;
    const hash = await bcrypt.hash(password,saltRound);
    return hash;
}

module.exports = router;