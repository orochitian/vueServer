var router = require('express').Router();
var blog = require('../model/blogModel');

//  添加文章
router.post('/add', (req, res) => {
    blog.create(req.body, err => {
        res.send(req.body);
    });
});

//  获取文章列表
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

//  获取文章详情
router.get('/detail', (req, res) => {
    blog.findById(req.query.id).then(detail => {
        res.json(detail);
    });
});

module.exports = router;