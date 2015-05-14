var fs = require('fs')
	, request = require('request');

exports.wechat_cookie = (function(){
	var o = new Object();
	o.cookie_file = './public/javascripts/wechat_cookie.cookie';
	
	/**
	 * 更新本地cookie
	 * set_cookie为response.headers中set-cookie部分
	 */
	o.flushWechatCookie = function(set_cookie){
		//本地cookie
		var wechat_cookie = o.getWechatCookie();
		
		//更新本地cookie
		var json_cookie = {};
		for(var i in set_cookie){
			var index = set_cookie[i].indexOf('=');
			var cookie_name = set_cookie[i].substring(0,index);
			wechat_cookie[cookie_name] = set_cookie[i];
		}
		
		//写入本地文件缓存
		fs.writeFileSync(o.cookie_file, JSON.stringify(wechat_cookie));
	};
	
	//得到本地cookie，json格式
	o.getWechatCookie = function(){
		var data = fs.readFileSync(o.cookie_file, 'utf8', function (err,body) {});
		data = (data == ''?'{}':data);
		return JSON.parse(String(data));
	};
	
	//设置请求cookie
	o.setReqeustCookie = function(url){
		//本地cookie
		var wechat_cookie = o.getWechatCookie();
		
		//设置并返回cookie
		var j = request.jar();
		for(var i in wechat_cookie){
			var cookie = request.cookie(wechat_cookie[i]);
			j.setCookie(cookie, url, function (err, cookie){});
		}
		return j;
		/*
		var cookie1 = request.cookie('IPLOC=CN1200');
		var cookie2 = request.cookie('SUID=5376D5B42708930A0000000055483520');
		var cookie3 = request.cookie('SUIR=1430795552;');
		var cookie4 = request.cookie('PHPSESSID=7p0do4iao8tkkr20bngibnsg22');
		var cookie5 = request.cookie('SUV=1430795544236000846');
		var cookie6 = request.cookie('SNUID=FFDA7918ACA9B9E2D6BC3DC5ADC0005A');
		j.setCookie(cookie1, url, function (err, cookie){});
		j.setCookie(cookie2, url, function (err, cookie){});
		j.setCookie(cookie3, url, function (err, cookie){});
		j.setCookie(cookie4, url, function (err, cookie){});
		j.setCookie(cookie5, url, function (err, cookie){});
		j.setCookie(cookie6, url, function (err, cookie){});
		
		return j;*/
	};
	
	return o;
})();

















