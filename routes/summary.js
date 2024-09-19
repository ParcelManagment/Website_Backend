const express = require("express");
const { getConnection } = require("../database/database");
const router = express.Router();


router.get("/quicks",async (req, res, next)=>{

    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query1 = "select COUNT(id) from user WHERE role = 'user'"
    const query2 = "select price from package"
    try{
        const [users] = await connection.query(query1)
        const data = [{new:"data"}, {new:"onother"}]
        res.status(200).json({})
    }catch(err){
        console.log(err)
    }

})

module.exports = router