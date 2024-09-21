const { getConnection } = require("../database/database");
const client = require("./mqttConfig");




client.on('message', (topic, message) => {

    const [ MAC_ID, action, ...data] = message.toString().split('|'); 
    switch (action) {
        case 'location':
            updateLocation(MAC_ID, data, action);
          break;
        case 'start':
            updatePackage(MAC_ID, data, action);
          break;
        case 'stop':
            updatePackage(MAC_ID, data, action);
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
        if(result.changedRows==0){
            console.log(`update failed with Device ID ${MAC_ID}, Action : ${action}`)
        }
        
    }catch(err){
        console.log(err)
    }finally{
        connection.release()
    }
                        
}

const updatePackage = async (MAC_ID, [data], action)=>{
    const connection = await getConnection();
    if(!connection){
        console.log("Database connection unavailable")
        res.status(500).json({Error: "Database Error"})
        return;
    }

    const check_in =`UPDATE package p
                        JOIN trackingDevice t 
                        ON t.MAC_id = ?
                        SET 
                            p.tracking_device_id = t.device_id,
                            p.out_for_delivery = CURRENT_TIMESTAMP
                        WHERE p.tag_id = ?
                        AND completed = 0
                        AND cancelled = 0;`

    const check_out = `UPDATE package p
                        JOIN trackingDevice t 
                        ON p.tracking_device_id = t.device_id
                        SET p.arrived = CURRENT_TIMESTAMP  
                        WHERE t.MAC_id = ? 
                        AND p.tag_id = ?
                        AND p.completed = 0
                        AND p.cancelled = 0;`    
                        
    try{
        let result;
        if(action == 'start'){
            [result] = await connection.query(check_in,[MAC_ID,data])
        }
        else if(action == 'stop'){
            [result] = await connection.query(check_out,[MAC_ID, data])
        }
        if(result.changedRows==0){
            console.log(`update failed with Device ID ${MAC_ID}, Action : ${action}`)
        }
    }catch(err){
        console.log(err)
    }finally{
        connection.release()
    }
                        
}
