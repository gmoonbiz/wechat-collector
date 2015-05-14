
module.exports.parseBody = function(body){

	var bodyData = body || '';

	//去除注释
	bodyData = bodyData.replace(/<!--\s*(.*?)\s*-->/gi, '');


	return bodyData;

}