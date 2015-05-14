var fs = require('fs')
	, request = require('request')
	, config = require('../config/config.json')
;

exports.wechat_pick = (function(){
	var o = new Object();
	
	o.articlePick = function(wechat,cb){
		this.articleLatestInfo(wechat.openid, cb);
	};
	
	o.articleLatestInfo = function(openid,cb){
		
		var rq = request({url: config.server_url+'/wechat/account/article_list?openid='+openid+'&num=1'}, function(error, response, body){
			body = eval("("+body+")");
			
			var article_json = body.items_json[0];
			
			var return_article = {
				"openid":article_json.openid,
				"title":article_json.title,
				"url":article_json.url,
				"intro":article_json.intro,
				"image":article_json.image
			};
			
			var url = article_json.url; 
			request({url: config.server_url+'/wechat/article/info?url='+escape(url)}, function(error, response, body){
				body = eval("("+body+")");
			
				return_article.qrcode = '';
				return_article.content = body.data;
				
				//保存
				cb(return_article);
			});
		});
		
		
	};
	
	return o;
})();

















