require('dotenv').config()
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
const redis=require('../config/cache')

const blacklistModel = require('../model/blacklist.model')

const authUser=(async(req,res,next)=>
{
    const token=req.cookies.token

    if(!token)
    {
        return res.status(401).json({
            message:'Token not found'
        })
    }

    const isTokenBlacklisted=await redis.get(token)

    if(isTokenBlacklisted)

    {
        return res.status(401).json({
            message:'Unauthorized access'
        })
    }

    try{
         const decode=jwt.verify(token,process.env.JWT_SECRET)
         req.user=decode
         next()
    }
    catch(err){
        console.log(err);
        // throw err

    }
})

module.exports=
{
    authUser
}