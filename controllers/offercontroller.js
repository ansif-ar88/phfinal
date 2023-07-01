const couponmodel = require("../modals/couponmodel")
const usermodel = require ('../modals/usermodal')
const productmodel = require('../modals/productmodel')

//============= LOAD COUPON PAGE ===========

const loadCoupon = async (req,res,next) => {
try {
    const adminData = req.session.Auser_id
    const coupon = await couponmodel.find({})
    if(coupon){
        res.render("coupon",{admin:adminData,coupons:coupon})
    }else{
        res.render("coupon",{admin:adminData,coupons:[]})
    }
    
} catch (error) {
    next(error);
}
}

//============= INSERT COUPON ===========

const insertCoupon = async(req,res,next)=>{
    try {
        const coupon = new couponmodel({
            couponName:req.body.couponName,
            couponCode:req.body.couponCode,
            discountPercentage:req.body.discountPercentage,
            startDate:req.body.startDate,
            expiryDate:req.body.expDate,
            criteria:req.body.criteria,
    
        })
        const couponData = await coupon.save()
        if(couponData){
            res.redirect("/admin/coupons")
        }else{
            res.redirect("/admin/coupons")
        }
        
    } catch (error) {
        next(error);
    }
}

//========================== EDIT COUPON ======================

const editCoupon = async(req,res,next) => {
    try {
        const id = req.params.id
        const editedCoupon = await couponmodel.findByIdAndUpdate({_id:id},{$set:{
            couponName:req.body.couponName.trim(),
            couponCode:req.body.couponCode.trim(),
            discountPercentage:req.body.discountPercentage.trim(),
            startDate:req.body.startDate,
            expiryDate:req.body.expDate,
            criteria:req.body.criteria,
    }})
    if(editedCoupon){
        res.redirect("/admin/coupons")
    }else{
        res.redirect("/admin/coupons")
    }
    } catch (error) {
        next(error);
    }
 }   


//========================== DELETE COUPON ======================

const deleteCoupon = async(req,res,next) => {
    try {
        const id = req.body.id
        console.log(id);
        const DeleteCoupon = await couponmodel.findByIdAndDelete(id)
        if(DeleteCoupon){
            res.redirect("/admin/coupons")
        }else{
            res.redirect("/admin/coupons")
        }
    } catch (error) {
        next(error); 
    }
}

//================== APPLYCOUPON ==================

const applyCoupon = async(req,res,next)=>{
    try {
      const code = req.body.code;
     
      const amount = Number(req.body.amount)
      const userExist = await couponmodel.findOne({couponCode:code,user:{$in:[req.session.user_id]}})
      if(userExist){
        res.json({user:true})
      }else{
        const coupondata = await couponmodel.findOne({couponCode:code})
        if(coupondata){
            if(coupondata.expiryDate <= new Date()){
                res.json({date:true})
            }else{
                if(amount < coupondata.criteria){
                    res.json({notEligible:true})
                }else{
                await couponmodel.findOneAndUpdate({_id:coupondata._id},{$push:{user:req.session.user_id}}) 
                const perAmount = Math.round((amount * coupondata.discountPercentage)/100 )
                const disTotal = Math.round(amount - perAmount)
                return res.json({amountOkey:true,disAmount:perAmount,disTotal})
            }
            }
        }
      }
      res.json({invalid:true})
    } catch (error) {
        next(error);
    }
}
//=============== ADD OFFER ==============

const addOffer = async(req,res,next) =>{
    try {
        const id = req.body.id
        const offName = req.body.offName
        const offPercentage = req.body.offPercentage
        const productData = await productmodel.findById(id)
        const price = productData.price
        const offerAmt = Math.round(price * offPercentage/100)
        const offerPrice = price - offerAmt
        const offAdd = await productmodel.findByIdAndUpdate(id,{$set:{
            offName: offName,
            offPercentage:offPercentage,
            offPrice:offerPrice
        }})
        if(offAdd){
            res.redirect("/admin/productList")
        }else{
            res.redirect("/admin/productList")
        }  

    } catch (error) {
        next(error);
    }
}

module.exports = {
    loadCoupon,
    insertCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon,
    addOffer
}