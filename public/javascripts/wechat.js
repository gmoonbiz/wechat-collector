var fs = require('fs')
	, wechat_cookie = require("./wechat_cookie.js").wechat_cookie
	, request = require('request');

exports.wechat = (function(){
	var o = new Object();
	
	//每个请求之间的最小间隔毫秒 10~30秒
	o.millSecPerReq = function(){
		return 0;
		//return 10000 + Math.floor( Math.random() * 20000 );
	};
	
	
	//最后请求时间
	o.lrTime = new Date().getTime();
	/**
	 * 延时request
	 * 
	 */
	o.wechatRequest = function(arg,callback){
		var curTime = new Date().getTime();
		
		var j = wechat_cookie.setReqeustCookie(arg.url);
		arg.jar = j;
		
		var timeWaite = (o.millSecPerReq() - (curTime - o.lrTime));	//等待时间
		if(timeWaite > 0){
			setTimeout(function(){
				var rq = request(arg, function(error, response, body){
					console.log('waitting for '+timeWaite+' mill sec before doing request callback');
					after_request(error, response, body);
				});
			}, timeWaite);
		}else{
			var rq = request(arg, function(error, response, body){
				console.log('do request callback');
				after_request(error, response, body);
			});
		}
		
		function after_request(error, response, body){
			//if(!error && response.statusCode == 200){
			
			//console.log(response.headers);
			
			wechat_cookie.flushWechatCookie(response.headers['set-cookie']);
			o.lrTime = new Date().getTime();
			
			callback(error,response,body);
		}
	};
	
	return o;
})();

















