var router = require('express').Router();
var videoCollectModel = require('../model/videoCollectModel');

router.get('/addCollect', (req, res) => {
    videoCollectModel.create({
        title: req.query.title,
        link: req.query.link,
        userId: req.session.userId
    }).then(collect => {
        res.send(collect);
    });
});
router.get('/removeCollect', (req, res) => {
    videoCollectModel.deleteOne({
        link: req.query.link,
        userId: req.session.userId
    }).then(collect => {
        res.send(false);
    });
});

router.get('/getCollect', (req, res) => {
    videoCollectModel.findOne({
        link: req.query.link,
        userId: req.session.userId
    }).then(collect => {
        if( collect ) {
            res.send(collect);
        } else {
            res.send(false);
        }
    });
});

router.get('/getAllCollect', (req, res) => {
    videoCollectModel.find({userId: req.session.userId}).then(collects => {
        res.send(collects);
    });
});

module.exports = router;