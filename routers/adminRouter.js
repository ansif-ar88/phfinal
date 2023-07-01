const express = require("express");
const adminRoute = express();
const multer = require ('multer');
const upload =require ('../config/multer.js')


//========== SET VIEW ENGINE ==============

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/adminViews");

//========== REQUIRE ALL CONTROLLERS ==============

const errorHandler = require('../middleware/errorHandler')
const Auth = require("../middleware/adminAuth")
const adminController = require("../controllers/admincontroller");
const productController = require("../controllers/productcontroller")
const categoryController = require('../controllers/categorycontroller')
const orderController = require('../controllers/ordercontroller.js')
const offerController = require('../controllers/offercontroller.js')
const bannerController = require('../controllers/bannercontroller.js')

//========== USER MANAGEMENT ==============

adminRoute.get("/",Auth.isLogout,adminController.loadLogin);
adminRoute.post("/",adminController.verifyLogin)
adminRoute.get("/dashBoard",Auth.isLogin,adminController.loadDashboard)
adminRoute.get('/logout',Auth.isLogin,adminController.adminLogout)
adminRoute.get('/userList',Auth.isLogin,adminController.userList)
adminRoute.get('/block-user',Auth.isLogin,adminController.block);
adminRoute.get('/unblock-user',Auth.isLogin,adminController.unblock);
adminRoute.get("/dashBoard",Auth.isLogin,adminController.loadDashboard)

adminRoute.get('/salesReport',Auth.isLogin,adminController.loadSalesReport); 
adminRoute.get('/salesSort/:id',Auth.isLogin,adminController.salesSort); 

//========== PRODUCT MANAGEMENT ==============

adminRoute.get('/productList',Auth.isLogin,productController.productList)
adminRoute.get('/editProduct/:id',Auth.isLogin,productController.editProduct);
adminRoute.get('/deleteimg/:imgid/:prodid',Auth.isLogin,productController.deleteimage)
adminRoute.post('/addproduct',upload.upload.array('image',10),productController.insertProduct);
adminRoute.post('/editProduct/:id',upload.upload.array('image',10),productController.editUpdateProduct)
adminRoute.post("/editproducts/updateimage/:id",upload.upload.array('image'),productController.updateimage)
adminRoute.get('/deleteProduct',Auth.isLogin,productController.deleteProduct);

//========== CATEGORY MANAGEMENT ==============

adminRoute.post('/insertCategory', categoryController.insertCategory);
adminRoute.post('/editCategory/:id', Auth.isLogin, categoryController.saveCategory);
adminRoute.get('/categoryList',Auth.isLogin,categoryController.categoryList)
adminRoute.get('/unlistcategory',Auth.isLogin,categoryController.unlistCategory)
adminRoute.get('/listcategory',Auth.isLogin,categoryController.listCategory)

//========== ORDER MANAGEMENT ==============

adminRoute.get("/orders",Auth.isLogin,orderController.loadOrderAdmin)
adminRoute.get("/vieworder/:id",Auth.isLogin, orderController.loadViewSingleAdmin)
adminRoute.post("/updateStatus",Auth.isLogin,orderController.changeStatus)

//========== COUPON AND OFFERS ==============

adminRoute.get("/coupons",Auth.isLogin,offerController.loadCoupon)
adminRoute.post("/addCoupon",Auth.isLogin,offerController.insertCoupon) 
adminRoute.post("/editCoupon/:id",Auth.isLogin,offerController.editCoupon) 
adminRoute.post("/deleteCoupon",Auth.isLogin,offerController.deleteCoupon) 
adminRoute.post("/addOffer",Auth.isLogin,offerController.addOffer)

//========== BANNER MANAGEMENT ==============

adminRoute.get("/banner",Auth.isLogin,bannerController.loadBannerManagement)
adminRoute.post("/addbanner",upload.upload.single('image'),Auth.isLogin,bannerController.addBanner)


adminRoute.post('/editBanner', upload.upload.single('image'),Auth.isLogin, bannerController.editBanner);
 


adminRoute.use(errorHandler)

adminRoute.get("*",function(req,res) {
    res.redirect("/admin")
})

module.exports = adminRoute;
