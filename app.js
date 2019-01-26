var app = require('express')();
var mongo = require('mongoose');
var bodyParser = require('body-parser');
var sidebar = require('./sidebar');
var userModel = require('./model/userModel');

app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    next()
});

app.use( bodyParser.urlencoded({extended : true}) );
app.use( bodyParser.json() );

app.use('/blog', require('./routers/blog'));

//  获取左侧导航
app.get('/getSidebar', (req, res) => {
    res.send(sidebar)
});

//  登录
app.post('/login', (req, res) => {
    userModel.find({
        username: req.body.username,
        password: req.body.password
    }).then(user => {
        if( user.length < 1 ) {
            res.send(false);
        } else {
            res.send(true);
        }
    });
});

//  获取用户列表
app.get('/user/getUserList', (req, res) => {
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

//  获取指定用户信息
// app.get('/user/getUserById', (req, res) => {
//     userModel.findById(req.query._id, (err, user) => {
//         if( !err ) {
//             res.json(user);
//         } else {
//             res.status(401).send('用户未找到！');
//         }
//     });
// });

//  添加用户
app.post('/user/addUser', (req, res) => {
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
app.post('/user/updateUser', (req, res) => {
    userModel.findByIdAndUpdate(req.body._id, req.body, err => {
        if( !err ) {
            res.send('用户编辑成功！');
        } else {
            res.status(401).send('用户编辑失败！');
        }
    });
});

//  删除用户
app.post('/user/delUser', (req, res) => {
    //  mongoose 建议使用delete删除  而不是remove
    userModel.findByIdAndDelete(req.body._id, err => {
        if( !err ) {
            res.send('用户删除成功！');
        } else {
            res.status(401).send('用户删除失败！');
        }
    });
});

mongo.connect('mongodb://localhost:27017/vue', { useNewUrlParser: true }, err => {
    if( err ) {
        console.log('数据库启动失败：', err);
    } else {
        app.listen('8082', err => {
            err ? console.log('服务器启动失败：', err) : console.log('服务器端口：8082');
        })
    }
})
