var mongo = require('mongoose');

var novelCollectSchema = new mongo.Schema({
    novelName: String,
    novelId: String,
    userId: String
}, {
    timestamps: true
});

var novelCollect = mongo.model('novelCollect', novelCollectSchema);

module.exports = novelCollect;