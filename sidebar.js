module.exports = [
    {
        "name": "home",
        "title": "首页",
        "icon": "ios-home",
        "to": "/"
    }, {
        "title": "博客",
        "name": "blog",
        "icon": "ios-keypad",
        "items": [
            {"title": "工作", "to":"/blog/work", "name": "work", "icon": "ios-keypad"},
            {"title": "其他", "to":"/blog/other", "name": "other", "icon": "ios-keypad"}
        ]
    }, {
        "title": "用户管理",
        "name": "userManage",
        "icon": "md-people",
        "to": "/userManage"
    }, {
        "name": "login",
        "title": "登录",
        "icon": "ios-keypad",
        "to": "/login"
    }
]
