var later = require('later');
later.date.localTime();

console.log("Now:"+new Date());

var sched = later.parse.recur().every(2).second(),
    t = later.setInterval(function() {
        test(Math.random(10));
    }, sched);

function test(val) {
   console.log(new Date());
   console.log(val);
}

setTimeout(function(){
   //t.clear();
   console.log("Clear");
},15*1000);