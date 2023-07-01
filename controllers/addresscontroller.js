const session = require("express-session");
const addressmodel = require("../modals/addressmodel");
const usermodal = require("../modals/usermodal");



//================== LOAD ADD ADDRESS ===================

const loadAddAddress = async (req, res,next) => {
  try {
    if (req.session.user_id) {
      const session = req.session.user_id;
      const id = req.session.user_id;
      const userdata = await usermodal.findById({ _id: req.session.user_id });
      res.render("addAddress", { userData: userdata, session });
    } else {
      const session = null;
      res.redirect("/home", { message: "please login" });
    }
  } catch (error) {
    next(error);
  }
};

//==================== ADD ADDRESS ====================

const addAddress = async (req, res) => {
  try {
    const addressDetails = await addressmodel.findOne({
      userId: req.session.user_id,
    });
    if (addressDetails) {
      const updateOne = await addressmodel.updateOne(
        { userId: req.session.user_id },
        {
          $push: {
            addresses: {
              userName: req.body.name,
              mobile: req.body.mobile,
              houseName: req.body.house,
              landmark: req.body.landmark,
              city: req.body.city,
              state: req.body.state,
              pincode: req.body.pincode,
            },
          },
        }
      );
      if (updateOne) {
        res.redirect("/checkout");
      } else {
        res.redirect("/");
      }
    } else {
      const address = new addressmodel({
        userId: req.session.user_id,
        addresses: [
          {
            userName: req.body.name,
            mobile: req.body.mobile,
            houseName: req.body.house,
            landmark: req.body.landmark,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
          },
        ],
      });
      const addressData = await address.save();
      if (addressData) {
        res.redirect("/checkout");
      } else {
        res.redirect("/checkout");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//==================== LOAD EDIT ADDRESS ======================

const loadEditAddress = async (req,res,next) => {
  try {
    const id = req.params.id;
    const session = req.session.user_id;
    const userData = await usermodal.findOne({ _id: req.session.user_id });
    const addressDetails = await addressmodel.findOne(
      { userId: session },
      { addresses: { $elemMatch: { _id: id } } }
    );
    const address = addressDetails.addresses;
    res.render("editAddress", {
      session,
      userData: userData,
      address: address[0],
    });
  } catch (error) {
    next(error);
  }
};
//================================ EDIT AND SAVE ADDRESS ===================

const editAddress = async (req, res) => {
  if (
    req.body.name.trim() === "" ||
    req.body.mobile.trim() === "" ||
    req.body.house.trim() === "" ||
    req.body.landmark.trim() === "" ||
    req.body.city.trim() === "" ||
    req.body.state.trim() === "" ||
    req.body.pincode.trim() === ""
  ) {
    const id = req.params.id;
    const session = req.session.user_id;
    const userData = await usermodal.findOne({ _id: req.session.user_id });
    const addressDetails = await addressmodel.findOne(
      { userId: session },
      { addresses: { $elemMatch: { _id: id } } }
    );
    const address = addressDetails.addresses;
    res.render("editAddress", {
      session,
      userData: userData,
      address: address[0],
    });
  } else {
    try {
      const id = req.params.id;
      await addressmodel.updateOne(
        { userId: req.session.user_id, "addresses._id": id },
        {
          $set: {
            "addresses.$": {
              userName: req.body.name,
              mobile: req.body.mobile,
              houseName: req.body.house,
              landmark: req.body.landmark,
              city: req.body.city,
              state: req.body.state,
              pincode: req.body.pincode,
            },
          },
        }
      );
      res.redirect("/checkout");
    } catch (error) {
      console.log(error.message);
    }
  }
};
//================== DELETE ADDRESS ===================

const deleteAddress = async (req,res) => {
    try {
        const id = req.session.user_id
        const addressId = req.body.address
        console.log(addressId);
        const addressData = await addressmodel.findOne({userId:id})
        if(addressData.addresses.length === 1){
            await addressmodel.deleteOne({userId:id})
        }else{
            await addressmodel.updateOne({userId:id},{$pull:{addresses:{_id:addressId}}})
        }
        res.status(200).json({message:"Address Deleted Successfully"})        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "An error occurred while deleting the address" });
    }
}

//================== SHOW ADDRESS IN USER PROFILE ================

const showAddress = async(req,res,next) =>{
    try {
        const session = req.session.user_id
        const userData = await usermodal.findOne ({_id:req.session.user_id});
        const addressData = await addressmodel.findOne({userId:req.session.user_id});
            if(session){
                if(addressData){
                    const address = addressData.addresses
                    res.render('addresses',{userData:userData,session,address:address})

                }else{
                    res.render('emptyAddress',{userData:userData,session})
                }
            }else{
                res.redirect('/home')
            }
    } catch (error) {
        next(error)
    }
}

module.exports = {

  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  showAddress,
};
