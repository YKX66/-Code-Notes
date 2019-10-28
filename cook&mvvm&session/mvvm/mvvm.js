// 发布-订阅   观察者    观察者模式中包含发布-订阅模式
// 发布-订阅   发布和订阅之间是没有必然联系的
// 观察者（观察者和被观察者） 被观察者中包含观察者

// 存储观察者的类Dep
class Dep{
    //new的时候调constructor
    constructor(){
        this.subs = [];      // subs中存放所有的watcher
    }
    // 添加watcher  订阅
    addSub(watcher){
        this.subs.push(watcher)
    }
    // 通知 发布  通知subs容器中所有的观察者
    notify(){
        this.subs.forEach(watcher=>{watcher.update()})
    }
}

//观察者
class Watcher{
    constructor(vm,expr,cb){
        //vm expr cb 都放到观察者身上
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;// cb表示当状态改变了，要干的事

        this.oldValue = this.get();

    }
    //获取状态的方法
    get(){
        Dep.target = this;  //watcher 放在target上面
        let value = CompilerUtil.getVal(this.vm,this.expr);
        Dep.target = null;
        return value;
    }
    // 当状态发生改变后，会调用观察者的update方法
    update(){
        let newVal = CompilerUtil.getVal(this.vm,this.expr);
        if(newVal !== this.oldValue){
            this.cb(newVal);
        }
    }
}

//实现数据的响应式    数据劫持 把数据变成响应式
class Observer{
    constructor(data){
        // console.log(data);//{school: {…}}
        this.observer(data)
        
    }

    observer(data){
        if(data && typeof data == 'object'){
             // console.log(data)  // {school: {name: "qqqq", age: 100}}
            //循环data对象
            for(let key in data){
                // console.log(key)//school
                // console.log(data[key])//{name: "qqqqq", age: 100}
                this.defindReactive(data,key,data[key])
            }
        }
    }
    defindReactive(obj,key,value){
        this.observer(value) //上面传过来的数值为对象,也需要把这个对象中的数据变成响应式
        let dep = new Dep()
        //直接在一个对象上定义一个新属性
        Object.defineProperty(obj,key,{
            //获取
            get(){
                Dep.target && dep.subs.push(Dep.target)
                // console.log("54484");
                return value
                
            },
            //修改
            set:(newVal)=>{
                // 当赋的值和老值一样，就不重新赋值
                if(newVal != value){
                    // console.log("set...")
                    this.observer(newVal)
                    value = newVal
                    dep.notify();//通知
                }
            }
        })
    }
}

// 编译模板   找到带指令的元素节点  和  插值表达式（v-text）的文本节点
class Compiler{
    //el 和vue实例传过去
    constructor(el,vm){
         //获取文档中 id="demo" 的元素：
            // document.querySelector("#demo");
        this.el = this.isElementNode(el) ? el :document.querySelector(el)//获取模板
        // console.log(this.el) //得到了标签
        this.vm = vm;

        let fragment = this.node2fragment(this.el)
        // console.log(fragment)
        this.compile(fragment)
        this.el.appendChild(fragment)
        // console.log(this.el);
        
    }

    //判断一个属性是否是一个指令
    isDirective(attrName){
        //是的话在前面加上v-
        return attrName.startsWith("v-")
    }

    //编译元素节点
    compileElement(node){
        let attributes = node.attributes; //某个元素节点的属性
        // console.log(attributes);  //伪数组  {0: type, 1: v-model, type: type, v-model: v-model, length: 2}
        [...attributes].forEach(attr=>{
            // console.log(typeof attr); //得到两个属性对象 type="text"  v-model="school.name"
            let {name,value:expr} =attr;
            // console.log(name,value) // type  text       v-model  school.name
            if(this.isDirective(name)){
                // console.log(name+"是一个指令")
                // console.log(name)  // v-model
                // console.log(value) // school.name
                let [,directive] = name.split("-"); //往CompilerUtil对象里面传的键  值 ，将v-model拆分成数组[v,model]
                // console.log(node) //找到这个元素  标签
                CompilerUtil[directive](node,expr,this.vm) //调用里面的model函数  html文件有几种，下面在对象中有定义就会调用
                //带指令的node，表达式，vue实例都传过去
            }
        })
    }

     // 编译文本节点
     compileText(node){
        // console.log(node)
        let content = node.textContent;
        // console.log(content); //得到文本节点中的内容 {{school.name}} {{school.age}} 1 1 还有一些换行的
        let reg = /\{\{(.+?)\}\}/;  // {}在正则中有特殊的含意，需要转义
        // reg.test(content)  如果content满足我们写的正则，返回ture，否则返回false
        //res是正则 text为正则里的方法
        if(reg.test(content)){
            // console.log(content);//{{school.name}} {{school.age}} 筛选出这两坨
            // console.log(node)//带引号的 "{{school.name}}"  node是文本节点
            CompilerUtil['text'](node,content,this.vm) //同上面编译元素节点
        }      

        
        
    }

    //得到下面一坨元素和文本节点/text也表示换行
    compile(node){
        // console.log(node.childNodes);//[text, input, text, div, text, div, text, ul, text]
        
        let childNodes = node.childNodes;
        [...childNodes].forEach(child=>{
            if(this.isElementNode(child)){
                //是元素节点
                this.compileElement(child)
                // 如果child内部还有其它节点，需要利用递归重新编译
                this.compile(child)
                
            }else{
                //文本节点
                this.compileText(child)
                

            }
        })

    }
    node2fragment(node){
        //创建一个文档碎片 得到部分
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild=node.firstChild){
            fragment.appendChild(firstChild)
        }
        return fragment;

    }

//判断是不是元素节点
    isElementNode(node){
        //nodeType 属性返回节点类型。
        // 如果节点是一个元素节点，nodeType 属性返回 1。 标签
        // 如果节点是属性节点, nodeType 属性返回 2。
        // 如果节点是一个文本节点，nodeType 属性返回 3。
        // 如果节点是一个注释节点，nodeType 属性返回 8。
        // 该属性是只读的。
        return node.nodeType === 1;
    }
}

//写一个对象，包含了对不同指令的处理办法
//里面的函数其实是键值对的简写
CompilerUtil = {

    //拿到value                    vm.$data school:{name:xx,age:xx}
    getVal(vm,expr){
        // console.log(expr);//school.name  v-model后面的值
        // console.log(expr.split("."));["school", "name"]
        return expr.split(".").reduce((data,current)=>{
            //第一次data['school']得到{name:xx,age:xx}为第二次的data
            //第二次data['name'] 得到name的值   第二次current为 'name'
            return data[current]
        },vm.$data)
    },

    //设置数据
    setVal(vm,expr,value){
        //下面这些得改变input的数据才能触发
        // console.log(vm)  // vue实例
        // console.log(expr)  // school.name
        // console.log(value)  // qqqqq 改变后的值
        // console.log(expr.split("."))  // ["school", "name"]
        expr.split(".").reduce((data,current,index,arr)=>{
            // 第1次：data是 school对象  current是"school"  index是0   arr是数组["school", "name"]
            // 第2次：data是undefined   cureent是"name"  index是1     arr是数组["school", "name"]
            // console.log(data,current,index,arr)
            if(index == arr.length-1){
                // console.log(current)  // name
                // console.log(data)
                return data[current] = value //name为传过来的value
            //     console.log(data[current])
            }
            // console.log("....")
            return data[current]  //把第一次的结果返回去重新循环，不然第二次data是undefined
        },vm.$data)
    },

    model(node,expr,vm){ // node是带指令的元素节点  expr是表达式  vm是vue对象
        // console.log("处理v-model指令");
        // console.log(node);// <input type="text" v-model="school.name">
        // console.log(expr)  //school.name
        // console.log(vm);//Vue {$el: "#app", $data: {…}}
        // 在这里要做v-model要做的事 实现双向数据绑定
        // 要给输入框一个value属性 node是输入框 node.value = xxxx
        
        
        let fn = this.updater["modelUpdater"]//得到modelUpdater函数 updater对象里面的modelUpdater为键值对形式的简写
        //给输入框添加一个观察着,如果后面数据改变了
        new Watcher(vm,expr,(newVal)=>{
            fn(node,newVal)
        })

        node.addEventListener("input",(e)=>{
            let value = e.target.value
            this.setVal(vm,expr,value);
        })


        let value = this.getVal(vm,expr)
        // console.log(value);qqqqq
        fn(node,value)
  

    },
    html(){
     // 在这里要做v-html要做的事

    },

    //text里得到的新内容
    getContentValue(vm,expr){
        return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            return this.getVal(vm,args[1])
        })
    },
    text(node,expr,vm){
        // console.log("处理v-text指令");
        // console.log(node);文本节点 "{{school.name}}"
        // console.log(expr) {{school.name}} 内容
        // console.log(vm)  // vue实例
        let fn =  this.updater["textUpdater"]  //同上面的元素节点
        let content = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{//replace方法自行百度
            //文本改变也放一个观察者
            new Watcher(vm,args[1],()=>{
                fn(node,this.getContentValue(vm,expr));
            })
            // console.log(vm)
            // console.log(args)  //["{{school.name}}", "school.name", 0, "{{school.name}}"]  后面还有个一样的age
            // console.log(this.getVal(vm,args[1]))  //qqqqq  100  通过reduce得到name和age
            return this.getVal(vm,args[1])
        })
        // console.log(content)  // // beida  100  返回的content
        fn(node,content);//传过去文本节点

        
        
    },
    //更新数据
    updater:{
        modelUpdater(node,value){
            //给input框上面挂了一个value属性 值为传过来的value qqqqq  这样input框里面就有值了
            node.value = value
        },
        htmlUpdater(){

        },
        //处理文本节点
        textUpdater(node,value){
            //textContent
            //此时文本节点的textContent换成了上面传的content,也就是qqqq 和100 浏览器不在显示{{school.name}} 
            node.textContent = value
        }

    }
}


class Vue{
    constructor(options){
        // console.log(options)//{el: "#app", data: {…}, methods: {…}, computed: {…}}
        this.$el = options.el;
        this.$data = options.data;
        let computed = options.computed;
        // console.log(computed) //{getNewName: ƒ}拿到html里面computed对象里面的函数 也就是键值对的简写,computed里面有很多属性，下面for in遍历
        if(this.$el){
            //el存在表示有html模板 下面需要找到指定的标签

             // 把数据变成响应式   当new Observer，后school就变成了响应式数据
            new Observer(this.$data) 
            // console.log(this.$data) //school: (...)   里面多了get set  school变成了响应式,但name和age没变成
            
            for(let key in computed){
                // console.log(key)  // getNewName
                // console.log(this);//Vue {$el: "#app", $data: {…}}   不知道this指啥就打印出来
                Object.defineProperty(this.$data,key,{
                    get(){ 
                        return computed[key].call(this) //让this指向自己并调用
                    }
                })
            }

            this.proxyVm(this.$data)                              //set school: (newval)=> {…}
            new Compiler(this.$el,this)
            
        }
    }
    proxyVm(data){  //让vm代理data,代理后控制台输入  vm.$data.school.name="edf"  vm.school.name="edf" 都可以修改name
        for(let key in data){
            // console.log(key+"......"+data[key]+"...."+data);//school......[object Object]....[object Object]
            
            Object.defineProperty(this,key,{//this是vm实例 
                get(){

                    return data[key]
                }
            })
        }
    }
}

// “响应式”，是指当数据改变后，Vue 会通知到使用该数据的代码。
//例如，视图渲染中使用了数据，数据改变后，视图也会自动更新。

// Object.defineProperty()的作用就是直接在一个对象上定义一个新属性，
//或者修改一个已经存在的属性get：一个给属性提供getter的方法，如果没有getter则为undefined。该方法返回值被用作属性值。默认为undefined。
// set：一个给属性提供setter的方法，如果没有setter则为undefined。该方法将接受唯一参数，并将该参数的新值分配给该属性。默认值为undefined。
 
// let obj = {}
        // obj.name = "xx" // 给一个对应设置一个属性
        // // 精细化设置一个对象的属性
        // Object.defineProperty(obj,'name',{
        //     configurable:true,
        //     enumerable:true,
        //     value:"xx"
        // })



//   总结：
//   MVVM 是Model-View-ViewModel 的缩写它是一种基于前端开发的架构模式，
//   其核心是提供对View 和 ViewModel 的双向数据绑定，
//   这使得ViewModel 的状态改变可以自动传递给 View，即所谓的数据双向绑定。
//   vue中，对外只暴露了一个名为Vue的构造函数，使用时会new一个Vue实例，然后传入一个
//   options 参数，类型为一个对象，包括当前 Vue 实例的作用域 el、模板绑定的数据 data 等等。
//   mvvm的实现主要通过object.defineProperty,重写set和data实现。
//   实现mvvm在new 一个mvvm实例后 编译过程主体分两部分，一部分是模板编译 Complie 
//   找到带指令的元素节点和插值表达式（v-text）的文本节点。分别进行元素和文本的编译
//   二是Observer（数据劫持）把数据变成响应式，Dep类用来发布订阅，constructor里面定义一个数组来存放所有的
//   观察者，notify通知subs容器中所有的观察者执行wather的updata方法
//   Watcher（观察者）如果数据改变，Object的defineProperty的set函数中调用Watcher的update方法

        