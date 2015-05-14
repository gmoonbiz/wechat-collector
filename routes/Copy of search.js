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
	
	var url = 'http://weixin.sogou.com/weixin?query=%E5%9F%B9%E8%AE%AD&type=1&page=1';
	
	fs.readFile('./temp/wechat_content.html', 'utf8', function (err,data) {
		var result = fetch_wechat_items(data);
		res.send(result);
	});
	
//	var rq_content = request({uri: url}, function(error, response, body){
//		//var json_data_return = success(1,body);	//包装json数据
//		
//		var result = fetch_wechat_items(body);
//		res.send(result);
//	});
	
//	fetch_wechat_items(html);
//	
//	
//	res.send('search....');
//	
//	var url = unescape(req.query.url);
//	if(debug) tofile(unescape(url),'url');
//	
//	var rq_content = request({uri: url}, function(error, response, body){
//		var json_data_return = success(1,body);	//包装json数据
//		res.send(json_data_return);
//    });
})
//文章
router.get('/article',function(req, res){
	var type 	= 2;
	
	var query 	= req.query.query;
	var page 	= req.query.page;
	
	
	res.send('search....');
	
	var url = unescape(req.query.url);
	if(debug) tofile(unescape(url),'url');
	
	var rq_content = request({uri: url}, function(error, response, body){
		var json_data_return = success(1,body);	//包装json数据
		res.send(json_data_return);
	});
})

module.exports = router;

/////////////////////////////////////////////////////////////////////
// 函数
/////////////////////////////////////////////////////////////////////
function fetch_wechat_items(html){
	var result = '';
	
	var handler = new htmlparser.DomHandler(function (error, dom) {
		var dom_utils = htmlparser.DomUtils;
		if (error){
			console.log(error);
		}else{
//			var name = dom_utils.getElementsByTagName("a", dom);
//			sys.debug("name: " + sys.inspect(name, false, null));
//			tofile(sys.inspect(dom, false, null),'name');
			//console.log(dom);
			tofile(sys.inspect(dom, false, null),'dom');
//			result += 'aa';
		}
	}, { verbose: false });
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
//	
//	
//	var parser = new htmlparser.Parser({
//	    onopentag: function(name, attribs){
//	    	var div_class = new String(attribs.class);
//	        if(name === "div" && div_class.indexOf('wx-rb') >= 0){
//	            //console.log("JS! Hooray!");
//	        	result += 'a|';
//	        }
//	    },
//	    ontext: function(text){
//	        //console.log("-->", text);
//	        //result += '-->'+text;
//	    },
//	    onclosetag: function(tagname){
//	        if(tagname === "script"){
//	            //console.log("That's it?!");
//	            //result += 'That\'s it?!';
//	        }
//	    }
//	}, {decodeEntities: false});
//	parser.write(html);
//	parser.end();
	return result;
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






















