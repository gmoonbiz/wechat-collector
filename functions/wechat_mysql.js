var fs = require('fs')
	, request = require('request')
	, mysql = require('mysql')
	, config_db = require('../config/config_db.json')
;

exports.wechat_mysql = (function(){
	var o = new Object();
	
	o.conn = null;
	
	o.init = function(){
		o.conn = mysql.createConnection({
			host: config_db.host,
		    user: config_db.user,
		    password: config_db.password,
		    database: config_db.database,
		    port: config_db.port
		});
		o.conn.connect();
	};
	
	/**
	 * 保存
	 */
	o.articleSave = function(info_article){
		var sql_exist = 'select count(id) as num from wechat_article where account_openid = ? and url = ?';
		var param_exist = [info_article.openid, info_article.url];
		o.conn.query(sql_exist, param_exist, function (err, rows) {
			if (err) console.log(err);
			console.log(rows);
			
			//如果不存在，则插入
			if(rows[0].num == 0){
				var sql = 'insert into wechat_article(account_openid,title,url,qrcode,intro,content,image) values(?,?,?,?,?,?,?)';
				var param = [info_article.openid, info_article.title, info_article.url, info_article.qrcode, info_article.intro, info_article.content, info_article.image];
				
				o.conn.query(sql, param, function (err1, res1) {
					if (err1) console.log(err1);
					
					console.log("-->saved:"+info_article.openid + " " + new Date());
				});
			}else{
				console.log("-->existed:"+info_article.openid + " " + new Date());
			}
		});
	};
	
	return o;
})();

















