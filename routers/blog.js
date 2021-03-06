var router = require('express').Router();
var blog = require('../model/blogModel');

//  获取文章列表
router.get('/getBlogList', async (req, res) => {
    var pageNum = req.query.pageNum * 1 || 1;
    var pageSize = req.query.pageSize * 1 || 10;
    var condition = req.query.search ? {title: {$regex: new RegExp(JSON.parse(req.query.search).title)}, userId: req.session.userId} : {userId: req.session.userId};
    var count = await blog.countDocuments(condition);
    if( count === 0 ) {
        res.send({
            list: [],
            count: 0,
            pageNum: 1,
            pageSize,
            pageSizeOpts: [10, 20]
        });
        return;
    }
    if( pageSize * pageNum > count ) {
        pageNum = Math.ceil(count / pageSize);
    }
    var list = await blog.find(condition, '-content').sort('-_id').skip((pageNum-1) * pageSize).limit(pageSize);
    res.send({
        list,
        count,
        pageNum,
        pageSize,
        pageSizeOpts: [10, 20]
    });
});

//  添加文章
router.post('/add', (req, res) => {
    req.body.userId = req.session.userId;
    blog.create(req.body, err => {
        res.send(req.body);
    });
});

//  编辑文章
router.post('/edit', (req, res) => {
    blog.findOneAndUpdate({_id: req.body.id}, req.body.formData, err => {
        if( !err ) {
            res.send('文章编辑成功！');
        } else {
            res.status(401).send('文章编辑失败！');
        }
    });
});

//  删除文章
router.post('/delete', (req, res) => {
    //  mongoose 建议使用delete删除  而不是remove
    blog.findByIdAndDelete(req.body._id, err => {
        if( !err ) {
            res.send('文章删除成功！');
        } else {
            res.status(401).send('文章删除失败！');
        }
    });
});

//  获取文章详情
router.get('/detail', (req, res) => {
    blog.findById(req.query.id).then(detail => {
        res.json(detail);
    });
});

module.exports = router;