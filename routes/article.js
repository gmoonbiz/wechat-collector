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
	res.send('article');
	
});

router.get('/info',function(req, res){
	var url = unescape(req.query.url);
	if(debug) tofile(unescape(url),'url');
	
	var rq_content = request({uri: url}, function(error, response, body){
		var json_data_return = success(1,body);	//包装json数据
		res.send(json_data_return);
    });
});

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
