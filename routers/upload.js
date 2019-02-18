var router = require('express').Router();
var fileUploadModel = require('../model/fileUploadModel');
var formidable = require('formidable');
var fs = require('fs');

//  上传图片
router.post('/', (req, res) => {
    var uploadDir = "/fileupload/" + req.session.username;
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    //  是否保留上传文件拓展名
    form.keepExtensions = true;
    //  给文件加密
    form.hash = 'md5';
    //  支持多文件上传
    form.multiples = true;

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
                    name: file.name,
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

//  获取图片列表
router.get('/getPhotos', (req, res) => {
    fileUploadModel.find({user: req.session.username}).then(photos => {
        res.send({
            photos
        })
    })
});

//  删除指定图片
router.post('/deletePhoto', (req, res) => {
    fileUploadModel.findOneAndDelete({path: req.body.path}, err => {
        res.send('删除成功');
    });
    fs.unlink(req.body.path, err => {});
});

//  清空所有图片
router.get('/deleteAllPhotos', (req, res) => {
    var uploadDir = "/fileupload/" + req.session.username;
    fileUploadModel.deleteMany({user: req.session.username}).then(() => {
        fs.access(uploadDir, err => {
            if( err ) {return;}
            fs.readdir(uploadDir, (err, files) => {
                if( err ) {
                    console.log(err);
                } else {
                    files.forEach((file, index) => {
                        fs.unlinkSync(uploadDir + '/' + file, err => {
                            if( err ) {
                                console.log(err)
                            } else {
                                console.log('删除了：' + file);
                            }
                        })
                    });
                    fs.rmdir(uploadDir, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.send(true);
                        }
                    });
                }
            })
        })
    })
});

module.exports = router;