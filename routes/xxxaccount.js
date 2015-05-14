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
router.get('/article_latest',function(req, res){
	var openid 	= req.query.openid;
	var num 	= req.query.num;	//默认1
	
});

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
						
						var article_info = {"title":title};
						items_json[items_json.length] = article_info;
						tofile(JSON.stringify(items_json), 'json_item')
	    			}
	    			var data = {
	    				"page"		:page,
	    				"items"		:items,
	    				"items_json":items_json,
	    				"totalPages":totalPages,
	    				"totalItems":totalItems
	    			};
	    			data_return = success(1,data);	//包装json数据
    	    		res.send(data_return);
	    		}
	    	}else{
    			res.send(success(0,'发生错误'));
	    	}
	    });
	    tolog('123');
	}
	
	function matchBody(body){
		//var bs = body.match(/({(.*?)})/gi);
		var bs = body.match(/{".*?}/gi);
		return bs == null ? '':bs[0];
	}
});

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







//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/last_news_group',function(req, res){
	var openid = req.query.openid;
	var json = req.query.json;	//默认0，如果设置了就是1
	
	if(json != undefined && json == '1'){
		json = 1;
	}else{
		json = 0;
	}
	var openid_obj = openid.split(',');
	
	//查询
	var result = [];
	var i = 0;
	fetch_last_news(openid_obj[i]);
	function fetch_last_news(openid_curr){
		i++;
		var rq = request({url: config.server_url+'/accounts/last_news?openid='+openid_curr+'&json='+json}, function(error, response, body){
			result[result.length] = body;
			
			if(i < openid_obj.length){
				fetch_last_news(openid_obj[i]);
			}else{
				res.send(result);
			}
		});
	}
})

//参数
var baseUrl = "http://weixin.sogou.com/gzhjs";
var cb = "sogou.weixin.gzhcb";
var page = 1;
router.get('/last_news', function(req, res) {
	var openid = req.query.openid;
	var json = req.query.json;	//默认0，如果设置了就是1
	
	if(json != undefined && json == '1'){
		json = 1;
	}else{
		json = 0;
	}
	if(openid == undefined || openid.length == 0){
		res.send('openid not found');
	}else{
		var url = baseUrl + '?cb=' + cb + '&openid=' + openid + '&page=' + page + '&t=' + (new Date().getTime());
		//var url = baseUrl + '?cb=' + cb + '&openid=' + openid + '&page=' + page + '&t=' + (new Date().getTime()) + '&repp=1';
        fetchURL(url);
	}
	
	//抓取数据
	function fetchURL(url){
		
	    var rq = request({url: url,jar: j}, function(error, response, body){tolog('abc');tofile(url,'url');
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
	    			if(json == 0){
	    				res.send('没有找到公众号或者此公众号没有文章');
	    			}else{
	    				res.send(success(0,'没有找到公众号或者此公众号没有文章'));
	    			}
	    		}else{
	    			var doc = new dom().parseFromString(items[0]);

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
					
					var json_data_return = {
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
		    	    
		    	    var rq_content = request({uri: url_article[0].firstChild.data}, function(error, response, body){
		    	    	if(json == 0){
		    	    		res.send(body);
		    	    	}else{
							json_data_return.body = body;	//把html的内容，加给返回的json数据
		    	    		json_data_return = success(1,json_data_return);	//包装json数据
		    	    		res.send(json_data_return);
		    	    	}
		    	    });
	    		}
	    	}else{
	    		if(json == 0){
    				res.send('发生错误');
    			}else{
    				res.send(success(0,'发生错误'));
    			}
	    	}
	    });
	    tolog('123');
	}
	function matchBody(body){
		//var bs = body.match(/({(.*?)})/gi);
		var bs = body.match(/{".*?}/gi);
		return bs == null ? '':bs[0];
	}
});
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

module.exports = router;
