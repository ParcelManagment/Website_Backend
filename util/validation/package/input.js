const {body, validationResult} = require("express-validator");
const cities = [
    'Colombo',
    'Kandy',
    'Galle',
    'Jaffna',
    'Negombo',
    'Anuradhapura',
    'Trincomalee',
    'Batticaloa',
    'Matara',
    'Kurunegala',
    'Puttalam',  
    'Vavuniya',  
    'Polonnaruwa',  
    'Kilinochchi',  
    'Mannar',  
    'Vavuniya',  
    'Mullaitivu',  
  ];

const validateNewPackage = [
    body("package.tag_id").notEmpty().withMessage("tag_id is not valid"),
    body("package.type").notEmpty().isIn(["vehicle", "furniture", "food", "grocery", "chemical", "other"]).withMessage("not a valid package type"),
    body("package.package_condition").notEmpty().isIn(['new', 'used']).withMessage("invalid package condition"),
    body("package.destination").notEmpty().isIn(cities).isString().withMessage("invalid destination"),
    body('package.price').notEmpty().isInt().withMessage("Price is not valid"),
    body("sender.email").notEmpty().isEmail().withMessage("Sender Email is not Valid"),
    body("receiver.email").notEmpty().isEmail().withMessage("Receiver Email is not valid"),
    (req, res, next) =>{
        const result = validationResult(req)
        if(result.isEmpty()){
            next()
        }else{
            res.status(400).json({Error: result.array()})
            return
        }
        
    }
]

module.exports = validateNewPackage;