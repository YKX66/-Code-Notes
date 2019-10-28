const http = require("http");
const querystring = require("querystring");
const sign = (value)=>{
    return require("crypto").createHmac("sha256","abc").update(value).digest("base64").replace(/\+/g,"")
}
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
        if(options.signed){
            // value = value+"."+"xxxxxx"
            // value+"."+sign(value)
            // console.log(sign(value)) // 加盐算法
            // value = value+"."+sign(value)
            // console.log(value) // 1.gpHnS6og+oGBB9agylSs5UOjYhAPjm/XLzWLdKp3YTU=
            // console.log(value)
            // console.log(value+'.'+sign(value))
            value = value+'.'+sign(value)
        }
        arr.push(`${key}=${value}; ${opts.join(";")}`)
        res.setHeader('Set-Cookie', arr)
    }
    req.getCookie = function (key,options = {}) { 
        let obj = querystring.parse(req.headers.cookie, "; ");
        if(options.signed){
            if(obj[key]){
                // console.log(obj[key])
                let [value,s] = obj[key].split('.')
                console.log(value)

                let newSign = sign(value);
                if(s===newSign){
                    return value
                }else{
                    return undefined
                }
            }
        }
        return obj[key];



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
        let visit = req.getCookie("visit",{signed:true})
        if (visit) {
             // console.log(visit)  // 1
            // console.log(typeof visit) // string
            // console.log(visit-0) // 1
            // console.log(typeof visit-0) // NaN
            // console.log(visit-0+1+"") // "2"
            visit = visit - 0 + 1
            res.setCookie("visit", visit + "", {
                httpOnly: true,signed:true
            })
        } else {
            visit = 1;
            res.setCookie("visit","1",{httpOnly:true,signed:true})
        }
        res.end(`当前第${visit}次访问`)


    }
}).listen(3000)