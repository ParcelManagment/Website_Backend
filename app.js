const express = require('express')
const cors = require('cors'); 
const app = express()

const {connectDb, getConnection} = require('./database/database.js')
const users = require('./routes/users.js');
const staff = require('./routes/station_staff.js');
const packageRouter = require('./routes/package.js');
const cookieParser = require('cookie-parser');
const sequelize = require("./database/connectSequelize.js");
const syncDb = require('./database/syncDb');
const User = require('./models/user.js');
const Package = require("./models/package.js")
const port = 3000


//syncDb()



app.use(cors({
  origin: 'http://localhost:3001', // Adjust to your front-end's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));



connectDb();

app.use(express.json())
app.use(cookieParser())

app.use('/users', users); // user registration and login
app.use('/staff', staff); // staff login and registration
app.use('/package', packageRouter);  //  package creation and manupulation


app.get('/', (req, res) => {
  res.send('entry point')
})

app.get('/login', (req, res) => {
  res.send('This is login')
})
app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})