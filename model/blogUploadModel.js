var mongo = require('mongoose');

var blogUploadSchema = new mongo.Schema({
    path: String,
    hash: String,
    user: String,
    name: String
}, {
    timestamps: true
});

var blogUpload = mongo.model('blogUpload', blogUploadSchema);

module.exports = blogUpload;