var mongo = require('mongoose');

var novelHistorySchema = new mongo.Schema({
    novelName: String,
    lastChapter: String,
    lastChapterLink: String,
    userId: String
}, {
    timestamps: true
});

var novelHistory = mongo.model('novelHistory', novelHistorySchema);

module.exports = novelHistory;