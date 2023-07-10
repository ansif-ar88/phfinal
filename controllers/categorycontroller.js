const product = require ("../modals/productmodel")
const category = require("../modals/categorymodel")
const usermodel = require('../modals/usermodal')
const uc = require('upper-case')
let mes


//========== LIST CATEGORY ==========

const categoryList =  async (req,res,next) =>{
    try {
        const catData = await category.find({});
        const adminData = await usermodel.findById({ _id: req.session.Auser_id });

        res.render('categoryList',{category:catData,mes,admin : adminData})    
    } catch (error) {
        next(error);
    }
}

//======== ADD CATEGORY=================

const insertCategory = async (req,res,next) =>{
    try {
        if(req.session.Auser_id){
            const catName = uc.upperCase(req.body.categoryName);
            const Category = new category({categoryName : catName});
            if(catName.trim().length === 0){
                res.redirect('/admin/categoryList');
                // mes = "invalid typing"
            }else{
                const categoryDatas = await category.findOne({categoryName:catName});
                if(categoryDatas){
                    mes ='This category is already exist'
                    res.redirect('/admin/categoryList');
                }else{
                    const categoryData = await Category.save()
                    if(categoryData){ 
                        res.redirect('/admin/categoryList')
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

const saveCategory = async(req,res,next) =>{
    try {
        const id = req.params.id
        const name = uc.upperCase(req.body.categoryName);
        const catData = await category.findOneAndUpdate({_id:id}  ,{$set:{categoryName:name}});
        
        if(catData){
            res.redirect('/admin/categoryList')
        }
    } catch (error) {
        next(error);
    }
}

//============== LIST AND UNLIST CATEGORY ==============

const unlistCategory = async (req, res,next) => {
    try {
        const categoryData = await category.findByIdAndUpdate(req.query.id,{$set:{is_deleted : true}})
        res.redirect("/admin/categoryList")
    } catch (error) {
        next(error);
    }
     
  };
const listCategory = async (req, res,next) => {
    try {
        const categoryData = await category.findByIdAndUpdate(req.query.id,{$set:{is_deleted : false}})
        res.redirect("/admin/categoryList")
    } catch (error) {
        next(error);
    }
     
  };




module.exports = {
    categoryList,
    insertCategory,
    saveCategory,
    listCategory,
    unlistCategory,
    
}