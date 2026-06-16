const id3 = require('node-id3');
const mm = require('music-metadata');

const uploadSong = async (req, res) => {
    
    const songBuffer=req.file.buffer
    const tags = id3.read(songBuffer);

    return res.status(200).json({
        message: 'Songs details fetched successfully',
        tags,
    });
};

module.exports = {
    uploadSong
};