var app = require('express')();
var mongo = require('mongoose');
var bodyParser = require('body-parser');
var sidebar = require('./sidebar');
var userModel = require('./model/userModel');

var users = [
    {
        id: 1,
        username: 'admin',
        fullname: 'lirui',
        sex: '男'
    }, {
        id: 2,
        username: 'cangjing',
        fullname: '苍井空',
        sex: '女'
    }, {
        id: 3,
        username: 'xiaoze',
        fullname: '小泽玛利亚',
        sex: '女'
    },
]

app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    next()
});

app.use( bodyParser.urlencoded({extended : true}) );
app.use( bodyParser.json() );

//  获取左侧导航
app.get('/getSidebar', (req, res) => {
    res.send(sidebar)
});

//  获取用户列表
app.get('/user/getUserList', (req, res) => {
    userModel.find({}, '-password').then(users => {
        res.send(users);
    });
});

//  获取指定用户信息
app.get('/user/getUserById', (req, res) => {
    console.log(req.body);
    userModel.findById(req.body._id, (err, user) => {
        if( !err ) {
            console.log(user);
            res.json(user);
        } else {
            res.status(401).send('用户未找到！');
        }
    });
});

//  添加用户
app.post('/user/addUser', (req, res) => {
    userModel.create(req.body, err => {
        if( !err ) {
            res.send('用户添加成功！');
        } else {
            res.status(401).send('用户添加失败！');
        }
    });
});

//  删除用户
app.post('/user/delUser', (req, res) => {
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


