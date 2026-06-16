const express=require('express')
const router=express.Router()
const songController=require('../controller/song.controller')
const upload=require('../middleware/upload.middleware')

router.post('/',upload.single('song'),songController.uploadSong)

module.exports=router