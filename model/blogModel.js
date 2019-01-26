var mongo = require('mongoose');

var blogSchema = new mongo.Schema({
    title: String,
    classify: String,
    content: String,
    userId: String
}, {
    timestamps: true
});

var blog = mongo.model('blog', blogSchema);

module.exports = blog;