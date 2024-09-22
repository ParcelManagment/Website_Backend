const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {isStaff, isStationMaster} = require('../util/auth/staffAuth.js');

const  {getConnection} = require('../database/database.js');


/*
router.post('/signup', async (req, res, next) => {

  
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
    const password = data.password;
    const station = data.station;
    


    if(!employee_id || !fname || !lname || !password || !station){
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
    const validationError = validate(employee_id, fname, lname, password, station);
    if(validationError){
        res.status(400).json({Error: validationError})
        connection.release();
        return;
    }
    
    try{
        const hash = await hashPassword(password)

        // SAVE DATA IN DATABSE
        const token = jwt.sign({fname: fname, lname: lname,  employee_id: employee_id },process.env.JWT_SECRET, {expiresIn:'1h'});
        const result = await savaUserCredientials(employee_id, fname, lname, hash, station, connection)
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
});*/


router.post('/login', async (req, res, next) => {

  
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
        
        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) {
            res.status(401).json({ Error: "Invalid Password" });
            return;
        }

        const token = jwt.sign({ employee_id: user.employee_id, role: user.role, station:user.station}, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.cookie('token', token, { httpOnly: true});
        res.status(200).json({ Error: null, message: "Login Successful" });

    } catch (err) {
        res.status(500).json({ Error: "Something went Wrong while login" });
    }finally{
        connection.release();
    }




})


router.get('/profile', isStaff, async (req, res) => {
    const connection = await getConnection();
    if (!connection) {
        console.log("Database connection unavailable");
        res.status(500).json({ Error: "Database Error" });
        return;
    }

    const employee_id = req.staff_id;
    console.log(employee_id);
    try {
        const employee = await getEmployeeById(employee_id, connection);
        if (!employee) {
            res.status(404).json({ Error: "Employee not found" });
            return;
        }

        res.status(200).json({ Error: null, employee: employee });

    } catch (err) {
        res.status(500).json({ Error: err.message });
    }finally{
        connection.release();
    }
});


router.get('/logout', (req, res, next)=>{
    res.clearCookie('token');
    res.status(201).json({message: "successfully logout"})
    connection.release();
})

router.get('/stafflist', async (req, res, next)=>{

    const connection = await getConnection();
   
    if(!connection){
        console.log("database connection unavailable")
        res.status(500).json({Error: "Error fetching data"})
        console.log("database connection failed")
        return
    }
    try{
        const result = await getEmployees(connection);
        res.send(result).status(200);
        connection.release(); 
    }catch(err){
        connection.release()
        res.status(500).send({Error: "Error fetching data"})
        console.log("Error retriving data in stafflist route",err)
    }
    
})

router.post('/changepass', (req, res, next)=>{
   
})

router.post('/approve', isStationMaster, async (req, res, next)=>{
    
    const connection = await getConnection();
   
    if(!connection){
        console.log("database connection unavailable")
        res.status(500).json({Error: "Error fetching data"})
        console.log("database connection failed")
        return
    }
    try{
        const {affectedRows, changedRows } = await updateRole(connection,req.body.employee_id);
        
        connection.release();
        if(affectedRows ==0){
            res.status(400).json({Error: "Employee Not Found"})
            return
        }
        if(changedRows==0 && affectedRows ==1){ 
            res.status(409).json({Error: "Already Approved to General Staff"})
            return
        }
        res.status(200).send("Successfully Approved")
    }catch(err){
        console.log(err)
        connection.release()
        res.status(500).json({Error : "Approvel Failed"})
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


async function verifyPassword(password, hashPassword){
    return await bcrypt.compare(password, hashPassword);
}


async function getEmployeeById(employee_id, connection) {
   try{
        const query = 'SELECT  employee_id, first_name, last_name, role FROM station_staff WHERE employee_id = ?';
        const [rows] = await connection.query(query, [employee_id]);

        if (rows.length === 0) {
            throw new Error("Employee not found");
        }
        return rows[0];
    } catch (err) {
        console.error("Database operation failed:", err);
        throw new Error("Server Error");
    }
}

async function getEmployees(connection){
    try{
        const query = 'SELECT employee_id, first_name, last_name, role FROM station_staff WHERE role = ? OR role = ?';
        const [rows] = await connection.query(query, ["general_staff", "not_approved"]);
        return rows;

    } catch (err) {
        console.error("Database operation failed:", err.code);
        throw new Error(err);
    }
}

async function updateRole(connection, employee_id){
    try{
        const query = "UPDATE station_staff SET role= ? WHERE employee_id = ?";
        const result = await connection.query(query, ["general_staff", employee_id])
        //console.log(result[0])
        return result[0];
    }catch(error){
        console.log("error occured")
        console.log(error)
        throw new Error("error")
    }
}

module.exports = router;  



