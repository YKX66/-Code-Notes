const http = require("http");
const querystring = require("querystring");
http.createServer((req, res) => {
    let arr = [];
    res.setCookie = function (key, value, options = {}) {
        let opts = [];
        if (options.domain) { //表示后面的域名没有就取默认
            opts.push(`domain=${options.domain}`)
        }
        if (options.maxAge) {
            opts.push(`max-age=${options.maxAge}`)
        }
        if (options.httpOnly) {
            opts.push(`httpOnly=${options.httpOnly}`)
        }
        arr.push(`${key}=${value}; ${opts.join(";")}`)
        res.setHeader('Set-Cookie', arr)
    }
    req.getCookie = function (key) { //req里面没有getCookie方法需要自己定义一个
        // console.log(req.headers.cookie);//name=wangcai; age=100
        // console.log(typeof req.headers.cookie)//String
        // console.log(querystring.parse(req.headers.cookie))//转成对象{ name: 'wangcai; age=100' }
        // console.log(querystring.parse(req.headers.cookie,";")) //{ name: 'wangcai', ' age': '100' }
        let obj = querystring.parse(req.headers.cookie, "; ");

        return obj[key]; //key就是传过去的键，传过去的key是个变量最好用[]而不是.  


    }

    if (req.url === "/write") {
        res.setCookie("name", "wangcai")
        res.setCookie("age", "100")
        // req.getCookie()
        // console.log(req.getCookie('name'))
        // res.setCookie("tgt","trgth")
        // res.setCookie("name","wancai",{httpOnly:true})
        // res.setCookie("name","wangcai",{maxAge:5})
        res.end("write ok")
        return

    }
    if (req.url === "/read") {
        res.end(req.getCookie("name") || 'empty'); //读的时候浏览器显示name键对应的值 此时为wangcai
    }
    if (req.url === "/visit") {
        res.setHeader("Content-type", "text/plain; charset=utf8") //解决乱码
        let visit = req.getCookie("visit")
        if (visit) {
             // console.log(visit)  // 1
            // console.log(typeof visit) // string
            // console.log(visit-0) // 1
            // console.log(typeof visit-0) // NaN
            // console.log(visit-0+1+"") // "2"
            visit = visit - 0 + 1
            res.setCookie("visit", visit + "", {
                httpOnly: true
            })
        } else {
            visit = 1;
            res.setCookie("visit","1",{httpOnly:true})
        }
        res.end(`当前第${visit}次访问`)


    }
}).listen(3000)