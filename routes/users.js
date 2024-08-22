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
    const lname = data.lname;
    const password = data.password;
    const email = data.email;
    const mobileNum = data.mobileNum;

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
        res.status(500).json({Error: err, message: 'Registration Failed validate email'+err.massage})
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
        //res.cookie('token',token,{httpOnly: true}) // set cookie
        
        res.status(201).json({
          Error: null,
          message: "Registration Successful",
          userId: result.insertId,
          token, // Send the token in the response body
        });


        

    }catch(err){
        try{
        res.status(500).json({Error: "Registration Failed jwt sign"+err.message})
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
       // res.cookie('token',token,{httpOnly: true})
        

       // res.status(200).json({Error: null, massage: "login Successful"})
       res.status(200).json({
         Error: null,
         message: "Login Successful!",
         userId: user.id,
         token, // Send the token in the response body
       });

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
                reject("Server Error"+err.message)
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
            reject("save user credietials"+err.message);
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
                reject("Something Went Wrong find user "+err.message)
                return;
            } 
            resolve(result[0]);
            })
        }) 
};

async function verifyPassword(password, hashPassword){
    return await bcrypt.compare(password, hashPassword);
}

module.exports = router;