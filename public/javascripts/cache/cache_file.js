var fs = require('fs');

var __cache={};//用来存放缓存的全局变量。

exports.cache=(function(){
	var o = new Object();
	/**
	* 添加一个新缓存
	* @param cachename 缓存名
	* @param value 缓存值
	* @param haomiao 缓存时间 毫秒如果不加时间默认1分钟。
	*/
	o.addCache = function(cachename,value,haomiao){
		var haom=haomiao?haomiao:60000;
		var tcache=cachename;
		__cache[tcache]=value;
		setTimeout(function(){ //使用TIMEOUT来处理超时时的删除。
			delete __cache[tcache];
		},haom);
		
		
		fs.writeFile('cache_file.cache', content, function (err) {
			if (err) throw err;
			console.log('\t'+file+'.txt saved!');
		});
	}
	/**
	 * 得到cache
	 */
	o.getCache = function(cachename){
		return 'abc';
		return __cache[cachename];
	}
	/**
	* 删除缓存
	* @param cachename 删除的缓存名称
	*/
	o.delCache = function(cachename){
		delete __cache[cachename];
	}
	//console.log(o);
	return o;
})();