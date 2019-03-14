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
            tunnel: false
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
function parseUrl(url, callback) {
    return getUrl(url).then(urlData => {
        var parseData = iconv.decode(urlData.body, 'gbk').replace('charset=GBK', 'charset=UTF-8');
        var querySelector = cheerio.load(parseData);
        return callback(querySelector, parseData, urlData);
    }).catch(err => {
        console.log(err);
    });
}

//  小说网站
const novelUrl = 'https://www.qk6.org';
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

//  搜索小说
router.get('/searchNovel', async (req, res) => {
    if( !req.query.search ) {
        res.send([]);
        return;
    }
    var search = JSON.parse(req.query.search);
    if( search.page ) {
        var searchUrl = search.page;
    } else {
        var novelTitle = gbk.URI.encodeURIComponent(search.title);
        switch (search.type) {
            case 1:
                var searchType = 'novelname'
                break
            case 2:
                var searchType = 'author'
                break
            default:
                var searchType = 'novelname'
        }
        var searchUrl = novelUrl + '/novel.php?action=search&searchtype=' + searchType + '&searchkey=' + novelTitle + '&input=';
    }
    var searchList = await parseUrl(searchUrl, $ => {
        var searchData = {
            list: [],
            pages: [],
            state: '',
            total: ''
        };
        $('.ss_box').each(function () {
            var book = {
                name: $(this).find('.sp_name').text(),
                link: $(this).find('.sp_name .sp_bookname').attr('href').split('info.html')[0],
                desc: $(this).find('.jj_txt').text()
            }
            searchData.list.push(book);
        });

        $('#pagelink a').each(function () {
            searchData.pages.push({
                link: $(this).attr('href'),
                text: $(this).text()
            });
        });
        searchData.state = $('#pagestats').text();
        searchData.total = $("#pagelink").contents().filter(function () {
            return this.nodeType == 3;
        }).text().replace(/\s/g, '');
        return searchData;
    });
    res.send(searchList);
});

//  获取小说列表
router.get('/getNovelList', async (req, res) => {
    var novelData = await parseUrl(req.query.link, $ => {
        var novelData = {};
        var menu = [];
        $('.zjbox ul').each(function (ulIndex, ul) {
            $(ul).find('li').each(function (liIndex, li) {
                menu.push({
                    title: $(li).find('a').text(),
                    link: $(li).find('a').attr('href')
                });
            });
        });
        novelData.menu = menu;
        novelData.newchapter = $('.newchapter a').text();
        novelData.novelName = $('#bookname h1').text();

        return novelData;
    });
    var downloadUrl = await parseUrl(req.query.link + 'txt.html', $ => {
        return $('#TxtdownTop').children('a').last().attr('href');
    });
    novelData.downloadUrl = downloadUrl;
    res.send(novelData);
});

//  获取章节内容
router.get('/getNovelDetail', async (req, res) => {
    var novelData = await parseUrl(req.query.link, $ => {
        var novelData = {};
        $('#content').find('a,div').remove();
        novelData.content = $('#content').html();
        novelData.title = $('#main h1').text();
        return novelData;
    });
    res.send(novelData);
});

module.exports = router;
