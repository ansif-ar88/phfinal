const bcrypt = require("bcrypt");
const session = require("express-session");
const usermodel = require("../modals/usermodal");
const productmodel = require("../modals/productmodel")
const cartmodel = require("../modals/cartmodel")
const ordermodel = require("../modals/ordermodel")

const ejs =require('ejs')
const pdf =require('html-pdf')
const fs =require('fs')
const path =require('path')

//============== LOAD LOGIN PAGE ================
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

//=============== VERIFY LOGIN ==============

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await usermodel.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", {
            message: "Not an Admin",
          });
        } else {
          req.session.Auser_id = userData._id;
          res.redirect("/admin/dashBoard");
        }
      } else {
        res.render("login", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("login", {
         message: "Please provide your email and password",
         });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//===================== LOAD DASHBOARD ================

// const  loadDashboard = async (req, res) => {
//   try {
//     const adminData = await usermodel.findById({ _id: req.session.Auser_id });
//     const userData = await usermodel.find({is_admin:0})
//     const totalOrders = await ordermodel.find() 
//     const totalProducts = await productmodel.find()
//     const deliveredOrder = ordermodel.find({'products.status':'Delivered'}).populate('products.productId')
  
//     //  === TOTAL SALES AMOUNT===
//     const totalSales = await ordermodel.aggregate([
//       { $unwind: "$products" },
//       { $match: {'products.status':'Delivered'} },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$products.totalPrice' }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           total: 1
//         }
//       }
//     ]);
//     const total = totalSales[0].total;

//     //==== TOTAL COD ====
//     const CODTotal = await ordermodel.aggregate([
//       { $unwind: "$products" },
//       { $match: { 'products.status': 'Delivered', paymentMethod: 'COD' } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$products.totalPrice' }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           total: 1
//         }
//       }
//     ]);
    
//     let codTotal = 0
//     if (CODTotal.length > 0) {
//       codTotal = CODTotal[0].total;
//     } 

//     //======= TOTAL ONLINEPAYMENT =======

//     const onlinePaymentTotal = await ordermodel.aggregate([
//       { $unwind: "$products" },
//       { $match: { 'products.status': 'Delivered', 'paymentMethod': { $ne: 'COD' } } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$products.totalPrice' }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           total: 1
//         }
//       }
//     ]);
    
//     let onlineTotal = 0;
//     if (onlinePaymentTotal.length > 0) {
//       onlineTotal = onlinePaymentTotal[0].total;
//     }
    
//     res.render("dashBoard"
//     , {
//       admin: adminData,
//       users:userData,
//       total,
//       totalOrders,
//       totalProducts,
//       codTotal,
//       onlineTotal
//     }
//     );
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const loadDashboard = async (req, res) => {
  try {
    const adminData = await usermodel.findById({ _id: req.session.Auser_id });
    const userData = await usermodel.find({ is_admin: 0 });

    const aggregationPipeline = [
      // Total Sales Amount
      {
        $facet: {
          totalSales: [
            { $unwind: "$products" },
            { $match: { "products.status": "Delivered" } },
            {
              $group: {
                _id: null,
                total: { $sum: "$products.totalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
              },
            },
          ],
          CODTotal: [
            // Total COD
            { $unwind: "$products" },
            { $match: { "products.status": "Delivered", paymentMethod: "COD" } },
            {
              $group: {
                _id: null,
                total: { $sum: "$products.totalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
              },
            },
          ],
          onlinePaymentTotal: [
            // Total Online Payment
            { $unwind: "$products" },
            { $match: { "products.status": "Delivered", paymentMethod: { $ne: "COD" } } },
            {
              $group: {
                _id: null,
                total: { $sum: "$products.totalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
              },
            },
          ],
        },
      },
    ];

    const [results] = await ordermodel.aggregate(aggregationPipeline);

    const total = results.totalSales[0]?.total || 0;
    const codTotal = results.CODTotal[0]?.total || 0;
    const onlineTotal = results.onlinePaymentTotal[0]?.total || 0;

    const totalOrders = await ordermodel.find();
    const totalProducts = await productmodel.find();

    res.render("dashboard", {
      admin: adminData,
      users: userData,
      total,
      totalOrders,
      totalProducts,
      codTotal,
      onlineTotal,
    });
  } catch (error) {
    console.log(error.message);
  }
};


//===================== LOGOUT ADMIN ==================

const adminLogout = async (req,res)=>{
  try{
      req.session.destroy();
      res.redirect('/admin')
  }catch(error){
      console.log(error.message);
  }
}

//=================== LOAD ALL USERS ==================

const userList = async (req,res) => {
  try {
    const userData = await usermodel.find({is_admin:0});
    const adminData = await usermodel.findById({ _id: req.session.Auser_id });

    res.render("userList"
    ,{users: userData,admin:adminData}
    );
  } catch (error) {
    console.log(error.message);
  }
}
//============================= BLOCK AND UNBLOCK USER ================================

const block = async (req,res)=> {
    try {
      const userData = await usermodel.findByIdAndUpdate(req.query.id,{$set:{is_blocked:true}})
      req.session.user = null
      res.redirect("/admin/userList")
    } catch (error) {
      console.log(error.message);
    }
}
const unblock = async (req,res)=> {
    try {
      const userData = await usermodel.findByIdAndUpdate(req.query.id,{$set:{is_blocked:false}})
      
      res.redirect("/admin/userList")
    } catch (error) {
      console.log(error.message);
    }
}

//===================== LOAD SALES REPORT ======================

const loadSalesReport = async (req,res) => {
  try {
    const adminId = req.session.Auser_id
    const adminData = await usermodel.findById({ _id: adminId });
    const order = await ordermodel.aggregate([
      { $unwind: "$products" },
      { $match: { 'products.status': 'Delivered' } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$products.productId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
          ],
          as: 'products.productDetails'
        }
      },  
      {
        $addFields: {
          'products.productDetails': { $arrayElemAt: ['$products.productDetails', 0] }
        }
      }
    ]);

    res.render('salesreport',{
      admin:adminData,
      order
    })
  } catch (error) {
    console.log(error.message);
  }
}

const salesSort = async(req,res) =>{
  try {
    const adminData = await usermodel.findById({ _id: req.session.Auser_id });
    const id = parseInt(req.params.id);
    const from = new Date();
    const to = new Date(from.getTime() - id * 24 * 60 * 60 * 1000);
    
    const order = await ordermodel.aggregate([
      { $unwind: "$products" },
      {$match: {
        'products.status': 'Delivered',
        $and: [
          { 'products.deliveryDate': { $gt: to } },
          { 'products.deliveryDate': { $lt: from } }
        ]
      }},
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$products.productId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
          ],
          as: 'products.productDetails'
        }
      },  
      {
        $addFields: {
          'products.productDetails': { $arrayElemAt: ['$products.productDetails', 0] }
        }
      }
    ]);

    res.render("salesreport", { order ,admin:adminData });
   
  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  adminLogout,
  userList,
  block,
  unblock,
  loadSalesReport,
  salesSort
 

  
};
