const dotenv = require("dotenv")
dotenv.config()
const mongoose = require("mongoose");
mongoose.connect(process.env.mongo)
const express = require("express");
const app = express();
const session = require("express-session");
const nocache = require ("nocache")

const morgan = require('morgan');
// app.use(morgan('tiny'));


//================= SESSION ===============

app.use(
    session({
        secret:process.env.sessionSecret,
        saveUninitialized:true,
        resave:false,
        // cookie:{
        //     maxAge:500000,
        // },
    })
);
app.use(nocache())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path =require('path')
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));


//========= ADMIN ROUTE =============

const adminRoute = require('./routers/adminRouter');
app.use('/admin', adminRoute);

//========= USER ROUTE =============

const userRoute = require('./routers/userRouter');
app.use('/', userRoute);

//============ PORT ===========

app.listen(process.env.portnumber, () => {
  console.log("Server connected on port 3000");
});
