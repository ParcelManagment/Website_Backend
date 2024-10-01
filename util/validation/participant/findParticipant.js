const sequelize = require("../../../database/connectSequelize.js");
const User = require('../../../models/user.js');

const findParticipant = async (req, res, next) => {
    let t;
    try {
        t = await sequelize.transaction();
        req.transaction = t;

        const senderEmail = req.body.sender.email;
        const receiverEmail = req.body.receiver.email;

        const sender = await User.findOne({ where: { email: senderEmail }, transaction: t });
        const receiver = await User.findOne({ where: { email: receiverEmail }, transaction: t });

        if (sender) {
            req.body.sender.sender_id = sender.id;
            req.body.sender.email = sender.email;
            req.body.sender.registered = true;
        } else {
            req.body.sender.registered = false;
        }

        if (receiver) {
            req.body.receiver.receiver_id = receiver.id;
            req.body.receiver.email = receiver.email;
            req.body.receiver.registered = true;
        } else {
            req.body.receiver.registered = false;
        }

        next();
    } catch (err) {
        await t.rollback();
        console.log(err);
        res.status(500).json({ Error: "Something went wrong" });
    }
}

module.exports = findParticipant;
