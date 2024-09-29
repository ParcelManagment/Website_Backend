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
    const query2 = `SELECT 
                        COALESCE(SUM(price), 0) AS total_Revenue 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY;`

    const query3 = `SELECT 
                        COUNT(price) AS orders 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY;`

    const query4 = `SELECT 
                        FLOOR(AVG(price)) AS average 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY`
    try{
        const [[users]] = await connection.query(query1);
        const [[revenue]] = await connection.query(query2);
        const [[orders]] = await connection.query(query3);
        const [[average]] = await connection.query(query4);
        const currentTime = new Date(); 
        const time = formatDate(currentTime); 

        res.status(200).json({users:users.users
                                ,revenue:revenue.total_Revenue
                                ,orders:orders.orders
                                ,average:average.average
                                ,time:time})
    }catch(err){
        res.status(500).json({Error:"Error Getting Data"})
        console.log(err)
    }finally{
        connection.release()
    }

    function formatDate(date) {
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
        
        const [day, month, year] = formattedDate.split(', ')[0].split(' ');
        const [hour, minute] = formattedDate.split(', ')[1].split(':');
    
        return `${day} ${month} ${year} ${hour}:${minute}`;
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
    }finally{
        connection.release()
    }


})

router.get('/stations', async (req, res, next)=>{
    
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query = `SELECT departure AS station, COALESCE(SUM(price),0) 
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
                    LIMIT 5`
    
    try{
        const [stations] = await connection.query(query)
        res.status(200).json(stations)
    }catch(err){
        console.log(err)
        res.status(500).json({Error:"Error Getting Data"})
    }finally{
        connection.release()
    }
                
})

router.get('/recentactivity', async (req, res, next)=>{
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query = `(SELECT 
                        'staff' AS type
                        ,DATE_FORMAT(created_at, '%Y %b %d') AS date
                        ,TIME_FORMAT(created_at, '%H:%i') AS time
                        ,created_by AS ref 
                    FROM 
                        station_staff ) 
                    UNION ALL 
                    (SELECT 
                        'device'
                        ,DATE_FORMAT(installation, '%Y %b %d') AS date
                        ,TIME_FORMAT(installation, '%H:%i') AS time
                        ,installed_by 
                    FROM 
                        trackingDevice) 
                    ORDER BY 
                        date DESC, time DESC 
                    LIMIT 5`

    try{
        const [recent] = await connection.query(query)
        res.status(200).json(recent)
    }catch(err){
        console.log(err)
        res.status(500).json({Error:"Error Getting Data"})
    }finally{
        connection.release()
    }
})

router.get('/usertypes', async (req ,res, next)=>{
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query = `SELECT 
                        COUNT(*) as value,
                        CASE 
                            WHEN role = 'user_nr' THEN 'Only Email'
                            WHEN role = 'user' THEN 'App Users'                           
                        END AS type
                    FROM 
                        user
                    GROUP BY
                        role`

    try{
        const [user] = await connection.query(query)
        res.status(200).json(user)
    }catch(err){
        console.log(err)
        res.status(500).json({Error:"Error Getting Data"})
    }finally{
        connection.release()
    }
})

router.get('/deliveries',async (req, res)=>{

    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query1 = `SELECT 
                        COUNT(price) AS completed 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    AND
                        completed = true;`

    const query2 = `SELECT 
                        COUNT(price) AS cancelled 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    AND
                        cancelled = true;`

    const query3 = `SELECT 
                        COUNT(price) AS ongoing 
                    FROM 
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    AND
                        cancelled = false
                    AND 
                        completed = false;`


    const query4 = `SELECT departure AS station, COUNT(package_id)
                    AS
                        value
                    FROM
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    GROUP BY 
                        station
                    ORDER BY 
                        value DESC
                    LIMIT 3`

    const query5 = `SELECT destination AS station, COUNT(package_id)
                    AS
                        value
                    FROM
                        package 
                    WHERE 
                        submitted >= CURDATE() - INTERVAL 7 DAY
                    GROUP BY 
                        station
                    ORDER BY 
                        value DESC
                    LIMIT 3`

    const query6 = `SELECT 
                        (
                            (SELECT COUNT(package_id) FROM package
                                WHERE 
                                    submitted >= CURDATE() - INTERVAL 7 DAY
                                AND
                                    (completed = true OR cancelled = true)
                            )
                            -
                            (SELECT COUNT(package_id) FROM package
                                WHERE 
                                    submitted >= CURDATE() - INTERVAL 7 DAY
                                AND 
                                    cancelled = true
                            )
                        ) 
                        /
                        (SELECT COUNT(package_id) FROM package
                            WHERE 
                                submitted >= CURDATE() - INTERVAL 7 DAY
                            AND
                                (completed = true OR cancelled = true)
                        ) *100 AS ratio;`

        const query7 = `SELECT 
                            CASE 
                                WHEN total_customers_at_start = 0 THEN 0  -- Avoid division by zero
                                ELSE (total_customers_at_end - new_customers) * 100.0 / total_customers_at_start 
                            END AS retention_rate
                        FROM (
                            SELECT 
                                (SELECT COUNT(DISTINCT sender_id) 
                                FROM package 
                                WHERE submitted < CURDATE() - INTERVAL 7 DAY) AS total_customers_at_start,
                        
                                (SELECT COUNT(DISTINCT sender_id) 
                                FROM package 
                                WHERE submitted >= CURDATE() - INTERVAL 7 DAY) AS total_customers_at_end,
                        
                                (SELECT COUNT(DISTINCT sender_id) 
                                FROM package 
                                WHERE submitted >= CURDATE() - INTERVAL 7 DAY
                                AND sender_id NOT IN (
                                    SELECT sender_id 
                                    FROM package 
                                    WHERE submitted < CURDATE() - INTERVAL 7 DAY
                                )) AS new_customers
                        ) AS retention_data;` 
    try{
        
        const [[completed]] = await connection.query(query1);
        const [[cancelled]] = await connection.query(query2);
        const [[ongoing]] = await connection.query(query3);
        const [departure] = await connection.query(query4);
        const [destination] = await connection.query(query5);
        const [success_rate] = await connection.query(query6);
        const [[retention]] = await connection.query(query7);

        res.status(200).json({
            completed:completed.completed
            ,ongoing:ongoing.ongoing
            ,cancelled:cancelled.cancelled
            ,departure:departure
            ,destination:destination
            ,success_rate:success_rate
            ,retention:retention})

    }catch(err){
        res.status(500).json({Error:"Error Getting Data"})
        console.log(err)
    }finally{
        connection.release()
    }

})

module.exports = router