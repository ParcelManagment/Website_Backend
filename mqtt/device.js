const { getConnection } = require("../database/database");
const client = require("./mqttConfig");




client.on('message', (topic, message) => {

    console.log(`Received message: ${message.toString()} on topics by: ${topic}`);
    const [ MAC_ID, action, ...data] = message.toString().split('|'); 
    console.log(MAC_ID)
    console.log(action)
    console.log(data)
    switch (action) {
        case 'location':
            updateLocation(MAC_ID, data, action);
          break;
        case 'departure':
            packageUpdate(MAC_ID, data, action);
          break;
        case 'destination':
            packageUpdate(MAC_ID, data, action);
          break;
        
      }
      
});

const updateLocation = async (MAC_ID, data, action)=>{
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const query = `UPDATE 
                        trackingDevice
                    SET 
                        Longitude = ?, 
                        Latitude = ?, 
                        Last_update = CURRENT_TIMESTAMP
                    WHERE 
                        MAC_ID = ?
                        `
    try{
        const [result] = await connection.query(query,[data[0], data[1], MAC_ID])
    }catch(err){
        console.log(err)
    }finally{
        connection.release()
    }
                        
}

