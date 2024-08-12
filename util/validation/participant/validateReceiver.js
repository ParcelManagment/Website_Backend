const { body, validationResult } = require('express-validator');
const User = require('../../../models/user');

const validateReceiver = [
  // Validation rules
  body('receiver.first_name').notEmpty().isString().isLength({ min: 3 }).withMessage('Receiver first name is not valid'),
  body('receiver.last_name').notEmpty().isString().isLength({ min: 3 }).withMessage('Receiver last name is not valid'),
  body('receiver.mobile_number').notEmpty().isMobilePhone(['si-LK', 'en-LK']).withMessage('Invalid Receiver mobile number'),

  // Middleware to handle validation result and create user
  async (req, res, next) => {
    if (!req.body.receiver.registered) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await req.transaction.rollback();
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const newReceiver = await User.create({
          email: req.body.receiver.email,
          first_name: req.body.receiver.first_name,
          last_name: req.body.receiver.last_name,
          mobile_number: req.body.receiver.mobile_number
        }, { transaction: req.transaction });
        
        req.body.receiver.receiver_id = newReceiver.id;
        next();
      } catch (error) {
        console.log('Error while creating new Receiver', error);
        await req.transaction.rollback();
        res.status(500).json({ error: 'Something went wrong' });
      }
    } else {
      next();
    }
  }
];

module.exports = validateReceiver;
