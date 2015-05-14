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

/* GET users listing. */
router.get('/', function(req, res) {
	res.send('accounts');
	
});
//公众号信息
router.get('/info',function(req, res){
	var openid 	= req.query.openid;
	
	var url = 'http://weixin.sogou.com/gzh?openid='+openid;
	//fs.readFile('./temp/wechat_content.html', 'utf8', function (err,body) {
	var rq = request({url: url}, function(error, response, body){
		var wechat_info = fetch_wechat_info(body);
		wechat_info.openid = openid;
		res.send(wechat_info);
	});
});
//最新文章
router.get('/article_latest',function(req, res){
	var openid 	= req.query.openid;
	
	var rq = request({url: config.server_url+'/wechat/account/article_list?openid='+openid+'&num=1'}, function(error, response, body){
		body = eval("("+body+")");
		
		var article_json = body.items_json[0];
		
		var return_article = {
			"openid":article_json.openid,
			"title":article_json.title,
			"url":article_json.url,
			"intro":article_json.content168,
			"image":article_json.imglink
		};
		
		var url = article_json.url; 
		request({url: config.server_url+'/wechat/article/info?url='+escape(url)}, function(error, response, body){
			body = eval("("+body+")");
		
			return_article.qrcode = '';
			return_article.content = body.data;
			res.send(return_article);
		});
	});
});
//最新文章，不带详情
/*router.get('/article_latest_brief',function(req, res){
	var openid 	= req.query.openid;
	
	var rq = request({url: config.server_url+'/wechat/account/article_list?openid='+openid+'&num=1'}, function(error, response, body){
		body = eval("("+body+")");
		
		var article_json = body.items_json[0];
		
		var return_article = {
			"openid":article_json.openid,
			"title":article_json.title,
			"url":article_json.url,
			"intro":article_json.content168,
			"image":article_json.imglink
		};
		res.send(return_article);
	});
});*/

//列表
var baseUrl = "http://weixin.sogou.com/gzhjs";
var cb = "sogou.weixin.gzhcb";
var page = 1;
router.get('/article_list',function(req, res){
	var openid 	= req.query.openid;
	var num 	= req.query.num;	//默认10，大于等于1，小于等于10
	
	if(openid == undefined || openid.length == 0){
		res.send('openid not found');
	}else{
		var url = baseUrl + '?cb=' + cb + '&openid=' + openid + '&page=' + page + '&t=' + (new Date().getTime());
		//var url = baseUrl + '?cb=' + cb + '&openid=' + openid + '&page=' + page + '&t=' + (new Date().getTime()) + '&repp=1';
        fetchURL(url);
	}
	
	//抓取数据
	function fetchURL(url){
		
	    var rq = request({url: url,jar: j}, function(error, response, body){
	    	if(debug){
	    		tofile(body,'body');
	    	}
	    	
	    	if(!error && response.statusCode == 200){
	    		if(debug){
	    			//cookie输出
	    			var cookie_string = j.getCookieString(url); // "key1=value1; key2=value2; ..."
	    			tofile(cookie_string,'cookie_string'+new Date().getTime());
	    		}
	    		
	    		
	    		var body_old = body;
	    		//解析
	    		body = matchBody(body);
	    		
	    		if(debug){
		    		tofile(body,'body-match');
		    	}
	    		
	    		if(body == ''){
	    			var snuid = get_SNUID(body_old);
	    			
	    			if(debug){
			    		tofile(snuid,'snuid');
			    	}
	    			
	    			if(snuid == ''){
	    				res.send('采集错误');
	    				if(debug){
				    		tofile('采集错误','log');
				    	}
	    				return false;
	    			}else{
	    				//设置cookie
	    				set_cookie(url,snuid);
	    				if(debug)tolog('设置cookie完成，再次调用fetchURL函数');
	    				fetchURL(url);//重新调用
	    				return false;//终止程序运行
	    			}
	    		}
	    		
	    		if(debug){
	    			tofile(body,'body-to-eval');
		    	}
	    		
	    		body = eval("("+body+")");	//公众号的文章信息，包括分页啊，总数啊，文章列表啊，等等的
	    		
	    		var page = body.page;
	    		var items = body.items; 
	    		var totalPages = body.totalPages; 
	    		var totalItems = body.totalItems;
	    		
	    		if(items.length == 0){
	    			res.send(success(0,'没有找到公众号或者此公众号没有文章'));
	    		}else{
	    			var items_json = [];
	    			for(var i in items){
	    				var doc = new dom().parseFromString(items[i]);
	    				//var json_item = xmlToJson(doc);
//	    				var str = json2str(json_item);
	    				//tofile(JSON.stringify(json_item), 'json_item');res.send('ok');
	    				
	    				var docid = select(doc, "/DOCUMENT/item/display/docid");
						var tplid = select(doc, "/DOCUMENT/item/display/tplid");
			    	    var title = select(doc, "/DOCUMENT/item/display/title");	//标题
			    	    var url_article = select(doc, "/DOCUMENT/item/display/url");	//链接
						var title1 = select(doc, "/DOCUMENT/item/display/title1");
						var imglink = select(doc, "/DOCUMENT/item/display/imglink");
						var headimage = select(doc, "/DOCUMENT/item/display/headimage");
						var sourcename = select(doc, "/DOCUMENT/item/display/sourcename");
						var content168 = select(doc, "/DOCUMENT/item/display/content168");
						var isV = select(doc, "/DOCUMENT/item/display/isV");
						var openid = select(doc, "/DOCUMENT/item/display/openid");
						var content = select(doc, "/DOCUMENT/item/display/content");
						var showurl = select(doc, "/DOCUMENT/item/display/showurl");
						var date = select(doc, "/DOCUMENT/item/display/date");
						var pagesize = select(doc, "/DOCUMENT/item/display/pagesize");
						var lastModified = select(doc, "/DOCUMENT/item/display/lastModified");
						
						var article_info = {
								"docid":docid[0].firstChild.data,
								"tplid":tplid[0].firstChild.data,
								"title":title[0].firstChild.data,
								"url":url_article[0].firstChild.data,
								"title1":title1[0].firstChild.data,
								"imglink":imglink[0].firstChild.data,
								"headimage":headimage[0].firstChild.data,
								"sourcename":sourcename[0].firstChild.data,
								"content168":content168[0].firstChild.data,
								"isV":isV[0].firstChild.data,
								"openid":openid[0].firstChild.data,
								"content":content[0].firstChild.data,
								"showurl":showurl[0].firstChild.data,
								"date":date[0].firstChild.data,
								"pagesize":pagesize[0].firstChild.data,
								"lastModified":lastModified[0].firstChild.data
							};
						
						items_json[items_json.length] = article_info;
						tofile(JSON.stringify(items_json), 'items_json');
	    			}
	    			var data = {
	    				"page"		:page,
	    				"items"		:items,
	    				"items_json":items_json,
	    				"totalPages":totalPages,
	    				"totalItems":totalItems
	    			};
	    			//data_return = success(1,data);	//包装json数据
    	    		res.send(data);
	    		}
	    	}else{
    			res.send(success(0,'发生错误'));
	    	}
	    });
	}
});

module.exports = router;


/////////////////////////////////////////////////////////////////////
//函数
/////////////////////////////////////////////////////////////////////
//提取公众号信息
function fetch_wechat_info(html){
	var patten = new RegExp("<div class=\"wx-rb wx-rb2 _item\"[\\s\\S]*?</div>\\s*</div>\\s*</div>", "gi");
	var html_info = String(html.match(patten));
	
	//openid
	
	//标题
	var patten1 = new RegExp("<h3 id=\"weixinname\">(.*)</h3>", "i");
	var title = html_info.match(patten1)[1];
	//logo
	var patten2 = new RegExp("<div class=\"img-box\">[\\s\\S]*?src=\"(\\S*)?\"\\s", "i");
	var logo = html_info.match(patten2)[1];
	//微信号
	var patten3 = new RegExp("<span>微信号：(.*)</span>", "i");
	var wechat = html_info.match(patten3)[1];
	//二维码
	var patten4 = new RegExp("<div class=\"v-box\">[\\s\\S]*?src=\"(\\S*)?\"", "i");
	var qrcode = html_info.match(patten4)[1];
	//功能介绍
	var patten5 = new RegExp("<span class=\"sp-tit\">功能介绍:</span><span class=\"sp-txt\">(.*)?</span>", "i");
	var intro = html_info.match(patten5)[1];
	//认证（是否认证，认证类型，认证内容）
	var patten6 = new RegExp("<span class=\"ico-r\"></span>", "i");
	var verify = html_info.match(patten6);
	var verify_info = {};
	if(!verify){
		verify_info.isVerify = 0;
		verify_info.type = '';
		verify_info.info = '';
	}else{
		verify_info.isVerify = 1;
		
		//机构
		var pattern_organization = new RegExp("<span class=\"sp-tit\"><script>authnamewrite\\('(\\d*)'\\)</script>[\\s\\S]*?<span class=\"sp-txt\">(.*)?</span>", "i");
		var organization = html_info.match(pattern_organization);
		verify_info.type = authname(organization[1])+'认证';	//类型
		verify_info.info = organization[2];	//机构
	}
	
	return {
		title:title,
		logo:logo,
		wechat:wechat,
		qrcode:qrcode,
		intro:intro,
		verify:verify_info
	};
	//return html_info;
	//return body;
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
function matchBody(body){
	//var bs = body.match(/({(.*?)})/gi);
	var bs = body.match(/{".*?}/gi);
	return bs == null ? '':bs[0];
}
//Changes XML to JSON
function xmlToJson(xml) {
     
    // Create the return object
    var obj = {};
 
    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }
 
    // do children
    if (xml.hasChildNodes()) {
        for(var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].length) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    //obj[nodeName].push(old);
                    obj[nodeName] = old;
                }
                //obj[nodeName].push(xmlToJson(item));
                obj[nodeName] = xmlToJson(item);
            }
        }
    }
    return obj;
};
function json2str(o) {
	var arr = [];
	var fmt = function(s) {
		if (typeof s == 'object' && s != null) return json2str(s);
			return /^(string|number)$/.test(typeof s) ? "'" + s + "'" : s;
		}
	for (var i in o) arr.push("'" + i + "':" + fmt(o[i]));
	return '{' + arr.join(',') + '}';
}

//设置cookie
function set_cookie(url,snuid){
	var domain = ".sogou.com";
	var date = new Date();
	
	var cookie_SUV = request.cookie("SUV="+(date.getTime())*1000+Math.round(Math.random()*1000)+";path=/;expires=Sun, 29 July 2046 00:00:00 UTC;domain="+domain);
	j.setCookie(cookie_SUV, url);
	
	date.setTime(date.getTime()+1000);//2tian
	var cookie_SNUID = request.cookie("SNUID="+snuid+"; path=/; expires="+date.toGMTString());
	j.setCookie(cookie_SNUID, url);
}
//得到SNUID
function get_SNUID(body){
	var bs = body.match(/SNUID=.*?;/gi);
	if(bs != null){
		var sunid = bs[0];
		sunid = sunid.replace('SNUID=','');
		sunid = sunid.replace(';','');
		
		if(debug){
			tofile(sunid,'sunid');
		}
		
		return sunid;
	}else{
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
