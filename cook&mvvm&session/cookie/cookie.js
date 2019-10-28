const http = require("http");

http.createServer((req,res)=>{
    if(req.url === "/"){
        res.end("welcome ~")
    }
    if(req.url === "/write"){
        //多的话放在数组里面
        // res.setHeader("Set-Cookie",["name=angcai","age=10"]);
        // res.setHeader("Set-Cookie","name=angcai;path=/write");//指定路径
        // res.setHeader("Set-Cookie","name=wangcai;max-age=10")//指定事件10后失效
        // res.setHeader("Set-Cookie","name=wangcai; httpOnly=true");//console栏不能修改cookie值，applicaation栏能修改
        res.setHeader("Set-Cookie","name=wangcai; domain=a.wangcai.cn");//hosts文件里配置新的网址代替localhost
 
        res.end("qqqqqq")
    }
    if(req.url === "/read"){
        //访问/read显示出coolie内容，如果cookie清除显示empty
        res.end(req.headers.cookie || 'empty');
    }
}).listen(3000);