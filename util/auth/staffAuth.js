const authoByRoles = require("./authByRoles");


const isStaff = (req, res, next) => { 

    const token = req.cookies.token;
    if(!token){
        res.status(401).json("No Token Provided");
        return
    }

    try{
        const payload = authoByRoles(token, ["station_master","general_staff","admin"]);
        req.staff_id = payload.employee_id;
        req.staff_role = payload.role;
        req.station = payload.station;
        next()

    }catch(error){
        res.status(401).json({Error:error.message})
        return;
    }
}
const isStationMaster = (req, res, next)=>{
   
    const token = req.cookies.token;
    if(!token){
        res.status(401).json("No Token Provided");
        return
    }

    try{
    const payload = authoByRoles(token, ["station_master"]);
        req.staff_id = payload.employee_id;
        req.staff_role = payload.role;
        req.station = payload.station;
        next()

    }catch(error){
        res.status(401).json({Error:error.message})
        return;
    } 
}

    const isAdmin = (req,res, next)=>{
        const token = req.cookies.token;
        if(!token){
            res.status(401).json("No Token Provided");
            return
        }
    
        try{
        const payload = authoByRoles(token, ["admin", "station_master"]);
            req.staff_id = payload.employee_id;
            req.staff_role = payload.role;
            req.station = payload.station;
            next()
    
        }catch(error){
            res.status(401).json({Error:error.message})
            return;
        } 
    }

    


module.exports = {isStaff, isStationMaster, isAdmin};