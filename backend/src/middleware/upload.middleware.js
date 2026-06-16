const multer=require('multer')
const storage=multer.memoryStorage()

const upload=multer({storage:storage,
    limits:1024*1024*10 //10mb
})

module.exports=upload