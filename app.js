var app = require('express')();
var mongo = require('mongoose');
var bodyParser = require('body-parser');
var userModel = require('./model/userModel');
var session = require('express-session');

app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8081");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.use( bodyParser.urlencoded({extended : true}) );
app.use( bodyParser.json() );
app.use(session({
    secret : 'ryan lee',
    resave : true,
    saveUninitialized : true
}));

//  登录
app.post('/login', (req, res) => {
    userModel.find({
        username: req.body.username,
        password: req.body.password
    }).then(user => {
        if( user.length < 1 ) {
            res.send(false);
        } else {
            req.session.sign = true;
            res.send(true);
        }
    });
});

//  登出
app.get('/logout', (req, res) => {
    req.session.sign = false;
    res.send(true);
});

app.use((req, res, next) => {
    console.log(req.sessionID);
    if( !req.session.sign ) {
        res.send({code: 401});
        return;
    }
    next();
});

app.use('/blog', require('./routers/blog'));
app.use('/user', require('./routers/user'));


mongo.connect('mongodb://132.232.119.153:27017/vue', { useNewUrlParser: true, useFindAndModify: false }, err => {
    if( err ) {
        console.log('数据库启动失败：', err);
    } else {
        app.listen('8082', err => {
            err ? console.log('服务器启动失败：', err) : console.log('服务器端口：8082');
        })
    }
})


