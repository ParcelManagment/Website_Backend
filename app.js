const express = require('express')
const app = express()
const {connectDb, getConnection} = require('./database/database.js')
const users = require('./routes/users.js');
const staff = require('./routes/station_staff.js');
const packageRouter = require('./routes/package.js');
const message = require('./routes/message.js');
const cookieParser = require('cookie-parser');
const sequelize = require("./database/connectSequelize.js");
const syncDb = require('./database/syncDb');
const User = require('./models/user.js');
const Package = require("./models/package.js");
const cors = require('cors');
const port = 3000

app.use(cors());

//syncDb()


connectDb();

app.use(express.json())
app.use(cookieParser())

app.use('/users', users); // user registration and login
app.use('/staff', staff); // staff login and registration
app.use('/package', packageRouter);  //  package creation and manupulation
app.use("/message",message);
app.get('/logout', (req, res, next)=>{
  res.clearCookie('token');
  res.send("loggedout")

})

app.get('/', (req, res) => {
  res.send('entry point')
})

app.get('/login', (req, res) => {
  res.send('This is login')
})

app.get("/hello", (req, res) => {
  const message = "Hello message";
  res.send(message);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})