var mongo = require('mongoose');

var videoCollectSchema = new mongo.Schema({
    title: String,
    link: String,
    userId: String
}, {
    timestamps: true
});

var videoCollect = mongo.model('videoCollect', videoCollectSchema);

module.exports = videoCollect;