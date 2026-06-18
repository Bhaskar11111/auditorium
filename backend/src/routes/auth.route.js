const express=require('express')
const router=express.Router()
const authController=require('../controller/auth.controller')
const authMiddleware=require('../middleware/auth.middleware')  

router.post('/register',authController.registerUser)
router.post('/login',authController.loginUser)
router.get('/getUser',authMiddleware.authUser,authController.getUser)
router.get('/logout',authMiddleware.authUser,authController.logoutUser)


module.exports=router   