class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 先把旧值保存起来
    this.oldVal = this.getOldVal();
  }
  update() {
    const newVal = compileUitl.getVal(this.expr, this.vm);
    if (newVal !== this.oldVal) {
      this.cb(newVal);
    }
  }
  getOldVal() {
    Dep.target = this;
    const oldVal = compileUitl.getVal(this.expr, this.vm);
    Dep.target = null;
    return oldVal;
  }
}

class Dep {
  constructor() {
    this.subs = [];
  }
  // 收集Watcher 观察者
  addSub(watcher) {
    this.subs.push(watcher);
  }
  // 通知观察者去更新视图
  notify() {
    console.log("通知了观察者", this.subs);
    this.subs.forEach((w) => {
      w.update();
    });
  }
}

class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach((key) => {
        this.defineReactive(data, key, data[key]);
      });
    }
  }
  defineReactive(obj, key, value) {
    // 递归遍历
    this.observer(value);
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      enmerable: true,
      configurable: false,
      get() {
        // 订阅数据变化是，往Dep中添加观察者
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set: (newVal) => {
        this.observer(newVal);
        if (newVal !== value) {
          value = newVal;
        }
        // 通知变化
        dep.notify();
      },
    });
  }
}
