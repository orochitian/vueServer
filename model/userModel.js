var mongo = require('mongoose');

var userSchema = new mongo.Schema({
    username: String,
    password: String,
    fullname: String,
    sex: String,
    desc: String
});

var user = mongo.model('user', userSchema);

module.exports = user;