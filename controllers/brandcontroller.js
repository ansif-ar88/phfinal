const brand = require("../modals/brandmodel")
const usermodel = require('../modals/usermodal')
const uc = require('upper-case')
let mes

//============== LIST BRANDS ================

const brandList =  async (req,res,next) =>{
    try {
        const brandData = await brand.find({});
        const adminData = await usermodel.findById({ _id: req.session.Auser_id });

        res.render('brandList',{brand:brandData,admin : adminData})    
    } catch (error) {
        next(error);
    }
}

//============== ADD BRANDS ================
const insertBrand = async (req,res,next) =>{
    try {
        if(req.session.Auser_id){
            const brandName = uc.upperCase(req.body.brandName);
            const Brand = new brand({brandName : brandName});
            if(brandName.trim().length === 0){
                res.redirect('/admin/brand');
                // mes = "invalid typing"
            }else{
                const brandDatas = await brand.findOne({brandName:brandName});
                if(brandDatas){
                    mes ='This brand is already exist'
                    res.redirect('/admin/brand');
                }else{
                    const brandData = await Brand.save()
                    if(brandData){ 
                        res.redirect('/admin/brand')
                    }else{
                        res.redirect('/admin/dashBoard');
                    }
                }
            }
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        next(error);
    }
}

//================== UPDATE AND SAVE==========

const editBrand = async(req,res,next) =>{
    try {
        const id = req.params.id
        const name = uc.upperCase(req.body.brandName);
        const brandData = await brand.findOneAndUpdate({_id:id}  ,{$set:{brandName:name}});
        
        if(brandData){
            res.redirect('/admin/brand')
        }
    } catch (error) {
        next(error);
    }
}
//============== LIST AND UNLIST BRAND ==============

const unlistbrand = async (req, res,next) => {
    try {
        const brandData = await brand.findByIdAndUpdate(req.params.id,{$set:{is_deleted : true}})
        res.redirect("/admin/brand")
    } catch (error) {
        next(error);
    }
     
  };
const listbrand = async (req, res,next) => {
    try {
        const brandData = await brand.findByIdAndUpdate(req.params.id,{$set:{is_deleted : false}})
        res.redirect("/admin/brand")
    } catch (error) {
        next(error);
    }
     
  };
  
module.exports = {
    brandList,
    insertBrand,
    editBrand,
    unlistbrand,
    listbrand

}