var __cache={};//������Ż����ȫ�ֱ�����
exports.cache=(function(){
	var o=new Object();
	/**
	* ���һ���»���
	* @param cachename ������
	* @param value ����ֵ
	* @param haomiao ����ʱ�� �����������ʱ��Ĭ��1���ӡ�
	*/
	o.addCache = function(cachename,value,haomiao){
		var haom=haomiao?haomiao:60000;
		var tcache=cachename;
		__cache[tcache]=value;
		setTimeout(function(){ //ʹ��TIMEOUT������ʱʱ��ɾ����
			delete __cache[tcache];
		},haom)
	}
	o.getCache = function(cachename){
		return __cache[cachename];
	}
	/**
	* ɾ������
	* @param cachename ɾ���Ļ�������
	*/
	o.delCache=function(cachename){
		delete __cache[cachename];
	}
	//console.log(o);
	return o;
})();