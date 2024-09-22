const nodemailer = require('nodemailer');

// transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rail.packages@gmail.com', 
        pass: 'oyte amwf npwx zbtv', 
    },
});




const getMailOptions = (email, html)=> {
    const mailOptions={
            from: "RailExpress'<rail.packages@gmail.com>'", 
            to: `${email}`,
            subject: 'Email Receipt Delivery',
            html: html,
        }
    return mailOptions;
}; 



const sendEmail = (sender, receiver, package_id, package_type, station)=>{

    const htmlsender = `<div style="display: flex; align-items: center; flex-direction: column; max-width: 50rem; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">

    <div style="width: 100%; text-align: center;">
    <h3 style="font-family: Arial, Helvetica, sans-serif; text-align: center; color: #333;">Package Submitted Successfully!</h3>

        <span style="font-size: 1.1rem; color: #555;">Your package has been submitted and is on its way!</span>
        <br/><br/>

        <span style="font-size: 1.5rem; font-family: Arial, Helvetica, sans-serif;">Package ID: 
            <span style="font-size: 1.5rem; font-weight: 600; color: #333;">${package_id}</span>
        </span>
        <br/><br/>

        <span style="font-size: 1rem; line-height: 1.6; color: #666;">
            To easily track your package, download mobile app and sign up with your email. 
            Once registered, you can track your package details associated with the email and get real-time updates on its location and delivery status.
            Stay informed every step of the way!
        </span>
        <br/><br/>

        <div style="text-align: left; font-size: 1rem; line-height: 1.6; color: #666;">
            <strong>Contact Information:</strong><br/>
            Hotline: <a href="tel:+94123456789" style="color: #007bff; text-decoration: none;">+94 123 456 789</a><br/>
            Station Address: Colombo Central Station, 123 Main Street, Colombo, Sri Lanka<br/>
            Email: <a href="mailto:rail.packages@gmail.com" style="color: #007bff; text-decoration: none;">rail.packages@gmail.com</a><br/>
            Office Hours: Mon-Fri, 9:00 AM - 6:00 PM
        </div>
    </div>
</div>
`


const htmlreceiver = `
<div style="display: flex; align-items: center; flex-direction: column; max-width: 50rem; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">

    <div style="width: 100%; text-align: center;">
        <h3 style="font-family: Arial, Helvetica, sans-serif; text-align: center; color: #333;">New Package Alert!</h3>

        <span style="font-size: 1.1rem; color: #555;">You are about to receive a package! Please prepare for its arrival.</span>
        <br/><br/>

        <span style="font-size: 1.5rem; font-family: Arial, Helvetica, sans-serif;">Package ID: 
            <span style="font-size: 1.5rem; font-weight: 600; color: #333;">${package_id}</span>
        </span>
        <br/><br/>

        <span style="font-size: 1rem; font-family: Arial, Helvetica, sans-serif;">Package Type: 
            <span style="font-size: 1rem; font-weight: 600; color: #333;">${package_type}</span>
        </span>
        <br/><br/>
        <span style="font-size: 1rem; font-family: Arial, Helvetica, sans-serif;">Pickup Station: 
        <span style="font-size: 1rem; font-weight: 600; color: #333;">${station}</span>
    </span>
    <br/><br/>

        <span style="font-size: 1rem; font-family: Arial, Helvetica, sans-serif;">Sender's Email: 
            <span style="font-size: 1rem; font-weight: 600; color: #333;">${sender}</span>
        </span>
        <br/><br/>

        <span style="font-size: 1rem; line-height: 1.6; color: #666;">
            Once your package arrives, make sure to release it by verifying your identity with this email.
            Download the app and sign up with your email to receive real-time updates on the package's status and complete the release process easily.
        </span>
        <br/><br/>

        <div style="text-align: left; font-size: 1rem; line-height: 1.6; color: #666;">
            <strong>Contact Information:</strong><br/>
            Hotline: <a href="tel:+94123456789" style="color: #007bff; text-decoration: none;">+94 123 456 789</a><br/>
            Station Address: Colombo Central Station, 123 Main Street, Colombo, Sri Lanka<br/>
            Email: <a href="mailto:rail.packages@gmail.com" style="color: #007bff; text-decoration: none;">rail.packages@gmail.com</a><br/>
            Office Hours: Mon-Fri, 9:00 AM - 6:00 PM
        </div>
    </div>
</div>
`;


    const senderOption = getMailOptions(sender, htmlsender)
    const receiverOption = getMailOptions(receiver, htmlreceiver)

    transporter.sendMail(senderOption, (error, info) => {
        if (error) {
            return console.log('Error occurred: send Email to sender ' + error.message);
        }
        console.log('Email sent: ' + info.response);
    });

    transporter.sendMail(receiverOption, (error, info) => {
        if (error) {
            return console.log('Error occurred: send Email to receiver' + error.message);
        }
        console.log('Email sent: ' + info.response);
    });

}



module.exports = {sendEmail};