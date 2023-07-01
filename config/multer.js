const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,path.join(__dirname,'../public/adminAssets/adminImages'))
    },
    filename: function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const imageFilter = function(req,file,cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        req.fileValidationError = 'only image files allowed!';
        return cb(new Error('only image file allowed!'),false);
    }
    cb(null,true)
}
const upload = multer({storage:storage,imageFilter})

module.exports = {
    upload,
}
