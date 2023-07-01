const User = require("../modals/usermodal");
const bcrypt = require("bcrypt");
const productmodel = require("../modals/productmodel");
const categorymodel = require("../modals/categorymodel");
const usermodal = require("../modals/usermodal");
const session = require("express-session")
const nodemailer = require("nodemailer")
const cartmodel = require('../modals/cartmodel')
const passwordValidator = require('password-validator');
const bannermodel = require("../modals/bannermodel");
const path = require("path")
const fs = require("fs")
const ejs = require("ejs");
const ordermodel = require("../modals/ordermodel");
const puppeteer = require("puppeteer")

var schema = new passwordValidator();


schema
.is().min(8)                        
.is().max(100)                        
.has().uppercase()                             
.has().lowercase()                             
.has().digits(2)                               
.has().not().spaces()                     


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//================= LOAD REGISTER ===============
const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
  }
};
//================= LOAD LOGIN ===============
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

//================= INSERT USER ===============

const insertUser = async (req, res) => {
  try {
    

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      res.render("signup", {
        message: "email already exists",
      });
    }
    const passStrong = await schema.validate(req.body.password)

    if (!passStrong) {
      res.render("signup", {
        message: "password not strong",
        
      });
      return
    }
    const spassword = await securePassword(req.body.password);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
    });
    email = user.email
    const name = req.body.name
    const userData = await user.save();
    if (userData) {
      randomnumber = Math.floor(Math.random() * 9000) + 1000;
      otp = randomnumber;
      sendVerifyMail(name,req.body.email,randomnumber)
      res.redirect("/otp");
    } else {
      res.render("signup", { message: "Registration Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//=================== SEND VERIFICATION EMAIL =================

const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.verificationEmail,
        pass: process.env.passotp
      }
    });

    const mailOptions = {
      from: process.env.verificationEmail,
      to: email,
      subject: 'Verification Email',
      html: `<p>Hi ${name}, please click <a href="http://localhost:1002/otp">here</a> to verify and enter your verification email. This is your OTP: ${otp}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email has been sent:', info.response);
    console.log(otp);
  } catch (error) {
    console.log(error);
  }
};


//================= LOAD OTP ===============

const loadVerification = async(req,res) => {
  try {
    res.render("otp")
  } catch (error) {
    console.log(error.message);
  }
}

//============ VERIFY OTP ==============

const verifyEmail = async (req,res)=>{
  const otp2= req.body.otp;
  try { 
      if(otp2 == otp){
          const UserData = await User.findOneAndUpdate({email:email},{$set:{is_verified:1}});
          if(UserData){
            res.redirect("/login");
          }
          else{
              console.log('something went wrong');
          }
      }
      else{
          res.render('otp',{message:"Please Check the OTP again!"})
      }
  } catch (error) {
      console.log(error.message);
  }
}

//================= VERIFY LOGIN ===============
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          if (userData.is_blocked == true) {
            res.render("login", { message: "YOU ARE BLOCKED BY ADMIN" });
          } else {
            req.session.user_id = userData._id;

            res.redirect("/home");
          }
        } else {
          res.render("login", { message: "Email or password is incorrect" });
        }
      } else {
        res.render("login", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("login", {
        message: "Please provide your correct Email and password ",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//================= LOAD HOME PAGE ===============

const loadHome = async (req, res,next) => {
  try {
    const id = req.session.user_id
    const session = id
    const productdata = await productmodel.find({ Status: true })
    const banners = await bannermodel.find()

    if(id){
      
      const userData = await usermodal.findById({_id: id})
      res.render("home",{productData:productdata,userData:userData,session,banners})
    }else{
      const session = null
      res.render("home",{productData:productdata,session,banners})
    }
  } catch (error) {
    console.log(error.message);
  }

}


// =================== LOGOUT  ======================

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//================= LOAD SHOP PAGE ===============

const loadShop = async (req, res,next) => {
  try {
    const productdata = await productmodel.find({ Status: true });

    const session = req.session.user_id;
    const catData = await categorymodel.find({ is_deleted: false });
    let userdata = null;

    if (req.session.user_id) {
      userdata = await usermodal.findById(req.session.user_id);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const productCount = productdata.length;
    const totalPages = Math.ceil(productCount / limit);
    const paginatedProducts = productdata.slice(startIndex, endIndex);

    res.render("shop", {
      userData: userdata,
      category: catData,
      session,
      productData: paginatedProducts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

//================= LOAD SINGLE PRODUCT ===============



const loadShowproduct = async (req, res,next) => {
  try {
    if (req.session.user_id) {
     const session = req.session.user_id
     const id = req.params.id

      const data = await productmodel.findOne({ _id: id });
      const userData = await usermodal.findById({_id: req.session.user_id})
      res.render("showProduct", {       
        productData: data,userData:userData,session });
    } else {
           const session = null
           const id = req.params.id
      const data = await productmodel.findOne({ _id: id });
      res.render("showProduct", { productData: data ,session});
    }
  } catch (error) {
    next(error);
  }
};


// ====================== LAOAD PROFILE =============

const loadProfile = async (req, res,next) => {
  try {
    if(req.session.user_id){
      const session = req.session.user_id
      const id = req.session.user_id
      const userdata = await usermodal.findById({_id: req.session.user_id})
      res.render("account", { userData: userdata,session });
    }else{
      const session = null
      res.redirect("/home",{message:"please login"})
    }
    
    
  } catch (error) {
    next(error);
  }
};

//====================== FILTER BY CATEGORY ==================

const filterByCategory =async (req,res,next)=>{
  try {
    const id = req.params.id
    const session = req.session.user_id
    const catData = await categorymodel.find({is_deleted:false })
    const userData = await usermodal.find({})
    const productData = await productmodel.find({category:id,Status: true }).populate('category')
    
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const productCount = productData.length;
    const totalPages = Math.ceil(productCount / limit);
    const paginatedProducts = productData.slice(startIndex, endIndex);
    if (catData.length > 0) {
      res.render("shop",{session,userData:userData,productData:paginatedProducts,currentPage: page,
        totalPages: totalPages,
        category:catData,})
    } else {
      res.render("shop",{session,userData:userData,productData:[],category:catData,currentPage: page,
        totalPages: totalPages,})

    }
  } catch (error) {
    next(error);
  }
}

//===================== SEARCH PRODUCT ====================

const searchProduct = async (req,res,next)=>{
  try{
     const searchData = req.body.search;
     const search = searchData.trim()
     const session = req.session.user_id;
     const userData = await usermodal.find({})
     const categoryData = await categorymodel.find({is_deleted:false});
      const productData = await productmodel.find({productName:{$regex: `^${search}`,$options:'i'}});     
      const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const productCount = productData.length;
    const totalPages = Math.ceil(productCount / limit);
    const paginatedProducts = productData.slice(startIndex, endIndex);
     
     if(productData.length > 0){
      res.render('shop',{session,
        category:categoryData,
        productData:paginatedProducts,
        userData:userData,
        currentPage: page,
        totalPages: totalPages,});
     }else{
      res.render('shop',{session,
        category:categoryData,
        productData:paginatedProducts,
        userData:userData,
        currentPage: page,
        totalPages: totalPages,});
     }

  }catch(error){
    next(error);
  }
}

const priceSort = async(req,res,next) => {
  try {
    const id = req.params.id
    const session = req.session.user_id;
     const userData = await usermodal.find({})
     const categoryData = await categorymodel.find({is_deleted:false});
     const productData = await productmodel.find({ Status: true }).populate('category').sort({price: id})

     const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const productCount = productData.length;
    const totalPages = Math.ceil(productCount / limit);
    const paginatedProducts = productData.slice(startIndex, endIndex);
    if (productData){
      res.render('shop',{session,category:categoryData,productData:paginatedProducts,userData:userData,      currentPage: page,
        totalPages: totalPages,});
    }else {
      res.render('shop',{session,category:categoryData,productData:paginatedProducts,userData:userData,      currentPage: page,
        totalPages: totalPages,});
    }

  } catch (error) {
    next(error);
  }
  

}
//======================== LOAD FORGOT PASSWORD ===================
const forgotPassword = async (req,res,next) =>{
  try {
    res.render("forgotPassword")
  } catch (error) {
    next(error);
  }
}

//======================== SEND OTP FORGOT PASSWORD ===================

let otpv;
let emailv;
const forgotVerifyMail = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await usermodal.findOne({ email: email });
    const name = userData.name;
    console.log(userData);
    if (userData) {
      randomnumber = Math.floor(Math.random() * 9000) + 1000;
      otpv = randomnumber;
      emailv = email; 
      sendVerifyMail(name, email, randomnumber);
      res.render("forgotPassword", { message: "please check your email" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//======================== VERIFY OTP ===================

const verifyForgotMail = async (req, res) => {
  try {
    const otp = req.body.otp;
    console.log(otp);
    if (otp == otpv) {
      res.render("resubmitPassword");
    } else {
      res.render("forgotPassword", { message: "otp is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//======================== RESUBMIT PASSWORD ===================

const resubmitPassword = async (req, res,next) => {
  try {
    if (req.body.password != req.body.password2) {
      res.render("resubmitPassword", {
        message: "Password Not Matching",
      });
      return;
    }
    const passwordValidate = await schema.validate(req.body.password);

    if (!passwordValidate) {
      res.render("resubmit-password", {
        message: "Password Must Be Strong",
      });
      return;
    }

    const spassword = await securePassword(req.body.password);

    const changePassword = await usermodal.findOneAndUpdate(
      { email: emailv },
      { $set: { password: spassword } }
    );

    if (changePassword) {
      res.render("resubmitPassword", {
        message: "Password successfully changed",
      });
    } else {
      res.render("resubmitPassword", {
        message: "Please try again!!",
      });
    }
  } catch (error) {
    next(error);
  }
};

const loadinvoice = async (req, res,next) => {
  try {
    const id = req.params.id;
    const session = req.session.user_id;
    const userData = await usermodal.findById({_id:session})
    const orderData = await ordermodel.findOne({_id:id}).populate('products.productId');
    const date = new Date()
   
     data = {
      order:orderData,
      user:userData,
      date,
    }

    const filepathName = path.resolve(__dirname, '../views/userViews/invoice.ejs');
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: 'networkidle0' });
    const pdfBytes = await page.pdf({ format: 'Letter' });
    await browser.close();

   
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename= order invoice.pdf');
    res.send(pdfBytes);

  } catch (err) {
    next(error);
  }
};

module.exports = {
  loadHome,
  insertUser,
  loadRegister,
  verifyLogin,
  loadLogin,
  userLogout,
  loadShop,
  loadShowproduct,
  loadProfile,
  loadVerification,
  sendVerifyMail,
  verifyEmail,
  filterByCategory,
  searchProduct,
  priceSort,
  forgotPassword,
  forgotVerifyMail,
  verifyForgotMail,
  resubmitPassword,
  loadinvoice,
};

