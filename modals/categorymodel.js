const mongoose = require ('mongoose');
//  const { type } = require('os');

 const CategorySchema = new mongoose.Schema({
    categoryName :{
        type:String,
        required : true
    },
    is_deleted :{
        type:Boolean,
        default:false
    }
 })
 module.exports = mongoose.model('Catagory',CategorySchema);

