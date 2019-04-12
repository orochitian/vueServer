var router = require('express').Router();
var UserModel = require('../model/userModel');
var request = require('request');
var cheerio = require('cheerio');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
var iconv = require('iconv-lite');
var gbk = require('gbk.js');

// 破解vip视频接口
// https://cdn.yangju.vip/k/?url=
// https://jx.lache.me/cc/?url=
// https://api.653520.top/vip/?url=
// https://jx.ab33.top/vip/?url=
// https://vip.mpos.ren/v/?url=
// https://jx.000180.top/jx/?url=
// https://jx.km58.top/jx/?url=
// https://api.52xmw.com/?url
// http://jqaaa.com/jx.php?url=

//  网友送的免费解析接口  http://www.jiaozika.xyz/?url=
//  http://jx.arpps.com/pps/pps.php?url=

//  抓取页面信息
//  182.207.232.135:50465
function getUrl(url) {
    return new Promise((resolve, reject) => {
        request({
            url,
            method: 'GET',
            encoding: null,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36'
            }
        }, (err, res, body) => {
            if( err ) {
                reject(err);
            } else {
                resolve({res, body});
            }
        });
    });
}
    // new Promise((resolve, reject) => {
    //     request({
    //         url: 'http://www.jiaozika.xyz/',
    //         method: 'POST',
    //         encoding: null,
    //         body: {
    //             url: 'https://v.youku.com/v_show/id_XNDEwNTMzMzM2OA==.html?spm=a2ha1.12675304.m_7182_c_14738.d_1'
    //         },
    //         headers: {
    //             'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36'
    //         },
    //         json: true
    //     }, (err, res, body) => {
    //         if( err ) {
    //             reject(err);
    //         } else {
    //             console.log(body);
    //             resolve({res, body});
    //         }
    //     });
    // })



//  解析页面
function parseUrl(url, callback, isUtf8) {
    return getUrl(url).then(urlData => {
        //  如果网站编码是GBK才转
        if( !isUtf8 ) {
            var parseData = iconv.decode(urlData.body, 'gbk').replace('charset=GBK', 'charset=UTF-8');
        } else {
            var parseData = urlData.body;
        }
        var querySelector = cheerio.load(parseData);
        return callback(querySelector, parseData, urlData);
    }).catch(err => {
        console.log(err);
    });
}

//  小说网站
const novelUrl = 'https://www.xiashutxt.com';
//  视频网站
const videoUrl = 'https://kuyun.tv';

//  搜索视频
router.get('/searchVideo', async (req, res) => {
    if( !req.query.search ) {
        res.send([]);
        return;
    }
    var search = JSON.parse(req.query.search);
    if( search.page ) {
        var searchUrl = videoUrl + search.page;
    } else {
        var videoTitle = encodeURI(search.title);
        var searchUrl = videoUrl + '/vod/search/page/1/wd/' + videoTitle + '.html';
    }
    var searchList = await parseUrl(searchUrl, $ => {
        var searchData = {
            list: [],
            pages: [],
            state: ''
        };
        $('.fed-part-layout .fed-deta-info').each(function (index, item) {
            var $this = $(this);
            searchData.list.push({
                title: $this.find('.fed-deta-content > h1 > a').text(),
                link: $this.find('.fed-deta-button a').attr('href'),
                desc: $this.find('.fed-deta-content ul.fed-part-rows li').last().text()
            });
        });
        $('.fed-part-layout .fed-page-info a').not('.fed-page-jump').each(function (index, item) {
            var $this = $(this);
            searchData.pages.push({
                text: $this.text(),
                link: $this.attr('href'),
                active: $this.hasClass('fed-btns-green'),
                disabled: $this.hasClass('fed-btns-disad')
            });
        });
        searchData.state = searchData.list.length * (searchData.pages.length < 1 ? 1 : searchData.pages.length );
        return searchData;
    }, true);
    res.send(searchList);
});

//  获取视频信息及播放列表
router.get('/getVideoList', async (req, res) => {
    var videoData = await parseUrl(videoUrl + req.query.link, $ => {
        var videoData = {
            title: '',
            list: [],
            desc: '',
            info: {}
        }
        videoData.title = $('.fed-deta-info .fed-deta-content h1 a').text();
        var infoLi = $('.fed-deta-info ul.fed-part-rows li');
        videoData.desc = infoLi.last().find('.fed-part-esan').text();
        videoData.info = {
            type: infoLi.eq(2).find('a').text(),
            area: infoLi.eq(3).find('a').text(),
            date: infoLi.eq(4).find('a').text(),
        }
        $('.fed-play-item .fed-part-rows').not('.fed-drop-head').find('li').each(function () {
            videoData.list.push({
                title: $(this).find('a').text(),
                link: $(this).find('a').attr('href')
            });
        });
        return videoData;
    }, true);
    res.send(videoData);
});


//  获取电影播放地址
router.get('/getVideoDetail', async (req, res) => {
    // https://kuyun.tv/vod/play/id/24404/sid/1/nid/1.html
    //  获取电影网站获取视频脚本的地址
    var dom = await JSDOM.fromURL(videoUrl + req.query.link, {
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole
    });
    dom.window.onload = function () {
        var frame = dom.window.document.getElementById('fed-play-iframe');
        res.send(frame.contentWindow.huiid);
    }

});


//  获取小说首页
router.get('/getNovelIndex', async (req, res) => {
    var result =  await parseUrl(novelUrl, $ => {
        var tabs = [];
        var hots = [];
        var news = [];
        $('ul.male li').first().remove();
        $('ul.male li').each(function (i, li) {
            var $a = $(this).find('a');
            tabs.push({
                title: $a.text(),
                link: $a.attr('href')
            });
        });
        $('.free_book_list .cont > ul > li').each(function (i, li) {
            var $a = $(this).find('a');
            hots.push({
                title: $a.find('h3').text(),
                link: $a.attr('href'),
                img: $a.find('img').attr('data-original')
            });
        });
        $('#main > .bt > em .lists li').each(function (i, li) {
            var $a = $(this).find('>a');
            news.push({
                title: $a.text(),
                link: $a.attr('href')
            });
        });
        return {tabs, hots, news}
    }, true);
    res.send(result);
});

//  获取小说分类下的列表
router.get('/getNovelClassifyList', async (req, res) => {
    var result = await parseUrl(novelUrl + req.query.link, $ => {
        var result = {
            list: [],
            pages: [],
            total: ''
        }
        $('#waterfall > .item').each(function (i, item){
            var $this = $(this);
            result.list.push({
                title: $this.find('.title a').text(),
                id: parseInt($this.find('.title a').attr('href').replace(/\//g, '')),
                img: $this.find('.pic img').attr('data-original')
            });
        });
        $('.pagination a').each(function () {
            result.pages.push({
                link: $(this).attr('href'),
                text: $(this).text(),
                active: $(this).hasClass('current')
            });
        });
        result.total = $(".pagination").children().first().text();
        return result;
    }, true);
    res.send(result);
});

//  搜索小说
router.get('/searchNovel', async (req, res) => {
    if( !req.query.search ) {
        res.send([]);
        return;
    }
    var search = JSON.parse(req.query.search);
    var searchUrl = novelUrl + '/search.html?searchkey=' + encodeURIComponent(search.title) + '&searchtype=all&page=' + search.pageNum;
    var searchList = await parseUrl(searchUrl, $ => {
        var searchData = {
            list: [],
            pages: [],
            total: ''
        };
        $('#waterfall .item').each(function (itemIndex, item) {
            searchData.list.push({
                title: $(item).find('.title a').text(),
                link: $(item).find('.title a').attr('href'),
                desc: $(item).find('.intro').text(),
                img: $(item).find('.pic img').attr('data-original')
            });
        });
        $('.pagination a').each(function () {
            searchData.pages.push({
                link: $(this).attr('href'),
                text: $(this).text(),
                active: $(this).hasClass('current')
            });
        });
        searchData.total = $(".pagination").children().first().text();
        return searchData;
    }, true);
    res.send(searchList);
});

//  获取小说菜单
router.get('/getNovelList', async (req, res) => {
    var nUrl = novelUrl + '/' + req.query.id;
    var novelData = await parseUrl (nUrl, $ => {
        var novelData = {
            title: '',
            img: '',
            topList: [],
            lastList: [],
            ycnum: 0,
            novelId: req.query.id,
            author: '',
            desc: '',
            theLast: '',
            hasRead: false
        };
        novelData.title = $('#info .infotitle > h1').text().replace(/《|》/g, '');
        novelData.author = $('#infobox .username a').text();
        $('#aboutbook').find('a,h3').remove();
        novelData.desc = $('#aboutbook').text();
        novelData.theLast = $('#info .tag > a').text();
        novelData.img = $('#picbox > .img_in > img').attr('data-original');
        $('#toplist > li').each(function () {
            novelData.topList.push({
                title: $(this).find('a').text(),
                link: $(this).find('a').attr('href')
            });
        });
        $('#lastchapter > li').each(function () {
            novelData.lastList.push({
                title: $(this).find('a').text(),
                link: $(this).find('a').attr('href')
            });
        });
        novelData.ycnum = parseInt($('#hidc .ycnum').text());
        return novelData;
    }, true);
    var user = await UserModel.findById(req.session.userId);
    var hasRead = (function () {
        for( var i=0; i<user.novelHistory.length; i++ ) {
            if( user.novelHistory[i].id === req.query.id ) {
                return user.novelHistory[i].lastChapterLink;
            }
        }
        return false;
    })();
    novelData.hasRead = hasRead;
    res.send(novelData);
});

//  获取隐藏章节
router.get('/getHiddenList', async (req, res) => {
    var hiddenList = await parseUrl(novelUrl + '/api/ajax/zj?id='+ req.query.id +'&num='+ req.query.num +'&order=asc', $ => {
        var hiddenList = [];
        $('li').each(function () {
            hiddenList.push({
                title: $(this).find('a').text(),
                link: $(this).find('a').attr('href')
            });
        });
        return hiddenList;
    }, true);
    res.send(hiddenList);
});

//  获取章节内容
router.get('/getNovelDetail', async (req, res) => {
    var novelData = await parseUrl(novelUrl + req.query.link, $ => {
        var novelData = {};
        $('#chaptercontent').find('a,div').remove();
        novelData.content = $('#chaptercontent').html();
        novelData.title = $('.title > h1 > a').text();
        novelData.prevLink = $('.operate li').first().find('a').attr('href').indexOf('.html') !== -1 ? $('.operate li').first().find('a').attr('href') : '';
        novelData.nextLink = $('.operate li').last().find('a').attr('href').indexOf('.html') !== -1 ? $('.operate li').last().find('a').attr('href') : '';
        return novelData;
    }, true);

    var user = await UserModel.findById(req.session.userId);
    var novelHistory = user.novelHistory;
    var hasRead = (function () {
        for( var i=0; i<novelHistory.length; i++ ) {
            if( novelHistory[i].id === req.query.id ) {
                novelHistory[i].lastChapter = novelData.title;
                novelHistory[i].lastChapterLink = req.query.link;
                var updateHistory = novelHistory[i];
                novelHistory.splice(i, 1);
                novelHistory.unshift(updateHistory);
                return true;
            }
        }
        return false;
    })();

    if( !hasRead ) {
        if( novelHistory.length > 30 ) {
            novelHistory.pop();
        }
        novelHistory.unshift({
            id: req.query.id,
            lastChapter: novelData.title,
            lastChapterLink: req.query.link
        });
    }
    UserModel.findByIdAndUpdate(req.session.userId, {novelHistory}).then(user => {
        res.send(novelData);
    });


});

module.exports = router;
