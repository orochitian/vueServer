var router = require('express').Router();
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var gbk = require('gbk.js');

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
//  另一个可用播放源：https://www.88ys.cn
const videoUrl = 'https://www.xunleige.com';

//  搜索视频
router.get('/searchVideo', async (req, res) => {
    if( !req.query.search ) {
        res.send([]);
        return;
    }
    var search = JSON.parse(req.query.search);
    if( search.page ) {
        var searchUrl = search.page;
    } else {
        var videoTitle = gbk.URI.encodeURIComponent(search.title);
        var searchUrl = videoUrl + '/search.asp?page=1&searchword=' + videoTitle + '&searchtype=-1';
    }
    var searchList = await parseUrl(searchUrl, $ => {
        var searchData = {
            list: [],
            pages: [],
            state: ''
        };
        $('#results .result').each(function (index, result){
            var $url = $(this).find('.c-title a').eq(1);
            searchData.list.push({
                title: $url.text(),
                link: $url.attr('href'),
                desc: $(this).find('.c-content .c-abstract').text(),
                type: $(this).find('.c-title a').first().text()
            });
        });
        $('.page').children().not('span').each(function (index, child) {
            var active = this.tagName === 'em' && !$(this).hasClass('nolink') ? true : false;
            var link = $(this).attr('href') ? videoUrl + '/search.asp' +  $(this).attr('href') : '';
            searchData.pages.push({
                link,
                text: $(this).text(),
                active
            });
        });
        searchData.state = $('.page span').first().text();
        return searchData;
    });
    res.send(searchList);
});

//  获取视频信息及播放列表
router.get('/getVideoList', async (req, res) => {
    var videoData = await parseUrl(videoUrl + req.query.link, $ => {
        var videoData = {
            title: '',
            list: []
        }
        videoData.title = $('#jqjs h2 strong').text();
        $('#liebiao > #xigua_jk').each(function () {
            $(this).find('ul li').each(function () {
                videoData.list.push({
                    title: $(this).find('a').text(),
                    link: $(this).find('a').attr('href')
                });
            });
        });
        return videoData;
    });
    res.send(videoData);
});


//  获取电影播放地址
router.get('/getVideoDetail', async (req, res) => {
    //  获取电影网站获取视频脚本的地址
    var jsSrc = await parseUrl(videoUrl + req.query.link, $ => {
        return $('#classpage .left').children().first().attr('src');
    });
    //  获取脚本中视频的真实地址
    var videoSrc = await parseUrl(videoUrl + jsSrc, $ => {
        var scriptBody = unescape($('body').text());
        var sources = scriptBody.match(/(?<=http).*?(?=\$)/g);
        if( sources ) {
            var m3u8 = 'http' + sources[0];
        } else {
            var m3u8 = '';
        }
        return m3u8;
    });
    res.send(videoSrc);
});

// var str = '/search.html?searchtype=all&searchkey=我的&page=2';
// console.log(str.split('/search.html?searchtype=all&searchkey=')[1].split('&page='));

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

//  获取小说列表
router.get('/getNovelList', async (req, res) => {
    var nUrl = novelUrl + '/' + req.query.id;
    var novelData = await parseUrl(nUrl, $ => {
        var novelData = {
            title: '',
            img: '',
            topList: [],
            lastList: [],
            ycnum: 0,
            novelId: req.query.id,
            author: '',
            desc: '',
            theLast: ''
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
    res.send(novelData);
});

module.exports = router;
