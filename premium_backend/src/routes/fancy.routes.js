const express= require("express");

const {fancyList}= require("../controllers/fancy.controller");

const router= express.Router();

router.post("/",fancyList )

module.exports=router