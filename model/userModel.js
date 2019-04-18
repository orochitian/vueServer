var mongo = require('mongoose');

var userSchema = new mongo.Schema({
    username: String,
    password: String,
    fullname: String,
    email: String,
    tel: String,
    sex: String,
    desc: String,
    sessionId: String,
    novelHistory: Array,
    videoHistory: Array
});

var user = mongo.model('user', userSchema);

module.exports = user;