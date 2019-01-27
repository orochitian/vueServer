var router = require('express').Router();
var userModel = require('../model/userModel');

//  获取用户列表
router.get('/getUserList', (req, res) => {
    var pageNum = req.query.pageNum * 1 || 1;
    var pageSize = req.query.pageSize * 1 || 10;
    userModel.find({}).estimatedDocumentCount().then(count => {
        if( count === 0 ) {
            res.json({
                users: [],
                pageNum: 1,
                pageSize,
                count
            });
            return;
        }
        if( pageSize * pageNum > count ) {
            pageNum = Math.ceil(count / pageSize);
        }
        userModel.find().skip((pageNum-1) * pageSize).limit(pageSize).then(users => {
            res.json({
                users,
                pageNum: pageNum || 1,
                pageSize,
                count
            });
        });
    });
});

//  添加用户
router.post('/addUser', (req, res) => {
    userModel.find({username: req.body.username}).then(user => {
        if( user.length < 1 ) {
            userModel.create(req.body, err => {
                res.send(true);
            });
        } else {
            res.send(false);
        }
    });

});

//  编辑用户
router.post('/updateUser', (req, res) => {
    userModel.findByIdAndUpdate(req.body._id, req.body, err => {
        if( !err ) {
            res.send('用户编辑成功！');
        } else {
            res.status(401).send('用户编辑失败！');
        }
    });
});

//  获取用户详情
router.get('/detail', (req, res) => {
    userModel.findById(req.session.userId).then(user => {
        res.send(user);
    });
});

//  删除用户
router.post('/delUser', (req, res) => {
    //  mongoose 建议使用delete删除  而不是remove
    userModel.findByIdAndDelete(req.body._id, err => {
        if( !err ) {
            res.send('用户删除成功！');
        } else {
            res.status(401).send('用户删除失败！');
        }
    });
});

module.exports = router;