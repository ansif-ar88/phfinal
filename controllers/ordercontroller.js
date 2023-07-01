const session = require("express-session")
const usermodel = require('../modals/usermodal')
const addressmodel = require ('../modals/addressmodel')
const couponmodel =require('../modals/couponmodel')
const cartmodel = require('../modals/cartmodel')
const ordermodel = require('../modals/ordermodel')
const { now } = require("mongoose")
const productmodel = require("../modals/productmodel")
const razorpay = require("razorpay")
const crypto = require("crypto")



//================== LOLAD CHECKOUT =====================

const loadChekout = async(req,res,next)=>{
    try {
      const session = req.session.user_id
      const couponData = await couponmodel.find({})
      const userData = await usermodel.findOne ({_id:req.session.user_id});
      const addressData = await addressmodel.findOne({userId:req.session.user_id});
      const currentDate = new Date();

      const validCoupons = couponData.filter(item => item.expiryDate > currentDate);          
      const total = await cartmodel.aggregate([
        { $match: { userId: req.session.user_id } },
        { $unwind: "$products" },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$products.productPrice", "$products.count"] } },
          },
        },
      ]);
  
      if(req.session.user_id){
        if(addressData){
            if(addressData.addresses.length>0){
              const address = addressData.addresses
              const Total = total.length > 0 ? total[0].total : 0; 
              const totalAmount = Total;
              res.render('checkOut',{session,Total,address:address,totalAmount,userData:userData,coupons:validCoupons})
            }
            else{
                const Total = total.length > 0 ? total[0].total : 0; 
                const totalAmount = Total;
              res.render('emptyCheckout',{session,Total,totalAmount,userData:userData,coupons:validCoupons,message:"Add your delivery address"});
            }
          }else{
            const Total = total.length > 0 ? total[0].total : 0; 
            const totalAmount = Total;
            res.render('emptyCheckout',{session,Total,totalAmount,userData:userData,coupons:validCoupons,message:"Add your delivery address"});
          }
        }else{
          res.redirect('/')
        }
    } catch (error) {
      next(error);
    }
  }




var instance = new razorpay({
  key_id: process.env.RazorpayKeyId,
  key_secret: process.env.RazorpayKeySecret,
});

// ============ PLACE ORDER =================

const placeOrder = async (req,res,next) => {
  try {
    const id = req.session.user_id
    const userName = await usermodel.findOne({_id:id})
    const address = req.body.address
    const paymentMethod = req.body.payment
    const cartData =  await cartmodel.findOne({userId:id})
    const products = cartData.products

    const Total = parseInt(req.body.amount)
   

    const status = paymentMethod === "COD" ? "placed" : "pending";
    const order = new ordermodel({
      deliveryAddress:address,
      userId: id,
      userName:userName.name,
      paymentMethod: paymentMethod,
      products: products,
      totalAmount:Total,
      // Amount:totalPrice,
      date:new Date(),
      status:status,

    })
   
    const orderData = await order.save()
    if (orderData) {
     
      if(order.status === 'placed'){
        for(let i= 0;i<products.length;i++){
          const pro =products[i].productId;
          const count = products[i].count;
          await productmodel.findByIdAndUpdate({_id:pro},{$inc:{StockQuantity: -count}});
  
        }
        await cartmodel.deleteOne({userId:id})  
        res.json({codSuccess : true})
      }else{
        if(paymentMethod == 'Wallet'){
          const walletAmount = userName.wallet
          if(walletAmount >= Total){
            for(let i= 0;i<products.length;i++){
              const pro =products[i].productId;
              const count = products[i].count;
              await productmodel.findByIdAndUpdate({_id:pro},{$inc:{StockQuantity: -count}});     
            }
            await usermodel.findByIdAndUpdate({_id:id},{$inc:{wallet : -Total}})
            await cartmodel.deleteOne({userId:id}) 
            const orderId = order._id 
            await ordermodel.findByIdAndUpdate({_id:orderId},{$set:{status: 'placed'}})
            res.json({codSuccess : true})
            
          }else{
            res.json({walletFailed:true})
          
          }
        }else{
        const orderId = orderData._id;
        const totalAmount = orderData.totalAmount;
        var options = {
          amount : totalAmount*100,
          currency : 'INR',
          receipt : ''+ orderId
        }
        instance.orders.create(options,function(err,order){
          res.json({order})
        })
      }
    }
    } else {
      res.redirect("/checkout")
    }
  } catch (error) {
    next(error);
  }
}

//===================== RAZORPAY VERIFY PAYMENT ===================

const verifyPayment = async(req,res)=>{
  try {
    const details = req.body
    const id = req.session.user_id
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256',process.env.RazorpayKeySecret);
    hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
    const hmacValue = hmac.digest('hex');
    const cartData =  await cartmodel.findOne({userId:id})
    const products = cartData.products
    if(hmacValue === details.payment.razorpay_signature){
      for(let i= 0;i<products.length;i++){
        const pro =products[i].productId;
        const count = products[i].count;
        await productmodel.findByIdAndUpdate({_id:pro},{$inc:{StockQuantity: -count}});

      }

      await ordermodel.findOneAndUpdate({_id:details.order.receipt},{$set:{status:"placed"}});
      await ordermodel.findOneAndUpdate({_id:details.order.receipt},{$set:{paymentId:details.payment.razorpay_payment_id}})
      await cartmodel.deleteOne({userId:req.session.user_id})
      res.json({success:true});
    }else{
      await ordermodel.findByIdAndRemove({_id:details.order.receipt});
      res.json({success:false})
    }
  } catch (error) {
    console.log(error.message);
  }
}

// ==================== LOAD ORDERS IN USER SIDE ================== 

const loadOrderUser = async(req,res,next) => {
  try {
      const session = req.session.user_id
      const id = req.session.user_id
      const userdata = await usermodel.findById({_id: id})
      await ordermodel.deleteMany({status:'pending'})
      const orders = await ordermodel.find({userId:id}).populate("products.productId")
      if(orders.length > 0){

        res.render("orders", { userData: userdata,session,orders:orders });

    }else{
      // const session = null
      // res.redirect("/home",{message:"please login"})
      res.render("orders", { userData: userdata,session,orders:[] });

    }
  } catch (error) {
    next(error);
  }
}

// ==================== LOAD ORDERS IN ADMIN SIDE ================== 

const loadOrderAdmin = async(req,res,next) => {
  try {
      const session = req.session.Auser_id
      const id = req.session.user_id
      const adminData = await usermodel.findOne({is_admin : 1})
      await ordermodel.deleteMany({status:'pending'})
      const orders = await ordermodel.find().populate("products.productId")

      if(orders.length > 0){

        res.render("orders", {orders:orders,admin:adminData});

    }else{
      res.render("orders", { orders:[],admin:adminData });

    }
  } catch (error) {
    next(error);
  }
}

//======================== LOAD SINGLE ORDER USER SIDE =================

const loadViewSingleUser = async (req,res,next)=> {
  try {
    const id = req.params.id;
    const session =req.session.user_id
    const userdata = await usermodel.findOne({_id: session})
    const orders = await ordermodel.findOne({_id:id}).populate("products.productId")
  
    res.render("singleOrder",{session,userData:userdata,orders:orders})
  } catch (error) {
    next(error);
  }
}


//======================== LOAD SINGLE ORDER ADMIN SIDE =================

const loadViewSingleAdmin = async (req,res,next)=> {
  try {
    const id = req.params.id
    const adminData = await usermodel.findOne({is_admin : 1})
    const orderData = await ordermodel.findOne({_id:id}).populate("products.productId")
    res.render("singleOrder",{admin:adminData,orders:orderData})
  } catch (error) {
    next(error);
  }
}

//======================== CANCEL ORDER =====================
const CancelOrder = async (req, res) => {
  try {
    const id = req.body.orderid;
    const reason = req.body.reason
    const ordersId = req.body.ordersid;
    const Id = req.session.user_id
    const userData = await ordermodel.findById(Id)
    const orderData = await ordermodel.findOne({ userId: Id, 'products._id': id})
    const product = orderData.products.find((Product) => Product._id.toString() === id);
    const cancelledAmount = product.totalPrice
    const proCount = product.count
    const proId = product.productId   
    const updatedOrder = await ordermodel.findOneAndUpdate(
      {
        userId: Id,
        'products._id': id
      },
      {
        $set: {
          'products.$.status': 'cancelled',
          'products.$.cancelReason': reason
        }
      },
      { new: true }
    );


    if (updatedOrder) {
         await productmodel.findByIdAndUpdate({_id:proId},{$inc:{StockQuantity:proCount}})
      if(orderData.paymentMethod === 'onlinePayment' || orderData.paymentMethod === 'Wallet'){
         await usermodel.findByIdAndUpdate({_id:Id},{$inc:{wallet:cancelledAmount}})
        //  await ordermodel.findByIdAndUpdate({_id:Id},{$inc:{totalAmount:-cancelledAmount}})

        await ordermodel.findByIdAndUpdate(Id, { $inc: { totalAmount: -cancelledAmount } });

         res.redirect("/vieworder/" + ordersId)
      }else{
        res.redirect("/vieworder/" + ordersId)
      }
    } else {
      res.redirect("/vieworder/" + ordersId)
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ================ CHANGE STATUS OR FLOW OF ORDER CHANGE =============
const changeStatus = async(req,res) =>{
  try {
    const id = req.body.id
    const userId = req.body.userId
    const statusChange = req.body.status
    
    const updatedOrder = await ordermodel.findOneAndUpdate(
      {
        userId: userId,
        'products._id': id
      },
      {
        $set: {
          'products.$.status': statusChange
        }
      },
      { new: true }
    );
    if(statusChange == "Delivered"){
      const updatedOrder = await ordermodel.findOneAndUpdate(
        {
          userId: userId,
          'products._id': id
        },
        {
          $set: {
            'products.$.deliveryDate': new Date()
          }
        },
        { new: true }
      );
    }
    if(updatedOrder){
      res.json({success:true})
    }
  } catch (error) {
    console.log(error.message);
  }
}

// ================== RETURN ORDER ==================

const returnOrder = async(req,res) =>{
  try {
    const ordersId = req.body.ordersid;
    const Id = req.session.user_id
    const id = req.body.orderid;
    const reason = req.body.reason
    const userData = await ordermodel.findById(Id)
    const orderData = await ordermodel.findOne({ userId: Id, 'products._id': id})
    const product = orderData.products.find((Product) => Product._id.toString() === id);
    const returnAmount = product.totalPrice
    const proCount = product.count
    const proId = product.productId 
    
    const updatedOrder = await ordermodel.findOneAndUpdate(
      {
        userId: Id,
        'products._id': id
      },
      {
        $set: {
          'products.$.status': 'Product Returned',
          'products.$.returnReason': reason
        }
      },
      { new: true }
    );

    if(updatedOrder){

      await productmodel.findByIdAndUpdate({_id:proId},{$inc:{StockQuantity:proCount}})
      await usermodel.findByIdAndUpdate({_id:Id},{$inc:{wallet:returnAmount}})
      res.redirect("/vieworder/" + ordersId)
    }else{
       res.redirect("/vieworder/" + ordersId)
    }
   

  } catch (error) {
    console.log(error.message);
  }
}

  module.exports = {
    loadChekout,
    placeOrder,
    loadOrderUser,
    loadViewSingleUser,
    verifyPayment,
    loadOrderAdmin,
    loadViewSingleAdmin,
    CancelOrder,
    changeStatus,
    returnOrder,



    
  }