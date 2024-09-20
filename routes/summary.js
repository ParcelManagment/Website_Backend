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

    const query1 = "SELECT COUNT(id) AS users FROM user WHERE role = 'user';"
    const query2 = `SELECT COALESCE(SUM(price), 0) AS total_Revenue FROM package WHERE submitted >= CURDATE() - INTERVAL 7 DAY;`
    const query3 = "SELECT COUNT(price) AS orders FROM package WHERE submitted >= CURDATE() - INTERVAL 7 DAY;"
    const query4 = `SELECT FLOOR(AVG(price)) AS average FROM package WHERE submitted >= CURDATE() - INTERVAL 7 DAY`
    try{
        const [[users]] = await connection.query(query1);
        const [[revenue]] = await connection.query(query2);
        const [[orders]] = await connection.query(query3);
        const [[average]] = await connection.query(query4);
        res.status(200).json({users:users.users
                                ,revenue:revenue.total_Revenue
                                ,orders:orders.orders
                                ,average:average.average})
    }catch(err){
        res.status(500).json({Error:"Error Getting Data"})
        console.log(err)
    }

})

router.get('/revenue', async (req, res, next)=>{

    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query1 = `WITH RECURSIVE last_seven_days AS (
    SELECT CURDATE() - INTERVAL 6 DAY AS submission_date
    UNION ALL
    SELECT submission_date + INTERVAL 1 DAY
    FROM last_seven_days
    WHERE submission_date + INTERVAL 1 DAY <= CURDATE()
    )
    SELECT 
        DATE_FORMAT(d.submission_date, '%d') AS date,
        DATE_FORMAT(d.submission_date, '%a') AS day,
        COALESCE(SUM(p.price), 0) AS revenue
    FROM 
        last_seven_days d
    LEFT JOIN 
        package p ON DATE(p.submitted) = d.submission_date
    GROUP BY d.submission_date
    ORDER BY d.submission_date;`

    try{
        const [users] = await connection.query(query1)
        res.status(200).json(users)
    }catch(err){
        res.status(500).json({Error:"Error Getting Data"})
    }


})

router.get('/stations', async (req, res, next)=>{
    
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query = `SELECT departure, COALESCE(SUM(price),0) 
                    AS
                        price
                    FROM
                         package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    GROUP BY 
                        departure
                    ORDER BY 
                        price DESC
                    LIMIT 5 `
    
    try{
        const [stations] = await connection.query(query)
        res.status(200).json(stations)
    }catch(err){
        console.log(err)
        res.status(500).json({Error:"Error Getting Data"})
    }
                
})

module.exports = router