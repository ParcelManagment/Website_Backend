//const mysql = require('mysql2');
require('dotenv').config();

const mysql = require('mysql2/promise');




const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});


async function getConnection(){
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (err) {
    console.error('Failed to get a connection from the pool:', err);
    throw new Error('Database Error');
  }
}

async function testDbConnection(){

  try{
    const connection = await pool.getConnection();
    await connection.query('SELECT 1'); 
    console.log("database Connection Successful");
  }catch(err){
    console.log("database connection Failed")
    console.log(err);
  }

}

async function endConnection(){
  try{
    pool.end();
    console.log("Database Connection Ended Successfully")
  }catch(err){
    console.log("DAtabase connection failed to end")
    console.log(err);
  }
  
}



/*var connection;

function dbConfig() {
    return new Promise((resolve, reject) => {
      // Create the connection instance
      const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
      });
  
      
      connection.connect((err) => {
        if (err) {
          reject(err); 
        } else {
          resolve(connection); 
        }
      });
    });
  }

async function connectDb(){
  try{
    
    connection =  await dbConfig()
    console.log("database connected")
  }catch(err){
    console.log("Database connection failed")
  }

}


function getConnection(){
  return connection;
}

function endConnection() {
  con = getConnection();
  if(con){
    con.end((err) =>{
      if(err){
        console.log("Can't close the DB connection") // developing
      }else{
        console.log("DB connection closed") // developing 
      }
    })
  }
}*/

module.exports = {testDbConnection, getConnection,endConnection};