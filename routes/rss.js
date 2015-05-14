var express = require('express');
var router = express.Router();

var debug = true;	//调试

//第三方模块
var request = require('request')
    , config = require('../config/config.json')
	, wechat = require('../public/javascripts/wechat.js').wechat
;

/* GET users listing. */
router.get('/', function(req, res) {
	res.send('rssaaadd');
	
});


module.exports = router;
