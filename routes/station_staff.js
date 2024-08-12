const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const isStaff = require('../util/auth/staffAuth.js');

const  {connectDb,getConnection, endConnection} = require('../database/database.js');



router.post('/signup', async (req, res, next) => {
    
    // database connection
    const connection = getConnection();
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
    const password = data.password;


    if(!employee_id || !fname || !lname || !password){
        res.status(400).json({Error: "Please submit all the required field"})
        return;
    }
    


    // checking the user email is already registered
    try{
        const result = await registered(employee_id, connection);
        if(result.length>0){
            res.status(409).json({Error: "User has already registered"})
            return;
        }
        
    }catch(err){
        res.status(500).json({Error: err, message: 'Registration Failed'})
        return;
    }
    
    // validate the user inputs
    const validationError = validate(employee_id, fname, lname, password);
    if(validationError){
        res.status(400).json({Error: validationError})
        return;
    }
    
    try{
        const hash = await hashPassword(password)

        // SAVE DATA IN DATABSE
        const token = jwt.sign({fname: fname, lname: lname,  employee_id: employee_id },process.env.JWT_SECRET, {expiresIn:'1h'});
        const result = await savaUserCredientials(employee_id, fname, lname, hash, connection)
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
       // endConnection()
    }
});


router.post('/login', async (req, res, next) => {

  
    const connection = getConnection();
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
        return;
    }

    try {
        const user = await findUser(employee_id, connection);
        if (!user) {
            res.status(401).json({ Error: "User not found" });
            return;
        }
        
        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) {
            res.status(401).json({ Error: "Invalid Password" });
            return;
        }

        const token = jwt.sign({ employee_id: user.employee_id, role: user.role}, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.cookie('token', token, { httpOnly: true, domain: 'localhost:3001' });
        res.status(200).json({ Error: null, message: "Login Successful" });

    } catch (err) {
        res.status(500).json({ Error: "Something went Wrong while login" });
    }




})


router.get('/profile', isStaff, async (req, res) => {
    const connection = getConnection();
    if (!connection) {
        console.log("Database connection unavailable");
        res.status(500).json({ Error: "Database Error" });
        return;
    }

    const employee_id = req.staff_id;
    try {
        const employee = await getEmployeeById(employee_id, connection);
        if (!employee) {
            res.status(404).json({ Error: "Employee not found" });
            return;
        }

        res.status(200).json({ Error: null, employee: employee });

    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});


router.get('/logout', (req, res, next)=>{
    res.clearCookie('token');
    res.status(201).json({message: "successfully logout"})
})

// validation of the user inputs
function validate(employee_id, fname, lname, password){

    if(typeof fname !== 'string'){
        return 'Invalid Username'
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

    if(password.length<6){
        return "Password should have minimum 6 characters"
    }
    const containsUppercase = /[A-Z]/.test(password);
    const containsSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if(!containsUppercase || !containsSymbol){
        return "Oops! Make sure your password has at least one uppercase letter and one special character."
    }
    if(!(/^\d{5}$/.test(employee_id))){
        return "invalid employee number"
    }

}


// validatae whether already registered or not using the employee_id. 
async function registered(employee_id, connection){
   
    return new Promise((resolve, reject) =>{
        const query = 'SELECT * FROM station_staff WHERE employee_id = ?';
        connection.query(query, [employee_id], (err, result) =>{
            if(err){
                reject("Server Error")
                return
            } 
            resolve(result);
            })
        }) 
};


async function hashPassword(password){
    const saltRound = 10;
    const hash = await bcrypt.hash(password,saltRound);
    return hash;
}

// save user details in the database
 function savaUserCredientials(employee_id,fname, lname, hashPassword, connection){
    
    const query = 'INSERT INTO station_staff (employee_id, first_name, last_name, password) VALUES (?,?,?,?)';
    return new Promise((resolve, reject)=>{
    connection.query(query, [employee_id, fname, lname, hashPassword], (err, result) =>{
        if(err){
            reject(err);
        }else{
            resolve(result)
        }
    })
   
    
    });

  
}


async function findUser(employee_id, connection){
    return new Promise((resolve, reject) =>{
        const query = 'SELECT * FROM station_staff WHERE employee_id = ?';
        connection.query(query, [employee_id], (err, result) =>{
            if(err){
                reject("Something Went Wrong")
                return;
            } 
            resolve(result[0]);
            })
        }) 
};


async function verifyPassword(password, hashPassword){
    return await bcrypt.compare(password, hashPassword);
}


async function getEmployeeById(employee_id, connection) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT  employee_id, first_name, last_name, role FROM station_staff WHERE employee_id = ?';
        connection.query(query, [employee_id], (err, result) => {
            if (err) {
                reject("Something Went Wrong");
                return;
            }
            if (result.length == 0) {
                reject("Employee not found");
                return;
            }
            resolve(result[0]);
        });
    });
}




module.exports = router;  



