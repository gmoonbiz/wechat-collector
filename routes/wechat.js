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
    , digester = xml_digester.XmlDigester({})
    , j = request.jar();


router.get('/', function(req, res) {
	res.send('wechat');
	
});
//批量获取公众号最新文章列表
router.post('/group_article_latest_list',function(req, res){
	var wechat_num = req.body.length;
	if(wechat_num == 0){
		res.send({});
	}
	
	var article_list = [];
	for(var i in req.body){
		var url = config.server_url+'/wechat/account/article_list?openid='+req.body[i]+'&num=1';
		request({uri: url}, function(error, response, body){
			body = JSON.parse(body);
			
			if(body.items_json != undefined){
				article_list[article_list.length] = body.items_json[0];
			}else{
				article_list[article_list.length] = {};
			}
			if(wechat_num == article_list.length){
				res.send(article_list);
			}
		});
	}
});
//最新文章内容
/*router.post('/group_article_latest_info',function(req, res){
	var wechat_num = req.body.length;//res.send( req.body);return;
	
	var article_info_list = [];
	for(var i in req.body){
	request({uri: config.server_url+'/wechat/account/article_latest_brief?openid='+req.body[i]}, function(error, response, body){
		body = eval("("+body+")");
		
		var article_info = body;
		article_info_list[article_info_list.length] = article_info;
		
		if(wechat_num == article_info_list.length){
			res.send(article_info_list);
		}
	});
	}
})*/

module.exports = router;

/////////////////////////////////////////////////////////////////////
// 函数
/////////////////////////////////////////////////////////////////////
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
