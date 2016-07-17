var schedule = require("node-schedule");
var datastore = require('./datastore');

//周一到周日的23点59分执行定时任务
function setDayOfWeekJob() {
	console.log("===============开启处理过期的sessionId定时任务===============");
	var rule = new schedule.RecurrenceRule();
	rule.dayOfWeek = [0, new schedule.Range(1, 6)];
	rule.hour = 23;
	rule.minute = 59;
	var dayJob = schedule.scheduleJob(rule, function(){
		console.log("===============处理过期的sessionId===============");
		datastore.Account.removeExpiredSessionIds(function(result) {
			console.log(result);
		});
	});
}

//临时定时任务
function setDateJob() {
	console.log("===============开启定时任务===============");

	var rule = new schedule.RecurrenceRule();
	rule.dayOfWeek = [0, new schedule.Range(1, 6)];
	rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
	var dayJob = schedule.scheduleJob(rule, function(){
		console.log("===============定时任务===============");
	});
}

module.exports = {
	setDayOfWeekJob: setDayOfWeekJob,
	setDateJob: setDateJob
}