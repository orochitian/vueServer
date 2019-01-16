var router = require('express').Router();
var blog = require('../model/blogModel');

router.post('/add', (req, res) => {
    blog.create(req.body, err => {
        res.send(req.body);
    });
});

router.get('/getBlogList', (req, res) => {
    var pageNum = req.query.pageNum * 1 || 1;
    var pageSize = req.query.pageSize * 1 || 5;
    blog.find({}).estimatedDocumentCount().then(count => {
        if( count === 0 ) {
            res.json({
                list: [],
                pageNum: 1,
                pageSize,
                count
            });
            return;
        }
        if( pageSize * pageNum > count ) {
            pageNum = Math.ceil(count / pageSize);
        }
        blog.find().skip((pageNum-1) * pageSize).limit(pageSize).then(list => {
            res.json({
                list,
                pageNum: pageNum || 1,
                pageSize,
                count
            });
        });
    });
});

module.exports = router;