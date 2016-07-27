/**
	错误码描述

	1001  ---未找到参数或参数格式错误
	1002  ---sessionId已经过期
	1003  ---文件上传出错
	1004  ---文件未找到
	1005  ---用户未找到
**/

exports.types = {
  "params-undefined": 1001,
  "sessionId-expired": 1002,
  "file-upload-error": 1003,
  "file-not-found": 1004,
  "user-not-found": 1005,
};
