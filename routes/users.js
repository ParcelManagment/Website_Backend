const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

const  {connectDb,getConnection, endConnection} = require('../database/database.js')


router.post('/signup', async (req, res, next) => {
    
    const connection = getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const data = req.body;
    const fname = data.fname;
    const lname = data.lname
    const password = data.password;
    const email = data.email;
    const mobileNum = data.mobileNum

    const emptyFields = checkEmptySignUp(email, fname, lname, password, mobileNum);
    
    if(emptyFields){
        res.status(400).json({Error: emptyFields})
        return;
    }

    // checking the user email is already registered
    try{
        const result = await validateEmail(email, connection);
        if(result){
                res.status(409).json({Error: "User has already registered"})
                return
        }
       
    }catch(err){
        console.log(err)
        res.status(500).json({Error: err, message: 'Registration Failed'})
        return;
    }
    
    // validate the user inputs
    const validationError = validate(fname, lname, password, mobileNum);
    if(validationError){
        res.status(500).json({Error: validationError})
        return;
    }
    
    try{
        const hash = await hashPassword(password)

        // CREATE JWT AND SAVE DATA IN DATABSE
        const token = jwt.sign({fname:  fname, lname: lname, email: email, role: "user"},process.env.JWT_SECRET, {expiresIn:'1h'});
        const result = await savaUserCredientials(email, fname, lname, hash, mobileNum, connection)
        res.cookie('token',token,{httpOnly: true}) // set cookie
        res.status(201).json({Error: null, message: 'Registration Successful', userId: result.insertId, 
        })

    }catch(err){
        try{
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
    const email = data.email;
    const password = data.password;

    // check empty fields
    const invalid = checkEmptyLogin(email, password);
    if(invalid){
        res.status(400).json({Error: "Empty Fields. Please Try Agian", invalid})
        return;
    }

    try{
        const user = await findUser(email, connection);

        if(!user){
            res.status(401).json({ Error: "User not found" });
            return;
        }

        const validPassword = await verifyPassword(password, user.password);
        
        if(!validPassword){
            res.status(401).json({Error: "invalid Password"});
            return;        
        }

        console.log("valid") //developing
        const token = jwt.sign({fname:  user.fname, lname: user.lname, email: email, role: user.role},process.env.JWT_SECRET, {expiresIn:'1h'});
        console.log('jwt -- ', token)  // developing
        res.cookie('token',token,{httpOnly: true})
        res.status(200).json({Error: null, massage: "login Successful"})
        
    }catch(err){
        res.status(500).json({Error: "Something went Wrong"})
        console.log(err)
    }




})


// check the user inputs availability
function checkEmptySignUp(email, fname, lname, password, mobileNum){
    if(!email){
        return "Please Enter Your Email."
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = regex.test(email);
    if(!valid){
        return "invalid Email"
    }
    if(!fname || !lname){
        return "Please Enter Your first and last name."
    }

    if(!password){
        return "Please Enter a Password."
    }
    if(!mobileNum){
        return "Please Enter Your mobile Number."
    }

}

function checkEmptyLogin(email, password){
    if(!email){
        return "Empty Email"
    }
    if(!password){
        return "Empty Password."
    }
    return null;
}

// validation of the user inputs
function validate(fname, lname, password, mobileNum){

    if(typeof lname !== 'string' || typeof fname !== 'string'){
        return 'Invalid Username'
    }

    if (fname.length < 3 || fname.length > 20 || lname.length < 3 || lname.length > 20) {
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

    const validnum = validateSriLankanPhoneNumber(mobileNum);
    if(!validnum){
        return "Please enter valid Phone number"
    }
}

// validatae whether already registered or not using the email. 
async function validateEmail(email, connection){
    return new Promise((resolve, reject) =>{
        const query = 'SELECT * FROM user WHERE email = ?';
        connection.query(query, [email], (err, result) =>{
            if(err){
                reject("Server Error")
                return
            } 
            resolve(result[0])
            })
        }) 
};

async function hashPassword(password){
    const saltRound = 10;
    const hash = await bcrypt.hash(password,saltRound);
    return hash;
}

// save user details in the database
 function savaUserCredientials(email, fname, lname, hashPassword, mobileNum, connection){
    
    const query = 'INSERT INTO user (email, first_name, last_name, password, mobile_number, role) VALUES (?,?,?,?,?,?)';
    return new Promise((resolve, reject)=>{
    connection.query(query, [email, fname, lname, hashPassword, mobileNum, 'user'], (err, result) =>{
        if(err){
            reject(err);
        }else{
            resolve(result)
        }
    })
    
    });

    
}

// validate the user input mobile number
function validateSriLankanPhoneNumber(phoneNumber) {
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, 'LK');
    return phoneNumberObj && phoneNumberObj.isValid();
}

async function findUser(email, connection){
    return new Promise((resolve, reject) =>{
        const query = 'SELECT * FROM user WHERE email = ?';
        connection.query(query, [email], (err, result) =>{
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

router.put('/edituser/:id',async (req, res) => {
    const userId = req.params.id;
    const {first_name, last_name,email, mobile_number} = req.body;

    let updates = [];
    let values = []; 

    if (first_name) {
        updates.push("first_name = ?");
        values.push(first_name);
    }

    if (last_name) {
        updates.push("last_name = ?");
        values.push(last_name);
    }

    if (email){
        updates.push("email = ?");
        values.push(email);
    }

    if (mobile_number) {
        updates.push("mobile_number = ?");
        values.push(mobile_number);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "Provide at least one field"});
    }

    values.push(userId);

    try {
        const con = await getConnection();
        const sql = `UPDATE user SET ${updates.join(', ')} WHERE id = ?`;

        

        con.query(sql, values, (err, result)=> {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).json({ message: "Database error", error: err});
            }
    
            res.status(200).json({ message: "User updated successfully"});
    
        });

    }

    catch (error){

        console.error("Error getting database connection:", error);
        res.status(500).json({message: "Internal server error"});

    }

    
  
});

// New route for deleting a user by ID
router.delete('/deleteuser/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const con = await getConnection();
        const sql = 'DELETE FROM user WHERE id = ?';

        con.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ message: 'User deleted successfully' });
        });

    } catch (error) {
        console.error('Error getting database connection:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;