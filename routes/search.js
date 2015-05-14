var express = require('express');
var fs = require('fs');
var router = express.Router();

var debug = true;	//调试

//第三方模块
var request = require('request')
    , accounts = require('../config/accounts.json')
    , config = require('../config/config.json')
    , select = require('xpath.js')
    , dom = require('xmldom').DOMParser
    , xml_digester = require("xml-digester")
    , htmlparser = require("htmlparser2")
    , sys = require("sys")
    , digester = xml_digester.XmlDigester({})
    , j = request.jar();


router.get('/', function(req, res) {
	res.send('search');
	
});
//公众号
router.get('/wechat',function(req, res){
	var type 	= 1;
	
	var query 	= req.query.query;
	var page 	= req.query.page;
	
	//var url = 'http://weixin.sogou.com/weixin?query=%E5%9F%B9%E8%AE%AD&type=1&page=1';
	var url = 'http://weixin.sogou.com/weixin?query='+escape(query)+'&type='+type+'&page='+page;
	tofile(url,'url');
	//fs.readFile('./temp/wechat_content.html', 'utf8', function (err,data) {
	var rq_content = request({uri: url}, function(error, response, body){
		if(debug) tofile(body, 'search-wechat-return-body');
	
		var wechat_items = fetch_wechat_items(body);
		var result = [];
		for(var i in wechat_items){
			result[result.length] = fetch_wechat_item_info(wechat_items[i]);
		}
		var result_return = {
			"query":query,
			"page":page,
			"record_num":fetch_wechat_num(body),
			"data_list":result
		};
		res.send(result_return);
	});
});
//文章
router.get('/article',function(req, res){
	var type 	= 2;
	
	var query 	= req.query.query;
	var page 	= req.query.page;
	
	
	//var url = 'http://weixin.sogou.com/weixin?query=%E5%9F%B9%E8%AE%AD&type=1&page=1';
	var url = 'http://weixin.sogou.com/weixin?query='+escape(query)+'&type='+type+'&page='+page;	//tofile(url, 'article-url');
	//fs.readFile('./temp/article_content.html', 'utf8', function (err,body) {
	
	//var request = request.defaults({jar: true});
	var j = request.jar();
	var cookie = request.cookie("SNUID=abc; path=/; expires=Sun, 29 July 2046 00:00:00 UTC");
	j.setCookie(cookie, url, function (err, cookie){});
	var rq_content = request({uri: url}, function(error, response, body){//tofile(body,'article-body');res.send('11s')	;return;
	
		var article_items = fetch_article_items(body);
		var result = [];
		for(var i in article_items){
			result[result.length] = fetch_article_item_info(article_items[i]);
		}
		var result_return = {
			"query":query,
			"page":page,
			"record_num":fetch_article_num(body),
			"data_list":result
		};
		res.send(result_return);
	});
});

module.exports = router;

/////////////////////////////////////////////////////////////////////
// 函数
/////////////////////////////////////////////////////////////////////
function fetch_article_items(html){
	var patten = new RegExp("<div class=\"wx-rb wx-rb3\" id=[\\s\\S]*?</div>\\s*</div>\\s*</div>", "gi");
	return html.match(patten);
}
function fetch_article_item_info(item){
	
	var patten1 = new RegExp("<div class=\"txt-box\">[\\s\\S]*?href=\"(.*)\"\\s.*\">(.*)</a>", "i");
	//	链接
	var href = item.match(patten1)[1];
	//	标题
	var title = item.match(patten1)[2];
	//	简介
	//var patten2 = new RegExp("<div class=\"txt-box\">[\\s\\S]*<p id=?>(.*)</p>", "i");
	var patten2 = new RegExp("<div class=\"txt-box\">[\\s\\S]*<p id=.*?>(.*)</p>", "i");
	var desc = item.match(patten2)[1];
	//	配图
	var patten3 = new RegExp("<div class=\"img_box2\">[\\s\\S]*src=\"(.*)\"\\S", "i");
	var image = item.match(patten3)[1];
	//	发表时间
	var patten4 = new RegExp("<script>vrTimeHandle552write\\('(\\d*)'\\)</script>", "i");
	var time = item.match(patten4)[1];
	//	公众号（名称，openid）
	//var patten5 = new RegExp("<a id=\"weixin_account\".*href=\"/gzh?openid=(.*)\"\s.*cutLength\\('(.*)',", "i");
	var patten5 = new RegExp("<a id=\"weixin_account\".*href=\"/gzh\\?openid=(\\S*)\".*cutLength\\('(.*)',", "i");
	var wechat = item.match(patten5);
	var wechat = {
		"openid":item.match(patten5)[1],
		"title":item.match(patten5)[2]
	};
	
	return {
		href:href,
		title:title,
		desc:desc,
		image:image,
		time:time,
		wechat:wechat
	};
}
//文章数量
function fetch_article_num(html){
	var patten = new RegExp("<resnum id=\"scd_num\">(\\S*)</resnum>", "i");
	return String(html).match(patten)[1];
}

//提取当前页面所有公众号html
function fetch_wechat_items(html){
	//从div标签开始
	//->匹配0个或者多个非换行符（\n）
	//->匹配0个或者多个任意字符（[\s\S]，\s表示任意空白符[\f\n\r\t\v]，\S表示任意非空白符[^\f\n\r\t\v]）
	//->匹配连续的三个</div>标签，\\s*表示标签之间的空白
	//
	//反斜线\表示转义
	var patten = new RegExp("<div.*wx-rb bg-blue[\\s\\S]*?</div>\\s*</div>\\s*</div>", "gi");
	return String(html).match(patten);
}
//提取当前页面所有公众号信息
var i=0;
function fetch_wechat_item_info(item){
	//	openid
	var patten1 = new RegExp("href=\"/gzh\\?openid=([\\w-]*)\"", "i");
	var openid = item.match(patten1)[1];
//	tofile(typeof openid, 'type');
//	tofile(openid, 'openid'+i);
	//	标题
	var patten2 = new RegExp("<div class=\"txt-box\">\\s*<h3>(.*)</h3>", "i");
	var title = item.match(patten2)[1];
	title = title.replace(/\\s*/g,'');
	title = title.replace('<em>','');
	title = title.replace('<!--red_beg-->','');
	title = title.replace('<!--red_end-->','');
	title = title.replace('</em>','');
	//	logo
	var patten3 = new RegExp("<div class=\"img-box\">[\\s\\S]*?src=\"(\\S*)\"", "i");
	var logo = item.match(patten3)[1];
	//	微信号
	var patten4 = new RegExp("<span>微信号：(\\S*)</span>", "i");
	var wechat = item.match(patten4)[1];
	//	二维码
	var patten5 = new RegExp("<img width=\"140\" height=\"140\"[\\s\\S]*src=\"(\\S*)\"", "i");
	var qrcode = item.match(patten5)[1];
	//	认证（是否认证，认证单位）
	var patten6 = new RegExp("<span class=\"ico-r\"></span>", "i");
	var verify = item.match(patten6);
	var verify_info = {};
	if(!verify){
		verify_info.isVerify = 0;
		verify_info.type = '';
		verify_info.info = '';
	}else{
		verify_info.isVerify = 1;
		
		//机构
		var pattern_organization = new RegExp("<span class=\"sp-tit\"><script>authnamewrite\\('(\\d*)'\\)</script>[\\s\\S]*?<span class=\"sp-txt\">(.*)?</span>", "i");
		var organization = item.match(pattern_organization);
		verify_info.type = authname(organization[1])+'认证';	//类型
		verify_info.info = organization[2];	//机构
	}
	//	最新文章（标题，链接，发表时间）
	var patten7 = new RegExp("<span class=\"sp-tit\">最近文章：</span>[\\s\\S]*href=\"(\\S*)\".*\">(\\S*)</a>[\\s\\S]*vrTimeHandle552write\\('(\\S*)'\\)", "i");
	var article = item.match(patten7);
	var article_info = {};
	if(article){
		article_info.href = article[1];
		article_info.title = article[2];
		article_info.time = article[3];
	}
	//介绍
	var patten8 = new RegExp("<span class=\"sp-tit\">功能介绍：</span><span class=\"sp-txt\">(.*)</span>", "i");
	var intro = item.match(patten8)[1];
	
	
	//tofile(patten1.toString(),'patten');
	i++;
	return {
		openid:openid,
		title:title,
		intro:intro,
		logo:logo,
		wechat:wechat,//微信号
		qrcode:qrcode,
		verify:verify_info,
		article:article_info
	};
}
//公众号数量
function fetch_wechat_num(html){
	var patten = new RegExp("<resnum id=\"scd_num\">(\\S*)</resnum>", "i");
	return String(html).match(patten)?String(html).match(patten)[1]:0;
}
//认证类型
function authname(auth_id){
	if (auth_id == '1') {
		return '腾讯';
	} else if (auth_id == '2') {
		return '微信';
	} else if (auth_id == '4') {
		return '新浪';
	} else {
		return '微信';
	}
}
//格式化时间
function vrTimeHandle552(time){
    if (time) {
        var date = new Date(time * 1000);
        var today = new Date(now);
        if (date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
            return (date.getHours() < 10 ? "0":"") + date.getHours() + ":" + (date.getMinutes() < 10 ? "0":"") + date.getMinutes();
        } else {
            return (date.getMonth() < 9 ? "0":"") + (date.getMonth() + 1) + "月" + (date.getDate() < 10 ? "0":"") + date.getDate() + "日";
        }
    } else {
        return '';
    }
}
function success(status,data){
	var json = {
		"status":status,
		"data": data
	};
	return JSON.stringify(json);
}
function tolog(content){
	console.log('\t' + content);
}
function tofile(content,file){
	fs.writeFile('./temp/'+file+'.txt', content, function (err) {
		if (err) throw err;
	  	console.log('\t'+file+'.txt saved!');
	});
}






















