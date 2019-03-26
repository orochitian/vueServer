var router = require('express').Router();
var novelCollectModel = require('../model/novelCollectModel');

router.get('/addCollect', (req, res) => {
    novelCollectModel.create({
        novelName: req.query.novelName,
        novelId: req.query.novelId,
        userId: req.session.userId
    }).then(collect => {
        res.send(collect);
    });
});
router.get('/removeCollect', (req, res) => {
    novelCollectModel.deleteOne({
        novelId: req.query.novelId,
        userId: req.session.userId
    }).then(collect => {
        res.send(false);
    });
});

router.get('/getCollect', (req, res) => {
    novelCollectModel.findOne({
        novelId: req.query.novelId,
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
    novelCollectModel.find({userId: req.session.userId}).then(collects => {
        res.send(collects);
    });
});

module.exports = router;