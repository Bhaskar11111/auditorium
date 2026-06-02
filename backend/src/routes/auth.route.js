const express=require('express')
const { registerUser, loginUser, getUser, logoutUser } = require('../controller/auth.controller')
const{authUser}=require('../middleware/auth.middleware')
const router=express.Router()

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/getUser',authUser,getUser)
router.get('/logout',logoutUser)

module.exports=router