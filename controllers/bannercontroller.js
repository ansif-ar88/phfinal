const usermodel = require("../modals/usermodal")
const bannermodel = require("../modals/bannermodel")

//======================== LOAD BANNER MANAGEMENT ===============

const loadBannerManagement = async(req,res,next) => {
    try {
        const adminData = await usermodel.find({is_admin : 1})
        const banners = await bannermodel.find()
        res.render("bannerManagement",{admin:adminData,banners})
    } catch (error) {
        next(error);
    }
}
//================ ADD BANNER ====================

const addBanner = async (req,res,next) =>{
  try {
    const heading = req.body.heading
    let image ='';
    if(req.file){
      image = req.file.filename
    }
    const Banner = new bannermodel({
      heading:heading,
      image:image
    })
    Banner.save()
    res.redirect("/admin/banner")
  } catch (error) {
    next(error);
  }
}

//================ EDIT BANNER ====================

const editBanner = async (req,res,next) =>{

  try {
   
    const id = req.body.id
    const heading = req.body.heading
    let image = req.body.img

    if(req.file){
      image = req.file.filename
    }
    await bannermodel.findOneAndUpdate({_id:id},{
      $set:{
        heading:heading,
        image:image
      }
    })
    res.redirect("/admin/banner")
  } catch (error) {
    next(error);
  }
}

module.exports = {
    loadBannerManagement,
    addBanner,
    editBanner,
}