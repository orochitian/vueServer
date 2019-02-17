var express = require('express');
var app = express();
var mongo = require('mongoose');
var bodyParser = require('body-parser');
var userModel = require('./model/userModel');
var fileUploadModel = require('./model/fileUploadModel');
var session = require('express-session');
var formidable = require('formidable');
var fs = require('fs');
var history = require('connect-history-api-fallback');

app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8081");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    // res.header("Content-Type", "application/json; charset=utf-8");
    next();
});

app.use(history({index: '/'}));

app.use( '/fileupload', express.static('/fileupload') );
app.use( '/static', express.static('./dist/static') );

app.use( bodyParser.urlencoded({extended : true}) );
app.use( bodyParser.json({limit: '1mb'}) );



app.use(session({
    secret : 'ryan lee',
    resave : true,
    saveUninitialized : true
}));

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(__dirname + "/dist/index.html");
});


//  登录
app.post('/login', (req, res) => {
    //  登录成功后，更新用户的sessionid。作用是在以后的请求中对比当前用户的sessionid和请求中的sessionid是否一致，如果不一致代表登录已经失效。
    //  通过session.userId记录当前用户是谁。
    userModel.findOneAndUpdate({
        username: req.body.username,
        password: req.body.password
    }, {sessionId: req.sessionID}).then(user => {
        if( !user ) {
            res.send(false);
        } else {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.send(true);
        }
    });
});


//  登出
app.get('/logout', (req, res) => {
    req.session.userId = null;
    res.send(true);
});

//  注册
app.post('/regist', (req, res) => {
    userModel.find({username: req.body.username}).then(user => {
        if( user.length < 1 ) {
            userModel.create(req.body, err => {
                res.json({
                    code: 200,
                    msg: '注册成功！'
                });
            });
        } else {
            res.json({
                code: 201,
                msg: '该用户名已存在！'
            });
        }
    });

});

//  验证登录状态
app.use((req, res, next) => {
    //  连userid都没有，就是没登录
    if( !req.session.userId ) {
        res.json({
            code: 401,
            msg: '未登录！'
        });
        return;
    }
    //  如果有userid，和数据库里的用户对比，当前用户的sessionid和请求的sessionid一样，表示正常登录。否则表示登录失效。
    //  这么做可以防止用户重复登录。
    userModel.findById(req.session.userId).then(user => {
        if( user.sessionId !== req.sessionID ) {
            res.json({code: 401, msg: '当前登录已失效！'});
        } else {
            next();
        }
    });
});

app.get('/getPhotos', (req, res) => {
    fileUploadModel.find({user: req.session.username}).then(photos => {
        res.send({
            photos
        })
    })
});

app.post('/upload', (req, res) => {
    var uploadDir = "/fileupload/" + req.session.username;
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    //  是否保留上传文件拓展名
    form.keepExtensions = true;
    //  给文件加密
    form.hash = 'md5';

    function uploadCallback(err, fields, files) {
        var file = files.upload;
        //  给已上传文件的MD5值做持久化保存
        //  每次上传可以查询当前用户下，是否有相同文件。如果有把本次上传文件删除，返回数据库中文件地址。
        fileUploadModel.findOne({hash: file.hash, user: req.session.username}).then(fileUpload => {
            if( fileUpload ) {
                console.log('发现相同文件！');
                fs.unlink(file.path, () => {
                    file.path = fileUpload.path;
                    res.send(file)
                });
            } else {
                console.log('添加文件');
                fileUploadModel.create({
                    path: file.path,
                    hash: file.hash,
                    user: req.session.username
                }, err => {
                    res.send(file);
                })
            }
        })
    }

    //  判断上传文件路径是否存在，不存在先创建再上传
    fs.access(uploadDir, err => {
        if( err ) {
            fs.mkdir(uploadDir, err => {
                form.parse(req, uploadCallback);
            });
        } else {
            form.parse(req, uploadCallback);
        }
    });
})

app.use('/blog', require('./routers/blog'));
app.use('/user', require('./routers/user'));

/*
*  mongod --dbpath=/opt/db --bind_ip=0.0.0.0
* */
mongo.connect('mongodb://132.232.119.153:27017/vue', { useNewUrlParser: true, useFindAndModify: false }, err => {
    if( err ) {
        console.log('数据库启动失败：', err);
    } else {
        app.listen('8082', err => {
            err ? console.log('服务器启动失败：', err) : console.log('服务器端口：8082');
        })
    }
})
