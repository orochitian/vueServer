var express = require('express');
var app = express();

app.get('/', (req, res) => {
    console.log(req);
    res.send(true);
});

app.listen('9999', err => {
    err ? console.log('服务器启动失败：', err) : console.log('服务器端口：9999');
})