const { body, validationResult } = require('express-validator');
const User = require('../../../models/user');

const validateSender = [
  // Validation rules
  body('sender.first_name').notEmpty().isString().isLength({ min: 3 }).withMessage('Sender name is not valid'),
  body('sender.last_name').notEmpty().isString().isLength({ min: 3 }).withMessage('Sender name is not valid'),
  body('sender.mobile_number').notEmpty().isMobilePhone(['si-LK', 'en-LK']).withMessage('Invalid Sender mobile number'),

  // Middleware to handle validation result and create user
  async (req, res, next) => {
    if (!req.body.sender.registered) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await req.transaction.rollback();
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const newSender = await User.create({
          email: req.body.sender.email,
          first_name: req.body.sender.first_name,
          last_name: req.body.sender.last_name,
          mobile_number: req.body.sender.mobile_number
        }, { transaction: req.transaction });

        req.body.sender.sender_id = newSender.id;
        req.body.sender.email = newSender.email
        next();
      } catch (error) {
        console.log('Error while creating new Sender', error);
        await req.transaction.rollback();
        res.status(500).json({ error: 'Something went wrong' });
      }
    } else {
      next();
    }
  }
];

module.exports = validateSender;
