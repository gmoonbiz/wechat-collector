var mysql = require('mysql')
	, later = require('later')
	, wechat_pick = require('./functions/wechat_pick.js').wechat_pick
	, wechat_mysql = require('./functions/wechat_mysql.js').wechat_mysql
	, config_db = require('./config/config_db.json')
;

wechat_mysql.init();

var conn = mysql.createConnection({
	host: config_db.host,
    user: config_db.user,
    password: config_db.password,
    database: config_db.database,
    port: config_db.port
});
conn.connect();

var list_pick = [];

//query
var selectSQL = 'select * from wechat_user_wechat';
conn.query(selectSQL, function (err, rows) {
    if (err) console.log(err);
    list_pick = rows;
    
    //计划任务
    later.date.localTime();
    console.log("=====>Start Picking:" + new Date());
    
    var sched = later.parse.recur().every(20).second(),
    t = later.setInterval(function() {
    	if(list_pick.length > 0){
    		wechat_pick.articlePick(list_pick.pop(), wechat_mysql.articleSave);
    	}
    	if(list_pick.length == 0){
    		t.clear();
    		console.log("Over!");
    	}
    }, sched);

});

//conn.end();








































