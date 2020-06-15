const compileUtil = {
  getVal (expr, vm) {
    // [parent, name]
    return expr.split('.').reduce((data, currentVal) => {
        return data[currentVal] || ''
    }, vm.$data)
  },
  getComtemtVal (expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },
  text (node, expr, vm) {
    let value;
    // expr: msg, vm: 实例
    if (expr.indexOf('{{') !== -1) {
      //处理 双大括号 {{parent.name}} 
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], (newVal) => {
          this.updater.textUpdater(node, this,getComtemtVal(expr, vm))
        })
        return this.getVal(args[1], vm)
      })
    } else {
      value = this.getVal(expr, vm)
    }
    // console.log(value)
    this.updater.textUpdater(node, value)
  },
  html (node, expr, vm) {
    const value = this.getVal(expr, vm)
    new Watcher(vm, expr, (newVal) => {
      this.updater.htmlUpdater(node, newVal )
    })
    this.updater.htmlUpdater(node, value)
  },
  model (node, expr, vm) {
    const value = this.getVal(expr, vm)
    new Watcher(vm, expr, (newVal) => {
      this.updater.modelUpdater(node, newVal )
    })
    this.updater.modelUpdater(node, value)
  },
  on (node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr];
     node.addEventListener(eventName,fn.bind(vm), false);
  },
  // 更新的函数
  updater: {
    textUpdater(node, value) {
      // console.log(node, 'node')
      node.textContent = value
    },
    htmlUpdater (node, value) {
      node.innerHTML = value
    },
    modelUpdater (node, value) {
      node.value = value
    }
  }
}
class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    // 1.获取文档碎片对象，放入内存中，会减少页面的回流和重绘
    const fragment = this.node2Fragment(this.el);
    // 2.编译模板
    this.compile(fragment)
    // 3.追加子元素到根元素
    this.el.appendChild(fragment);
  }
  compile (fragment) {
    // 获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(child => {
      // console.log(child)
      if (this.isElementNode(child)) {
        // 是元素节点
        // 编译元素节点
        // console.log(child, '元素节点')
        this.compileElement(child)
      } else {
        // 文本节点
        // 编译文本节点
        // console.log(child, '文本节点')
        this.compileText(child)
      }
      if (child.childNodes && child.childNodes.length) {
        this.compile(child)
      }
    })
  }
  compileElement (node) {
    // console.log(node, 'element node')
    // <div v-text="mgs"></div>
    const attributes = node.attributes
    //  console.log(attributes)
    ;[...attributes].forEach(attr => {
      // console.log(attr)
      const { name, value } = attr
      // console.log(name)
      if (this.isDirective(name)) {
        // 是一个指令 v-text v-htnl v-model v-on:click...
        const [str,dirctive] = name.split('-'); // text html model on:click...
        const [dirName, eventName] = dirctive.split(':'); // text html model on
        // 更新诗句 书籍驱动视图
        compileUtil[dirName](node, value, this.vm, eventName);

        // 删除有指令的标签上的属性
        node.removeAttribute('v-' + dirctive)
      } else if (this.isEventName(name)) { //@click="handlerClick"
      let [,eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName);
      }
    })
  }
  isBindEventName (attrName) {
    return attrName.startsWith(':')
  }
  isEventName (attrName) {
    return attrName.startsWith('@')
  }
  isDirective (attrName) {
    return attrName.startsWith('v-');
  }
  compileText (node) {
    // console.log(node, 'text node')
    // {{}} v-text
    const content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      // console.log(content)
      compileUtil['text'](node, content, this.vm)
    }
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
  node2Fragment(el) {
    // 创建文档碎片对象
    const f = document.createDocumentFragment();
    let firstChild;
    while ((firstChild = el.firstChild)) {
      f.appendChild(firstChild);
    }
    return f;
  }
}
class MyVue {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    this.$options = options;
    if (this.$el) {
      // 实现一个数据观察者
      new Observer(this.$data)
      // 实现一个指令解析器
      new Compile(this.$el, this);
    }
  }
}
