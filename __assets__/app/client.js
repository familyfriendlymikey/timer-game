
// node_modules/imba/src/imba/utils.imba
var \u03A8__initor__ = Symbol.for("#__initor__");
var \u03A8__inited__ = Symbol.for("#__inited__");
var \u03A8type = Symbol.for("#type");
var \u03A8__listeners__ = Symbol.for("#__listeners__");
function parseTime(value) {
  let typ = typeof value;
  if (typ == "number") {
    return value;
  }
  ;
  if (typ == "string") {
    if (/^\d+fps$/.test(value)) {
      return 1e3 / parseFloat(value);
    } else if (/^([-+]?[\d\.]+)s$/.test(value)) {
      return parseFloat(value) * 1e3;
    } else if (/^([-+]?[\d\.]+)ms$/.test(value)) {
      return parseFloat(value);
    }
    ;
  }
  ;
  return null;
}
function getDeepPropertyDescriptor(item, key, stop) {
  if (!item) {
    return void 0;
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc || item == stop) {
    return desc || void 0;
  }
  ;
  return getDeepPropertyDescriptor(Reflect.getPrototypeOf(item), key, stop);
}
var emit__ = function(event, args, node) {
  let prev;
  let cb;
  let ret;
  while ((prev = node) && (node = node.next)) {
    if (cb = node.listener) {
      if (node.path && cb[node.path]) {
        ret = args ? cb[node.path].apply(cb, args) : cb[node.path]();
      } else {
        ret = args ? cb.apply(node, args) : cb.call(node);
      }
      ;
    }
    ;
    if (node.times && --node.times <= 0) {
      prev.next = node.next;
      node.listener = null;
    }
    ;
  }
  ;
  return;
};
function listen(obj, event, listener, path) {
  var \u03C65;
  let cbs;
  let list;
  let tail;
  cbs = obj[\u03A8__listeners__] || (obj[\u03A8__listeners__] = {});
  list = cbs[event] || (cbs[event] = {});
  tail = list.tail || (list.tail = list.next = {});
  tail.listener = listener;
  tail.path = path;
  list.tail = tail.next = {};
  return tail;
}
function once(obj, event, listener) {
  let tail = listen(obj, event, listener);
  tail.times = 1;
  return tail;
}
function unlisten(obj, event, cb, meth) {
  let node;
  let prev;
  let meta = obj[\u03A8__listeners__];
  if (!meta) {
    return;
  }
  ;
  if (node = meta[event]) {
    while ((prev = node) && (node = node.next)) {
      if (node == cb || node.listener == cb) {
        prev.next = node.next;
        node.listener = null;
        break;
      }
      ;
    }
    ;
  }
  ;
  return;
}
function emit(obj, event, params) {
  let cb;
  if (cb = obj[\u03A8__listeners__]) {
    if (cb[event]) {
      emit__(event, params, cb[event]);
    }
    ;
    if (cb.all) {
      emit__(event, [event, params], cb.all);
    }
    ;
  }
  ;
  return;
}

// node_modules/imba/src/imba/scheduler.imba
function iter$__(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__ = Symbol.for("#__init__");
var \u03A8__initor__2 = Symbol.for("#__initor__");
var \u03A8__inited__2 = Symbol.for("#__inited__");
var \u03A8schedule = Symbol.for("#schedule");
var \u03A8frames = Symbol.for("#frames");
var \u03A8interval = Symbol.for("#interval");
var \u03A8stage = Symbol.for("#stage");
var \u03A8scheduled = Symbol.for("#scheduled");
var \u03A8fps = Symbol.for("#fps");
var \u03A8ticker = Symbol.for("#ticker");
var rAF = globalThis.requestAnimationFrame || function(blk) {
  return setTimeout1(blk, 1e3 / 60);
};
var SPF = 1 / 60;
var Scheduled = class {
  constructor($$ = null) {
    this[\u03A8__init__]($$);
  }
  [\u03A8__init__]($$ = null) {
    var v\u03C6;
    this.owner = $$ && (v\u03C6 = $$.owner) !== void 0 ? v\u03C6 : null;
    this.target = $$ && (v\u03C6 = $$.target) !== void 0 ? v\u03C6 : null;
    this.active = $$ && (v\u03C6 = $$.active) !== void 0 ? v\u03C6 : false;
    this.value = $$ && (v\u03C6 = $$.value) !== void 0 ? v\u03C6 : void 0;
    this.skip = $$ && (v\u03C6 = $$.skip) !== void 0 ? v\u03C6 : 0;
    this.last = $$ && (v\u03C6 = $$.last) !== void 0 ? v\u03C6 : 0;
  }
  tick(scheduler2, source) {
    this.last = this.owner[\u03A8frames];
    this.target.tick(this, source);
    return 1;
  }
  update(o, activate\u03A6) {
    let on = this.active;
    let val = o.value;
    let changed = this.value != val;
    if (changed) {
      this.deactivate();
      this.value = val;
    }
    ;
    if (this.value || on || activate\u03A6) {
      this.activate();
    }
    ;
    return this;
  }
  queue() {
    this.owner.add(this);
    return;
  }
  activate() {
    if (this.value === true) {
      this.owner.on("commit", this);
    } else if (this.value === false) {
      true;
    } else if (typeof this.value == "number") {
      let tock = this.value / (1e3 / 60);
      if (tock <= 2) {
        this.owner.on("raf", this);
      } else {
        this[\u03A8interval] = globalThis.setInterval(this.queue.bind(this), this.value);
      }
      ;
    }
    ;
    this.active = true;
    return this;
  }
  deactivate() {
    if (this.value === true) {
      this.owner.un("commit", this);
    }
    ;
    this.owner.un("raf", this);
    if (this[\u03A8interval]) {
      globalThis.clearInterval(this[\u03A8interval]);
      this[\u03A8interval] = null;
    }
    ;
    this.active = false;
    return this;
  }
};
var Scheduler = class {
  constructor() {
    var self = this;
    this.id = Symbol();
    this.queue = [];
    this.stage = -1;
    this[\u03A8stage] = -1;
    this[\u03A8frames] = 0;
    this[\u03A8scheduled] = false;
    this.listeners = {};
    this.intervals = {};
    self.commit = function() {
      self.add("commit");
      return self;
    };
    this[\u03A8fps] = 0;
    self.$promise = null;
    self.$resolve = null;
    this[\u03A8ticker] = function(e) {
      self[\u03A8scheduled] = false;
      return self.tick(e);
    };
    self;
  }
  add(item, force) {
    if (force || this.queue.indexOf(item) == -1) {
      this.queue.push(item);
    }
    ;
    if (!this[\u03A8scheduled]) {
      this[\u03A8schedule]();
    }
    ;
    return this;
  }
  get committing\u03A6() {
    return this.queue.indexOf("commit") >= 0;
  }
  listen(ns, item) {
    let set = this.listeners[ns];
    let first = !set;
    set || (set = this.listeners[ns] = new Set());
    set.add(item);
    if (ns == "raf" && first) {
      this.add("raf");
    }
    ;
    return this;
  }
  unlisten(ns, item) {
    var \u03C65;
    let set = this.listeners[ns];
    set && set.delete(item);
    if (ns == "raf" && set && set.size == 0) {
      \u03C65 = this.listeners.raf, delete this.listeners.raf, \u03C65;
    }
    ;
    return this;
  }
  on(ns, item) {
    return this.listen(ns, item);
  }
  un(ns, item) {
    return this.unlisten(ns, item);
  }
  get promise() {
    var self = this;
    return self.$promise || (self.$promise = new Promise(function(resolve) {
      return self.$resolve = resolve;
    }));
  }
  tick(timestamp) {
    var self = this;
    let items = this.queue;
    let frame = this[\u03A8frames]++;
    if (!this.ts) {
      this.ts = timestamp;
    }
    ;
    this.dt = timestamp - this.ts;
    this.ts = timestamp;
    this.queue = [];
    this[\u03A8stage] = 1;
    if (items.length) {
      for (let i = 0, items\u03C6 = iter$__(items), len\u03C6 = items\u03C6.length; i < len\u03C6; i++) {
        let item = items\u03C6[i];
        if (typeof item === "string" && this.listeners[item]) {
          self.listeners[item].forEach(function(listener) {
            if (listener.tick instanceof Function) {
              return listener.tick(self, item);
            } else if (listener instanceof Function) {
              return listener(self, item);
            }
            ;
          });
        } else if (item instanceof Function) {
          item(self.dt, self);
        } else if (item.tick) {
          item.tick(self.dt, self);
        }
        ;
      }
      ;
    }
    ;
    this[\u03A8stage] = this[\u03A8scheduled] ? 0 : -1;
    if (self.$promise) {
      self.$resolve(self);
      self.$promise = self.$resolve = null;
    }
    ;
    if (self.listeners.raf && true) {
      self.add("raf");
    }
    ;
    return self;
  }
  [\u03A8schedule]() {
    if (!this[\u03A8scheduled]) {
      this[\u03A8scheduled] = true;
      if (this[\u03A8stage] == -1) {
        this[\u03A8stage] = 0;
      }
      ;
      rAF(this[\u03A8ticker]);
    }
    ;
    return this;
  }
  schedule(item, o) {
    var \u03C622, \u03C632;
    o || (o = item[\u03C622 = this.id] || (item[\u03C622] = {value: true}));
    let state = o[\u03C632 = this.id] || (o[\u03C632] = new Scheduled({owner: this, target: item}));
    return state.update(o, true);
  }
  unschedule(item, o = {}) {
    o || (o = item[this.id]);
    let state = o && o[this.id];
    if (state && state.active) {
      state.deactivate();
    }
    ;
    return this;
  }
};
var scheduler = new Scheduler();
function commit() {
  return scheduler.add("commit").promise;
}
function setTimeout2(fn, ms) {
  return globalThis.setTimeout(function() {
    fn();
    commit();
    return;
  }, ms);
}
function setInterval2(fn, ms) {
  return globalThis.setInterval(function() {
    fn();
    commit();
    return;
  }, ms);
}
var clearInterval2 = globalThis.clearInterval;
var clearTimeout = globalThis.clearTimeout;
var instance = globalThis.imba || (globalThis.imba = {});
instance.commit = commit;
instance.setTimeout = setTimeout2;
instance.setInterval = setInterval2;
instance.clearInterval = clearInterval2;
instance.clearTimeout = clearTimeout;

// node_modules/imba/src/imba/dom/flags.imba
var \u03A8__initor__3 = Symbol.for("#__initor__");
var \u03A8__inited__3 = Symbol.for("#__inited__");
var Flags = class {
  constructor(dom) {
    this.dom = dom;
    this.string = "";
  }
  contains(ref) {
    return this.dom.classList.contains(ref);
  }
  add(ref) {
    if (this.contains(ref)) {
      return this;
    }
    ;
    this.string += (this.string ? " " : "") + ref;
    this.dom.classList.add(ref);
    return this;
  }
  remove(ref) {
    if (!this.contains(ref)) {
      return this;
    }
    ;
    let regex = new RegExp("(^|\\s)*" + ref + "(\\s|$)*", "g");
    this.string = this.string.replace(regex, "");
    this.dom.classList.remove(ref);
    return this;
  }
  toggle(ref, bool) {
    if (bool === void 0) {
      bool = !this.contains(ref);
    }
    ;
    return bool ? this.add(ref) : this.remove(ref);
  }
  incr(ref) {
    let m = this.stacks || (this.stacks = {});
    let c = m[ref] || 0;
    if (c < 1) {
      this.add(ref);
    }
    ;
    return m[ref] = Math.max(c, 0) + 1;
  }
  decr(ref) {
    let m = this.stacks || (this.stacks = {});
    let c = m[ref] || 0;
    if (c == 1) {
      this.remove(ref);
    }
    ;
    return m[ref] = Math.max(c, 1) - 1;
  }
  valueOf() {
    return this.string;
  }
  toString() {
    return this.string;
  }
  sync() {
    return this.dom.flagSync$();
  }
};

// node_modules/imba/src/imba/dom/core.web.imba
function extend$__(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__2(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8parent = Symbol.for("#parent");
var \u03A8context = Symbol.for("#context");
var \u03A8__init__2 = Symbol.for("#__init__");
var \u03A8insertChild = Symbol.for("#insertChild");
var \u03A8appendChild = Symbol.for("#appendChild");
var \u03A8replaceChild = Symbol.for("#replaceChild");
var \u03A8removeChild = Symbol.for("#removeChild");
var \u03A8insertInto = Symbol.for("#insertInto");
var \u03A8insertIntoDeopt = Symbol.for("#insertIntoDeopt");
var \u03A8removeFrom = Symbol.for("#removeFrom");
var \u03A8removeFromDeopt = Symbol.for("#removeFromDeopt");
var \u03A8replaceWith = Symbol.for("#replaceWith");
var \u03A8replaceWithDeopt = Symbol.for("#replaceWithDeopt");
var \u03A8placeholderNode = Symbol.for("#placeholderNode");
var \u03A8attachToParent = Symbol.for("#attachToParent");
var \u03A8detachFromParent = Symbol.for("#detachFromParent");
var \u03A8placeChild = Symbol.for("#placeChild");
var \u03A8beforeReconcile = Symbol.for("#beforeReconcile");
var \u03A8afterReconcile = Symbol.for("#afterReconcile");
var \u03A8afterVisit = Symbol.for("#afterVisit");
var \u03A8__initor__4 = Symbol.for("#__initor__");
var \u03A8__inited__4 = Symbol.for("#__inited__");
var \u03A8\u03A8parent = Symbol.for("##parent");
var \u03A8\u03A8up = Symbol.for("##up");
var \u03A8\u03A8context = Symbol.for("##context");
var \u03A8domNode = Symbol.for("#domNode");
var \u03A8\u03A8placeholderNode = Symbol.for("##placeholderNode");
var \u03A8domDeopt = Symbol.for("#domDeopt");
var \u03A8src = Symbol.for("#src");
var \u03A8htmlNodeName = Symbol.for("#htmlNodeName");
var \u03A8ImbaElement = Symbol.for("#ImbaElement");
var \u03C6 = Symbol();
var {
  Event,
  UIEvent,
  MouseEvent,
  PointerEvent,
  KeyboardEvent,
  CustomEvent,
  Node: Node2,
  Comment,
  Text,
  Element,
  HTMLElement,
  HTMLHtmlElement,
  HTMLSelectElement,
  HTMLInputElement,
  HTMLTextAreaElement,
  HTMLButtonElement,
  HTMLOptionElement,
  HTMLScriptElement,
  SVGElement,
  DocumentFragment,
  ShadowRoot,
  Document,
  Window,
  customElements
} = globalThis.window;
var descriptorCache = {};
function getDescriptor(item, key, cache) {
  if (!item) {
    return cache[key] = null;
  }
  ;
  if (cache[key] !== void 0) {
    return cache[key];
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc !== void 0 || item == SVGElement) {
    return cache[key] = desc || null;
  }
  ;
  return getDescriptor(Reflect.getPrototypeOf(item), key, cache);
}
var CustomTagConstructors = {};
var CustomTagToElementNames = {};
var TYPES = {};
var CUSTOM_TYPES = {};
var contextHandler = {
  get(target, name) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      if (ctx = ctx[\u03A8parent]) {
        val = ctx[name];
      }
      ;
    }
    ;
    return val;
  },
  set(target, name, value) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      let desc = getDeepPropertyDescriptor(ctx, name, Element);
      if (desc) {
        ctx[name] = value;
        return true;
      } else {
        ctx = ctx[\u03A8parent];
      }
      ;
    }
    ;
    return true;
  }
};
var Extend$Document$af = class {
  get flags() {
    return this.documentElement.flags;
  }
};
extend$__(Document.prototype, Extend$Document$af.prototype);
var Extend$Node$ag = class {
  get [\u03A8parent]() {
    return this[\u03A8\u03A8parent] || this.parentNode || this[\u03A8\u03A8up];
  }
  get [\u03A8context]() {
    return this[\u03A8\u03A8context] || (this[\u03A8\u03A8context] = new Proxy(this, contextHandler));
  }
  [\u03A8__init__2]() {
    return this;
  }
  [\u03A8insertChild](newnode, refnode) {
    return newnode[\u03A8insertInto](this, refnode);
  }
  [\u03A8appendChild](newnode) {
    return newnode[\u03A8insertInto](this, null);
  }
  [\u03A8replaceChild](newnode, oldnode) {
    let res = this[\u03A8insertChild](newnode, oldnode);
    this[\u03A8removeChild](oldnode);
    return res;
  }
  [\u03A8removeChild](node) {
    return node[\u03A8removeFrom](this);
  }
  [\u03A8insertInto](parent, before = null) {
    if (before) {
      parent.insertBefore(this, before);
    } else {
      parent.appendChild(this);
    }
    ;
    return this;
  }
  [\u03A8insertIntoDeopt](parent, before) {
    if (before) {
      parent.insertBefore(this[\u03A8domNode] || this, before);
    } else {
      parent.appendChild(this[\u03A8domNode] || this);
    }
    ;
    return this;
  }
  [\u03A8removeFrom](parent) {
    return parent.removeChild(this);
  }
  [\u03A8removeFromDeopt](parent) {
    return parent.removeChild(this[\u03A8domNode] || this);
  }
  [\u03A8replaceWith](other, parent) {
    return parent[\u03A8replaceChild](other, this);
  }
  [\u03A8replaceWithDeopt](other, parent) {
    return parent[\u03A8replaceChild](other, this[\u03A8domNode] || this);
  }
  get [\u03A8placeholderNode]() {
    return this[\u03A8\u03A8placeholderNode] || (this[\u03A8\u03A8placeholderNode] = globalThis.document.createComment("placeholder"));
  }
  set [\u03A8placeholderNode](value) {
    let prev = this[\u03A8\u03A8placeholderNode];
    this[\u03A8\u03A8placeholderNode] = value;
    if (prev && prev != value && prev.parentNode) {
      prev[\u03A8replaceWith](value);
    }
    ;
  }
  [\u03A8attachToParent]() {
    let ph = this[\u03A8domNode];
    let par = ph && ph.parentNode;
    if (ph && par && ph != this) {
      this[\u03A8domNode] = null;
      this[\u03A8insertInto](par, ph);
      ph[\u03A8removeFrom](par);
    }
    ;
    return this;
  }
  [\u03A8detachFromParent]() {
    if (this[\u03A8domDeopt] != true ? (this[\u03A8domDeopt] = true, true) : false) {
      this[\u03A8replaceWith] = this[\u03A8replaceWithDeopt];
      this[\u03A8removeFrom] = this[\u03A8removeFromDeopt];
      this[\u03A8insertInto] = this[\u03A8insertIntoDeopt];
    }
    ;
    let ph = this[\u03A8placeholderNode];
    if (this.parentNode && ph != this) {
      ph[\u03A8insertInto](this.parentNode, this);
      this[\u03A8removeFrom](this.parentNode);
    }
    ;
    this[\u03A8domNode] = ph;
    return this;
  }
  [\u03A8placeChild](item, f, prev) {
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = globalThis.document.createComment("");
      return prev ? prev[\u03A8replaceWith](el, this) : el[\u03A8insertInto](this, null);
    }
    ;
    if (item === prev) {
      return item;
    } else if (type !== "object") {
      let res;
      let txt = item;
      if (f & 128 && f & 256 && false) {
        this.textContent = txt;
        return;
      }
      ;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = globalThis.document.createTextNode(txt);
          prev[\u03A8replaceWith](res, this);
          return res;
        }
        ;
      } else {
        this.appendChild(res = globalThis.document.createTextNode(txt));
        return res;
      }
      ;
    } else {
      return prev ? prev[\u03A8replaceWith](item, this) : item[\u03A8insertInto](this, null);
    }
    ;
    return;
  }
};
extend$__(Node2.prototype, Extend$Node$ag.prototype);
var Extend$Element$ah = class {
  log(...params) {
    console.log(...params);
    return this;
  }
  emit(name, detail, o = {bubbles: true, cancelable: true}) {
    if (detail != void 0) {
      o.detail = detail;
    }
    ;
    let event = new CustomEvent(name, o);
    let res = this.dispatchEvent(event);
    return event;
  }
  slot$(name, ctx) {
    return this;
  }
  text$(item) {
    this.textContent = item;
    return this;
  }
  [\u03A8beforeReconcile]() {
    return this;
  }
  [\u03A8afterReconcile]() {
    return this;
  }
  [\u03A8afterVisit]() {
    if (this.render) {
      this.render();
    }
    ;
    return;
  }
  get flags() {
    if (!this.$flags) {
      this.$flags = new Flags(this);
      if (this.flag$ == Element.prototype.flag$) {
        this.flags$ext = this.className;
      }
      ;
      this.flagDeopt$();
    }
    ;
    return this.$flags;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.className = ns ? ns + (this.flags$ext = str) : this.flags$ext = str;
    return;
  }
  flagDeopt$() {
    var self = this;
    this.flag$ = this.flagExt$;
    self.flagSelf$ = function(str) {
      return self.flagSync$(self.flags$own = str);
    };
    return;
  }
  flagExt$(str) {
    return this.flagSync$(this.flags$ext = str);
  }
  flagSelf$(str) {
    this.flagDeopt$();
    return this.flagSelf$(str);
  }
  flagSync$() {
    return this.className = (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || "");
  }
  set$(key, value) {
    let desc = getDeepPropertyDescriptor(this, key, Element);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  get richValue() {
    return this.value;
  }
  set richValue(value) {
    this.value = value;
  }
};
extend$__(Element.prototype, Extend$Element$ah.prototype);
Element.prototype.setns$ = Element.prototype.setAttributeNS;
function createElement(name, parent, flags, text) {
  let el = globalThis.document.createElement(name);
  if (flags) {
    el.className = flags;
  }
  ;
  if (text !== null) {
    el.text$(text);
  }
  ;
  if (parent && parent[\u03A8appendChild]) {
    parent[\u03A8appendChild](el);
  }
  ;
  return el;
}
var Extend$SVGElement$ai = class {
  set$(key, value) {
    var \u03C622;
    let cache = descriptorCache[\u03C622 = this.nodeName] || (descriptorCache[\u03C622] = {});
    let desc = getDescriptor(this, key, cache);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.setAttribute("class", ns ? ns + (this.flags$ext = str) : this.flags$ext = str);
    return;
  }
  flagSelf$(str) {
    var self = this;
    self.flag$ = function(str2) {
      return self.flagSync$(self.flags$ext = str2);
    };
    self.flagSelf$ = function(str2) {
      return self.flagSync$(self.flags$own = str2);
    };
    return self.flagSelf$(str);
  }
  flagSync$() {
    return this.setAttribute("class", (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || ""));
  }
};
extend$__(SVGElement.prototype, Extend$SVGElement$ai.prototype);
var Extend$SVGSVGElement$aj = class {
  set src(value) {
    if (this[\u03A8src] != value ? (this[\u03A8src] = value, true) : false) {
      if (value) {
        if (value.adoptNode) {
          value.adoptNode(this);
        } else if (value.content) {
          for (let o\u03C6 = value.attributes, i\u03C6 = 0, keys\u03C6 = Object.keys(o\u03C6), l\u03C6 = keys\u03C6.length, k, v; i\u03C6 < l\u03C6; i\u03C6++) {
            k = keys\u03C6[i\u03C6];
            v = o\u03C6[k];
            this.setAttribute(k, v);
          }
          ;
          this.innerHTML = value.content;
        }
        ;
      }
      ;
    }
    ;
    return;
  }
};
extend$__(SVGSVGElement.prototype, Extend$SVGSVGElement$aj.prototype);
function createComment(text) {
  return globalThis.document.createComment(text);
}
function createTextNode(text) {
  return globalThis.document.createTextNode(text);
}
var navigator = globalThis.navigator;
var vendor = navigator && navigator.vendor || "";
var ua = navigator && navigator.userAgent || "";
var isSafari = vendor.indexOf("Apple") > -1 || ua.indexOf("CriOS") >= 0 || ua.indexOf("FxiOS") >= 0;
var supportsCustomizedBuiltInElements = !isSafari;
var CustomDescriptorCache = new Map();
var CustomHook = class extends HTMLElement {
  connectedCallback() {
    if (supportsCustomizedBuiltInElements) {
      return this.parentNode.removeChild(this);
    } else {
      return this.parentNode.connectedCallback();
    }
    ;
  }
  disconnectedCallback() {
    if (!supportsCustomizedBuiltInElements) {
      return this.parentNode.disconnectedCallback();
    }
    ;
  }
};
window.customElements.define("i-hook", CustomHook);
function getCustomDescriptors(el, klass) {
  let props = CustomDescriptorCache.get(klass);
  if (!props) {
    props = {};
    let proto = klass.prototype;
    let protos = [proto];
    while (proto = proto && Object.getPrototypeOf(proto)) {
      if (proto.constructor == el.constructor) {
        break;
      }
      ;
      protos.unshift(proto);
    }
    ;
    for (let i\u03C62 = 0, items\u03C6 = iter$__2(protos), len\u03C6 = items\u03C6.length; i\u03C62 < len\u03C6; i\u03C62++) {
      let item = items\u03C6[i\u03C62];
      let desc = Object.getOwnPropertyDescriptors(item);
      Object.assign(props, desc);
    }
    ;
    CustomDescriptorCache.set(klass, props);
  }
  ;
  return props;
}
function createComponent(name, parent, flags, text, ctx) {
  let el;
  if (typeof name != "string") {
    if (name && name.nodeName) {
      name = name.nodeName;
    }
    ;
  }
  ;
  let cmpname = CustomTagToElementNames[name] || name;
  if (CustomTagConstructors[name]) {
    let cls = CustomTagConstructors[name];
    let typ = cls.prototype[\u03A8htmlNodeName];
    if (typ && supportsCustomizedBuiltInElements) {
      el = globalThis.document.createElement(typ, {is: name});
    } else if (cls.create$ && typ) {
      el = globalThis.document.createElement(typ);
      el.setAttribute("is", cmpname);
      let props = getCustomDescriptors(el, cls);
      Object.defineProperties(el, props);
      el.__slots = {};
      el.appendChild(globalThis.document.createElement("i-hook"));
    } else if (cls.create$) {
      el = cls.create$(el);
      el.__slots = {};
    } else {
      console.warn("could not create tag " + name);
    }
    ;
  } else {
    el = globalThis.document.createElement(CustomTagToElementNames[name] || name);
  }
  ;
  el[\u03A8\u03A8parent] = parent;
  el[\u03A8__init__2]();
  if (text !== null) {
    el.slot$("__").text$(text);
  }
  ;
  if (flags || el.flags$ns) {
    el.flag$(flags || "");
  }
  ;
  return el;
}
function defineTag(name, klass, options = {}) {
  TYPES[name] = CUSTOM_TYPES[name] = klass;
  klass.nodeName = name;
  let componentName = name;
  let proto = klass.prototype;
  if (name.indexOf("-") == -1) {
    componentName = "" + name + "-tag";
    CustomTagToElementNames[name] = componentName;
  }
  ;
  let basens = proto._ns_;
  if (options.ns) {
    let ns = options.ns;
    let flags = ns + " " + ns + "_ ";
    if (basens) {
      flags += proto.flags$ns;
      ns += " " + basens;
    }
    ;
    proto._ns_ = ns;
    proto.flags$ns = flags;
  }
  ;
  if (proto[\u03A8htmlNodeName] && !options.extends) {
    options.extends = proto[\u03A8htmlNodeName];
  }
  ;
  if (options.extends) {
    proto[\u03A8htmlNodeName] = options.extends;
    CustomTagConstructors[name] = klass;
    if (supportsCustomizedBuiltInElements) {
      window.customElements.define(componentName, klass, {extends: options.extends});
    }
    ;
  } else {
    window.customElements.define(componentName, klass);
  }
  ;
  return klass;
}
var instance2 = globalThis.imba || (globalThis.imba = {});
instance2.document = globalThis.document;

// node_modules/imba/src/imba/dom/fragment.imba
function iter$__3(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8parent2 = Symbol.for("#parent");
var \u03A8__initor__5 = Symbol.for("#__initor__");
var \u03A8__inited__5 = Symbol.for("#__inited__");
var \u03A8appendChild2 = Symbol.for("#appendChild");
var \u03A8removeChild2 = Symbol.for("#removeChild");
var \u03A8insertInto2 = Symbol.for("#insertInto");
var \u03A8replaceWith2 = Symbol.for("#replaceWith");
var \u03A8insertChild2 = Symbol.for("#insertChild");
var \u03A8removeFrom2 = Symbol.for("#removeFrom");
var \u03A8placeChild2 = Symbol.for("#placeChild");
var \u03A8__init__3 = Symbol.for("#__init__");
var \u03A8\u03A8parent2 = Symbol.for("##parent");
var \u03A8\u03A8up2 = Symbol.for("##up");
var \u03A8domFlags = Symbol.for("#domFlags");
var \u03A8end = Symbol.for("#end");
var \u03A8textContent = Symbol.for("#textContent");
var \u03A8textNode = Symbol.for("#textNode");
var \u03C62 = Symbol();
var Fragment = class {
  constructor() {
    this.childNodes = [];
  }
  log(...params) {
    return;
    return console.log(this.constructor.name, ...params);
  }
  hasChildNodes() {
    return false;
  }
  set [\u03A8parent2](value) {
    this[\u03A8\u03A8parent2] = value;
  }
  get [\u03A8parent2]() {
    return this[\u03A8\u03A8parent2] || this[\u03A8\u03A8up2];
  }
};
var counter = 0;
var VirtualFragment = class extends Fragment {
  static [\u03A8__init__3]() {
    this.prototype[\u03A8__initor__5] = \u03C62;
    return this;
  }
  constructor(flags, parent) {
    super(...arguments);
    this[\u03A8\u03A8up2] = parent;
    this.parentNode = null;
    this[\u03A8domFlags] = flags;
    this.childNodes = [];
    this[\u03A8end] = createComment("slot" + counter++);
    if (parent) {
      parent[\u03A8appendChild2](this);
    }
    ;
    this[\u03A8__initor__5] === \u03C62 && this[\u03A8__inited__5] && this[\u03A8__inited__5]();
  }
  get [\u03A8parent2]() {
    return this[\u03A8\u03A8parent2] || this.parentNode || this[\u03A8\u03A8up2];
  }
  set textContent(text) {
    this[\u03A8textContent] = text;
  }
  get textContent() {
    return this[\u03A8textContent];
  }
  hasChildNodes() {
    for (let i\u03C6 = 0, items\u03C6 = iter$__3(this.childNodes), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let item = items\u03C6[i\u03C6];
      if (item instanceof Fragment) {
        if (item.hasChildNodes()) {
          return true;
        }
        ;
      }
      ;
      if (item instanceof Comment) {
        true;
      } else if (item instanceof Node) {
        return true;
      }
      ;
    }
    ;
    return false;
  }
  text$(item) {
    if (!this[\u03A8textNode]) {
      this[\u03A8textNode] = this[\u03A8placeChild2](item);
    } else {
      this[\u03A8textNode].textContent = item;
    }
    ;
    return this[\u03A8textNode];
  }
  appendChild(child) {
    if (this.parentNode) {
      child[\u03A8insertInto2](this.parentNode, this[\u03A8end]);
    }
    ;
    return this.childNodes.push(child);
  }
  [\u03A8appendChild2](child) {
    if (this.parentNode) {
      child[\u03A8insertInto2](this.parentNode, this[\u03A8end]);
    }
    ;
    return this.childNodes.push(child);
  }
  insertBefore(node, refnode) {
    if (this.parentNode) {
      this.parentNode[\u03A8insertChild2](node, refnode);
    }
    ;
    let idx = this.childNodes.indexOf(refnode);
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, node);
    }
    ;
    return node;
  }
  [\u03A8removeChild2](node) {
    if (this.parentNode) {
      this.parentNode[\u03A8removeChild2](node);
    }
    ;
    let idx = this.childNodes.indexOf(node);
    if (idx >= 0) {
      this.childNodes.splice(idx, 1);
    }
    ;
    return;
  }
  [\u03A8insertInto2](parent, before) {
    let prev = this.parentNode;
    if (this.parentNode != parent ? (this.parentNode = parent, true) : false) {
      if (this[\u03A8end]) {
        before = this[\u03A8end][\u03A8insertInto2](parent, before);
      }
      ;
      for (let i\u03C62 = 0, items\u03C62 = iter$__3(this.childNodes), len\u03C62 = items\u03C62.length; i\u03C62 < len\u03C62; i\u03C62++) {
        let item = items\u03C62[i\u03C62];
        item[\u03A8insertInto2](parent, before);
      }
      ;
    }
    ;
    return this;
  }
  [\u03A8replaceWith2](node, parent) {
    let res = node[\u03A8insertInto2](parent, this[\u03A8end]);
    this[\u03A8removeFrom2](parent);
    return res;
  }
  [\u03A8insertChild2](node, refnode) {
    if (this.parentNode) {
      this.insertBefore(node, refnode || this[\u03A8end]);
    }
    ;
    if (refnode) {
      let idx = this.childNodes.indexOf(refnode);
      if (idx >= 0) {
        this.childNodes.splice(idx, 0, node);
      }
      ;
    } else {
      this.childNodes.push(node);
    }
    ;
    return node;
  }
  [\u03A8removeFrom2](parent) {
    for (let i\u03C63 = 0, items\u03C63 = iter$__3(this.childNodes), len\u03C63 = items\u03C63.length; i\u03C63 < len\u03C63; i\u03C63++) {
      let item = items\u03C63[i\u03C63];
      item[\u03A8removeFrom2](parent);
    }
    ;
    if (this[\u03A8end]) {
      this[\u03A8end][\u03A8removeFrom2](parent);
    }
    ;
    this.parentNode = null;
    return this;
  }
  [\u03A8placeChild2](item, f, prev) {
    let par = this.parentNode;
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = createComment("");
      if (prev) {
        let idx = this.childNodes.indexOf(prev);
        this.childNodes.splice(idx, 1, el);
        if (par) {
          prev[\u03A8replaceWith2](el, par);
        }
        ;
        return el;
      }
      ;
      this.childNodes.push(el);
      if (par) {
        el[\u03A8insertInto2](par, this[\u03A8end]);
      }
      ;
      return el;
    }
    ;
    if (item === prev) {
      return item;
    }
    ;
    if (type !== "object") {
      let res;
      let txt = item;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = createTextNode(txt);
          let idx = this.childNodes.indexOf(prev);
          this.childNodes.splice(idx, 1, res);
          if (par) {
            prev[\u03A8replaceWith2](res, par);
          }
          ;
          return res;
        }
        ;
      } else {
        this.childNodes.push(res = createTextNode(txt));
        if (par) {
          res[\u03A8insertInto2](par, this[\u03A8end]);
        }
        ;
        return res;
      }
      ;
    } else if (prev) {
      let idx = this.childNodes.indexOf(prev);
      this.childNodes.splice(idx, 1, item);
      if (par) {
        prev[\u03A8replaceWith2](item, par);
      }
      ;
      return item;
    } else {
      this.childNodes.push(item);
      if (par) {
        item[\u03A8insertInto2](par, this[\u03A8end]);
      }
      ;
      return item;
    }
    ;
  }
};
VirtualFragment[\u03A8__init__3]();
function createSlot(bitflags, par) {
  const el = new VirtualFragment(bitflags, null);
  el[\u03A8\u03A8up2] = par;
  return el;
}

// node_modules/imba/src/imba/dom/keyed-list.imba
function iter$__4(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8appendChild3 = Symbol.for("#appendChild");
var \u03A8insertChild3 = Symbol.for("#insertChild");
var \u03A8replaceWith3 = Symbol.for("#replaceWith");
var \u03A8insertInto3 = Symbol.for("#insertInto");
var \u03A8removeFrom3 = Symbol.for("#removeFrom");
var \u03A8afterVisit2 = Symbol.for("#afterVisit");
var \u03A8__initor__6 = Symbol.for("#__initor__");
var \u03A8__inited__6 = Symbol.for("#__inited__");
var \u03A8__init__4 = Symbol.for("#__init__");
var \u03A8domFlags2 = Symbol.for("#domFlags");
var \u03A8\u03A8parent3 = Symbol.for("##parent");
var \u03A8end2 = Symbol.for("#end");
var \u03A8removeChild3 = Symbol.for("#removeChild");
var \u03C63 = Symbol();
var KeyedTagFragment = class extends Fragment {
  static [\u03A8__init__4]() {
    this.prototype[\u03A8__initor__6] = \u03C63;
    return this;
  }
  constructor(f, parent) {
    super(...arguments);
    this[\u03A8domFlags2] = f;
    this[\u03A8\u03A8parent3] = parent;
    this.changes = new Map();
    this.dirty = false;
    this.array = this.childNodes;
    this.$ = {};
    if (!(f & 256)) {
      this[\u03A8end2] = createComment("map");
    }
    ;
    if (parent) {
      parent[\u03A8appendChild3](this);
    }
    ;
    this[\u03A8__initor__6] === \u03C63 && this[\u03A8__inited__6] && this[\u03A8__inited__6]();
  }
  [\u03A8appendChild3](item) {
    if (this.parentNode) {
      return this.parentNode[\u03A8insertChild3](item, this[\u03A8end2]);
    }
    ;
  }
  hasChildNodes() {
    if (this.childNodes.length == 0) {
      return false;
    }
    ;
    return true;
  }
  push(item, idx) {
    if (!(this[\u03A8domFlags2] & 1)) {
      this.array.push(item);
      this[\u03A8appendChild3](item);
      return;
    }
    ;
    let toReplace = this.array[idx];
    if (toReplace === item) {
      true;
    } else {
      this.dirty = true;
      let prevIndex = this.array.indexOf(item);
      let changed = this.changes.get(item);
      if (prevIndex === -1) {
        this.array.splice(idx, 0, item);
        this.insertChild(item, idx, prevIndex);
      } else if (prevIndex === idx + 1) {
        if (toReplace) {
          this.changes.set(toReplace, -1);
        }
        ;
        this.array.splice(idx, 1);
      } else {
        if (prevIndex >= 0) {
          this.array.splice(prevIndex, 1);
        }
        ;
        this.array.splice(idx, 0, item);
        this.moveChild(item, idx, prevIndex);
      }
      ;
      if (changed == -1) {
        this.changes.delete(item);
      }
      ;
    }
    ;
    return;
  }
  insertChild(item, index, prevIndex) {
    let par = this.parentNode;
    if (!par) {
      return;
    }
    ;
    if (index > 0) {
      let other = this.array[index - 1];
      par[\u03A8insertChild3](item, other.nextSibling);
    } else {
      par[\u03A8insertChild3](item, this.childNodes[index + 1] || this[\u03A8end2]);
    }
    ;
    return;
  }
  moveChild(item, index, prevIndex) {
    return this.insertChild(item, index, prevIndex);
  }
  removeChild(item, index) {
    if (item.parentNode) {
      item[\u03A8removeFrom3](item.parentNode);
    }
    ;
    return;
  }
  [\u03A8insertChild3](node, relnode) {
    return;
  }
  [\u03A8replaceWith3](rel, parent) {
    let res = rel[\u03A8insertInto3](parent, this[\u03A8end2]);
    this[\u03A8removeFrom3](parent);
    return res;
  }
  [\u03A8insertInto3](parent, before) {
    this[\u03A8\u03A8parent3] = parent;
    let prev = this.parentNode;
    if (parent != prev) {
      this.parentNode = parent;
      for (let i = 0, items\u03C6 = iter$__4(this.array), len\u03C6 = items\u03C6.length; i < len\u03C6; i++) {
        let item = items\u03C6[i];
        item[\u03A8insertInto3](parent, before);
      }
      ;
      if (this[\u03A8end2]) {
        this[\u03A8end2][\u03A8insertInto3](parent, before);
      }
      ;
    }
    ;
    return this;
  }
  [\u03A8removeFrom3](parent) {
    for (let i\u03C6 = 0, items\u03C62 = iter$__4(this.array), len\u03C62 = items\u03C62.length; i\u03C6 < len\u03C62; i\u03C6++) {
      let item = items\u03C62[i\u03C6];
      parent[\u03A8removeChild3](item);
    }
    ;
    if (this[\u03A8end2]) {
      parent[\u03A8removeChild3](this[\u03A8end2]);
    }
    ;
    return this.parentNode = null;
  }
  [\u03A8afterVisit2](index) {
    var self = this;
    if (!(this[\u03A8domFlags2] & 1)) {
      this[\u03A8domFlags2] |= 1;
      return;
    }
    ;
    if (this.dirty) {
      self.changes.forEach(function(pos, item) {
        if (pos == -1) {
          return self.removeChild(item);
        }
        ;
      });
      self.changes.clear();
      self.dirty = false;
    }
    ;
    if (self.array.length > index) {
      while (self.array.length > index) {
        let item = self.array.pop();
        self.removeChild(item);
      }
      ;
    }
    ;
    return;
  }
};
KeyedTagFragment[\u03A8__init__4]();
function createKeyedList(bitflags, parent) {
  return new KeyedTagFragment(bitflags, parent);
}

// node_modules/imba/src/imba/dom/component.imba
function iter$__5(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__5 = Symbol.for("#__init__");
var \u03A8__initor__7 = Symbol.for("#__initor__");
var \u03A8__inited__7 = Symbol.for("#__inited__");
var \u03A8afterVisit3 = Symbol.for("#afterVisit");
var \u03A8beforeReconcile2 = Symbol.for("#beforeReconcile");
var \u03A8count = Symbol.for("#count");
var \u03A8autorender = Symbol.for("#autorender");
var \u03C64 = Symbol();
var hydrator = new class {
  constructor($$ = null) {
    this[\u03A8__init__5]($$);
  }
  [\u03A8__init__5]($$ = null) {
    var v\u03C6;
    this.items = $$ && (v\u03C6 = $$.items) !== void 0 ? v\u03C6 : [];
    this.current = $$ && (v\u03C6 = $$.current) !== void 0 ? v\u03C6 : null;
    this.lastQueued = $$ && (v\u03C6 = $$.lastQueued) !== void 0 ? v\u03C6 : null;
    this.tests = $$ && (v\u03C6 = $$.tests) !== void 0 ? v\u03C6 : 0;
  }
  flush() {
    let item = null;
    if (false) {
    }
    ;
    while (item = this.items.shift()) {
      if (!item.parentNode || item.hydrated\u03A6) {
        continue;
      }
      ;
      let prev = this.current;
      this.current = item;
      item.__F |= 1024;
      item.connectedCallback();
      this.current = prev;
    }
    ;
    return;
  }
  queue(item) {
    var self = this;
    let len = this.items.length;
    let idx = 0;
    let prev = this.lastQueued;
    this.lastQueued = item;
    let BEFORE = Node2.DOCUMENT_POSITION_PRECEDING;
    let AFTER = Node2.DOCUMENT_POSITION_FOLLOWING;
    if (len) {
      let prevIndex = this.items.indexOf(prev);
      let index = prevIndex;
      let compare = function(a, b) {
        self.tests++;
        return a.compareDocumentPosition(b);
      };
      if (prevIndex == -1 || prev.nodeName != item.nodeName) {
        index = prevIndex = 0;
      }
      ;
      let curr = self.items[index];
      while (curr && compare(curr, item) & AFTER) {
        curr = self.items[++index];
      }
      ;
      if (index != prevIndex) {
        curr ? self.items.splice(index, 0, item) : self.items.push(item);
      } else {
        while (curr && compare(curr, item) & BEFORE) {
          curr = self.items[--index];
        }
        ;
        if (index != prevIndex) {
          curr ? self.items.splice(index + 1, 0, item) : self.items.unshift(item);
        }
        ;
      }
      ;
    } else {
      self.items.push(item);
      if (!self.current) {
        globalThis.queueMicrotask(self.flush.bind(self));
      }
      ;
    }
    ;
    return;
  }
  run(item) {
    var \u03C632, \u03C622;
    if (this.active) {
      return;
    }
    ;
    this.active = true;
    let all = globalThis.document.querySelectorAll(".__ssr");
    console.log("running hydrator", item, all.length, Array.from(all));
    for (let i\u03C6 = 0, items\u03C6 = iter$__5(all), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let item2 = items\u03C6[i\u03C6];
      item2[\u03A8count] || (item2[\u03A8count] = 1);
      item2[\u03A8count]++;
      let name = item2.nodeName;
      let typ = (\u03C622 = this.map)[name] || (\u03C622[name] = globalThis.window.customElements.get(name.toLowerCase()) || HTMLElement);
      console.log("item type", name, typ, !!CUSTOM_TYPES[name.toLowerCase()]);
      if (!item2.connectedCallback || !item2.parentNode || item2.hydrated\u03A6) {
        continue;
      }
      ;
      console.log("hydrate", item2);
    }
    ;
    return this.active = false;
  }
}();
var Component = class extends HTMLElement {
  static [\u03A8__init__5]() {
    this.prototype[\u03A8__initor__7] = \u03C64;
    return this;
  }
  constructor() {
    super();
    if (this.flags$ns) {
      this.flag$ = this.flagExt$;
    }
    ;
    this.setup$();
    this.build();
    this[\u03A8__initor__7] === \u03C64 && this[\u03A8__inited__7] && this[\u03A8__inited__7]();
  }
  setup$() {
    this.__slots = {};
    return this.__F = 0;
  }
  [\u03A8__init__5]() {
    this.__F |= 1 | 2;
    return this;
  }
  flag$(str) {
    this.className = this.flags$ext = str;
    return;
  }
  slot$(name, ctx) {
    var \u03C642;
    if (name == "__" && !this.render) {
      return this;
    }
    ;
    return (\u03C642 = this.__slots)[name] || (\u03C642[name] = createSlot(0, this));
  }
  build() {
    return this;
  }
  awaken() {
    return this;
  }
  mount() {
    return this;
  }
  unmount() {
    return this;
  }
  rendered() {
    return this;
  }
  dehydrate() {
    return this;
  }
  hydrate() {
    this.autoschedule = true;
    return this;
  }
  tick() {
    return this.commit();
  }
  visit() {
    return this.commit();
  }
  commit() {
    if (!this.render\u03A6) {
      this.__F |= 8192;
      return this;
    }
    ;
    this.__F |= 256;
    this.render && this.render();
    this.rendered();
    return this.__F = (this.__F | 512) & ~256 & ~8192;
  }
  get autoschedule() {
    return (this.__F & 64) != 0;
  }
  set autoschedule(value) {
    value ? this.__F |= 64 : this.__F &= ~64;
  }
  set autorender(value) {
    let o = this[\u03A8autorender] || (this[\u03A8autorender] = {});
    o.value = value;
    if (this.mounted\u03A6) {
      scheduler.schedule(this, o);
    }
    ;
    return;
  }
  get render\u03A6() {
    return !this.suspended\u03A6;
  }
  get mounting\u03A6() {
    return (this.__F & 16) != 0;
  }
  get mounted\u03A6() {
    return (this.__F & 32) != 0;
  }
  get awakened\u03A6() {
    return (this.__F & 8) != 0;
  }
  get rendered\u03A6() {
    return (this.__F & 512) != 0;
  }
  get suspended\u03A6() {
    return (this.__F & 4096) != 0;
  }
  get rendering\u03A6() {
    return (this.__F & 256) != 0;
  }
  get scheduled\u03A6() {
    return (this.__F & 128) != 0;
  }
  get hydrated\u03A6() {
    return (this.__F & 2) != 0;
  }
  get ssr\u03A6() {
    return (this.__F & 1024) != 0;
  }
  schedule() {
    scheduler.on("commit", this);
    this.__F |= 128;
    return this;
  }
  unschedule() {
    scheduler.un("commit", this);
    this.__F &= ~128;
    return this;
  }
  async suspend(cb = null) {
    let val = this.flags.incr("_suspended_");
    this.__F |= 4096;
    if (cb instanceof Function) {
      await cb();
      this.unsuspend();
    }
    ;
    return this;
  }
  unsuspend() {
    let val = this.flags.decr("_suspended_");
    if (val == 0) {
      this.__F &= ~4096;
      this.commit();
      ;
    }
    ;
    return this;
  }
  [\u03A8afterVisit3]() {
    return this.visit();
  }
  [\u03A8beforeReconcile2]() {
    if (this.__F & 1024) {
      this.__F = this.__F & ~1024;
      this.classList.remove("_ssr_");
      if (this.flags$ext && this.flags$ext.indexOf("_ssr_") == 0) {
        this.flags$ext = this.flags$ext.slice(5);
      }
      ;
      if (!(this.__F & 512)) {
        this.innerHTML = "";
      }
      ;
    }
    ;
    return this;
  }
  connectedCallback() {
    let flags = this.__F;
    let inited = flags & 1;
    let awakened = flags & 8;
    if (!inited && !(flags & 1024)) {
      hydrator.queue(this);
      return;
    }
    ;
    if (flags & (16 | 32)) {
      return;
    }
    ;
    this.__F |= 16;
    if (!inited) {
      this[\u03A8__init__5]();
    }
    ;
    if (!(flags & 2)) {
      this.flags$ext = this.className;
      this.__F |= 2;
      this.hydrate();
      this.commit();
    }
    ;
    if (!awakened) {
      this.awaken();
      this.__F |= 8;
    }
    ;
    let res = this.mount();
    if (res && res.then instanceof Function) {
      res.then(scheduler.commit);
    }
    ;
    flags = this.__F = (this.__F | 32) & ~16;
    if (flags & 64) {
      this.schedule();
    }
    ;
    if (this[\u03A8autorender]) {
      scheduler.schedule(this, this[\u03A8autorender]);
    }
    ;
    return this;
  }
  disconnectedCallback() {
    this.__F = this.__F & (~32 & ~16);
    if (this.__F & 128) {
      this.unschedule();
    }
    ;
    this.unmount();
    if (this[\u03A8autorender]) {
      return scheduler.unschedule(this, this[\u03A8autorender]);
    }
    ;
  }
};
Component[\u03A8__init__5]();

// node_modules/imba/src/imba/dom/context.imba
var renderContext = {
  context: null
};

// node_modules/imba/src/imba/dom/mount.imba
var \u03A8insertInto4 = Symbol.for("#insertInto");
var \u03A8removeFrom4 = Symbol.for("#removeFrom");
function mount(mountable, into) {
  let parent = into || globalThis.document.body;
  let element = mountable;
  if (mountable instanceof Function) {
    let ctx = {_: parent};
    let tick = function() {
      let prev = renderContext.context;
      renderContext.context = ctx;
      let res = mountable(ctx);
      if (renderContext.context == ctx) {
        renderContext.context = prev;
      }
      ;
      return res;
    };
    element = tick();
    scheduler.listen("commit", tick);
  } else {
    element.__F |= 64;
  }
  ;
  element[\u03A8insertInto4](parent);
  return element;
}
function unmount(el) {
  if (el && el[\u03A8removeFrom4]) {
    el[\u03A8removeFrom4](el.parentNode);
  }
  ;
  return el;
}
var instance3 = globalThis.imba || (globalThis.imba = {});
instance3.mount = mount;
instance3.unmount = unmount;

// node_modules/imba/src/imba/dom/bind.imba
function extend$__2(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__6(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8afterVisit4 = Symbol.for("#afterVisit");
function use_dom_bind() {
  return true;
}
var toBind = {
  INPUT: true,
  SELECT: true,
  TEXTAREA: true,
  BUTTON: true
};
var isGroup = function(obj) {
  return obj instanceof Array || obj && obj.has instanceof Function;
};
var bindHas = function(object, value) {
  if (object == value) {
    return true;
  } else if (object instanceof Array) {
    return object.indexOf(value) >= 0;
  } else if (object && object.has instanceof Function) {
    return object.has(value);
  } else if (object && object.contains instanceof Function) {
    return object.contains(value);
  } else {
    return false;
  }
  ;
};
var bindAdd = function(object, value) {
  if (object instanceof Array) {
    return object.push(value);
  } else if (object && object.add instanceof Function) {
    return object.add(value);
  }
  ;
};
var bindRemove = function(object, value) {
  if (object instanceof Array) {
    let idx = object.indexOf(value);
    if (idx >= 0) {
      return object.splice(idx, 1);
    }
    ;
  } else if (object && object.delete instanceof Function) {
    return object.delete(value);
  }
  ;
};
function createProxyProperty(target) {
  function getter() {
    return target[0] ? target[0][target[1]] : void 0;
  }
  ;
  function setter(v) {
    return target[0] ? target[0][target[1]] = v : null;
  }
  ;
  return {
    get: getter,
    set: setter
  };
}
var Extend$Element$af = class {
  getRichValue() {
    return this.value;
  }
  setRichValue(value) {
    return this.value = value;
  }
  bind$(key, value) {
    let o = value || [];
    if (key == "data" && !this.$$bound && toBind[this.nodeName]) {
      this.$$bound = true;
      if (this.change$) {
        this.addEventListener("change", this.change$ = this.change$.bind(this));
      }
      ;
      if (this.input$) {
        this.addEventListener("input", this.input$ = this.input$.bind(this), {capture: true});
      }
      ;
      if (this.click$) {
        this.addEventListener("click", this.click$ = this.click$.bind(this), {capture: true});
      }
      ;
    }
    ;
    Object.defineProperty(this, key, o instanceof Array ? createProxyProperty(o) : o);
    return o;
  }
};
extend$__2(Element.prototype, Extend$Element$af.prototype);
Object.defineProperty(Element.prototype, "richValue", {
  get: function() {
    return this.getRichValue();
  },
  set: function(v) {
    return this.setRichValue(v);
  }
});
var Extend$HTMLSelectElement$ag = class {
  change$(e) {
    let model = this.data;
    let prev = this.$$value;
    this.$$value = void 0;
    let values = this.getRichValue();
    if (this.multiple) {
      if (prev) {
        for (let i\u03C6 = 0, items\u03C6 = iter$__6(prev), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
          let value = items\u03C6[i\u03C6];
          if (values.indexOf(value) != -1) {
            continue;
          }
          ;
          bindRemove(model, value);
        }
        ;
      }
      ;
      for (let i\u03C62 = 0, items\u03C62 = iter$__6(values), len\u03C62 = items\u03C62.length; i\u03C62 < len\u03C62; i\u03C62++) {
        let value = items\u03C62[i\u03C62];
        if (!prev || prev.indexOf(value) == -1) {
          bindAdd(model, value);
        }
        ;
      }
      ;
    } else {
      this.data = values[0];
    }
    ;
    commit();
    return this;
  }
  getRichValue() {
    var res\u03C6;
    if (this.$$value) {
      return this.$$value;
    }
    ;
    res\u03C6 = [];
    for (let i\u03C63 = 0, items\u03C63 = iter$__6(this.selectedOptions), len\u03C63 = items\u03C63.length; i\u03C63 < len\u03C63; i\u03C63++) {
      let o = items\u03C63[i\u03C63];
      res\u03C6.push(o.richValue);
    }
    ;
    return this.$$value = res\u03C6;
  }
  syncValue() {
    let model = this.data;
    if (this.multiple) {
      let vals = [];
      for (let i = 0, items\u03C64 = iter$__6(this.options), len\u03C64 = items\u03C64.length; i < len\u03C64; i++) {
        let option = items\u03C64[i];
        let val = option.richValue;
        let sel = bindHas(model, val);
        option.selected = sel;
        if (sel) {
          vals.push(val);
        }
        ;
      }
      ;
      this.$$value = vals;
    } else {
      for (let i = 0, items\u03C65 = iter$__6(this.options), len\u03C65 = items\u03C65.length; i < len\u03C65; i++) {
        let option = items\u03C65[i];
        let val = option.richValue;
        if (val == model) {
          this.$$value = [val];
          this.selectedIndex = i;
          break;
        }
        ;
      }
      ;
    }
    ;
    return;
  }
  [\u03A8afterVisit4]() {
    return this.syncValue();
  }
};
extend$__2(HTMLSelectElement.prototype, Extend$HTMLSelectElement$ag.prototype);
var Extend$HTMLOptionElement$ah = class {
  setRichValue(value) {
    this.$$value = value;
    return this.value = value;
  }
  getRichValue() {
    if (this.$$value !== void 0) {
      return this.$$value;
    }
    ;
    return this.value;
  }
};
extend$__2(HTMLOptionElement.prototype, Extend$HTMLOptionElement$ah.prototype);
var Extend$HTMLTextAreaElement$ai = class {
  setRichValue(value) {
    this.$$value = value;
    return this.value = value;
  }
  getRichValue() {
    if (this.$$value !== void 0) {
      return this.$$value;
    }
    ;
    return this.value;
  }
  input$(e) {
    this.data = this.value;
    return commit();
  }
  [\u03A8afterVisit4]() {
    if (this.$$bound && this.value != this.data) {
      return this.value = this.data;
    }
    ;
  }
};
extend$__2(HTMLTextAreaElement.prototype, Extend$HTMLTextAreaElement$ai.prototype);
var Extend$HTMLInputElement$aj = class {
  input$(e) {
    let typ = this.type;
    if (typ == "checkbox" || typ == "radio") {
      return;
    }
    ;
    this.$$value = void 0;
    this.data = this.richValue;
    return commit();
  }
  change$(e) {
    let model = this.data;
    let val = this.richValue;
    if (this.type == "checkbox" || this.type == "radio") {
      let checked = this.checked;
      if (isGroup(model)) {
        checked ? bindAdd(model, val) : bindRemove(model, val);
      } else {
        this.data = checked ? val : false;
      }
      ;
    }
    ;
    return commit();
  }
  setRichValue(value) {
    if (this.$$value !== value) {
      this.$$value = value;
      if (this.value !== value) {
        this.value = value;
      }
      ;
    }
    ;
    return;
  }
  getRichValue() {
    if (this.$$value !== void 0) {
      return this.$$value;
    }
    ;
    let value = this.value;
    let typ = this.type;
    if (typ == "range" || typ == "number") {
      value = this.valueAsNumber;
      if (Number.isNaN(value)) {
        value = null;
      }
      ;
    } else if (typ == "checkbox") {
      if (value == void 0 || value === "on") {
        value = true;
      }
      ;
    }
    ;
    return value;
  }
  [\u03A8afterVisit4]() {
    if (this.$$bound) {
      let typ = this.type;
      if (typ == "checkbox" || typ == "radio") {
        let val = this.data;
        if (val === true || val === false || val == null) {
          this.checked = !!val;
        } else {
          this.checked = bindHas(val, this.richValue);
        }
        ;
      } else {
        this.richValue = this.data;
      }
      ;
    }
    ;
    return;
  }
};
extend$__2(HTMLInputElement.prototype, Extend$HTMLInputElement$aj.prototype);
var Extend$HTMLButtonElement$ak = class {
  get checked() {
    return this.$checked;
  }
  set checked(val) {
    if (val != this.$checked) {
      this.$checked = val;
      this.flags.toggle("checked", !!val);
    }
    ;
  }
  setRichValue(value) {
    this.$$value = value;
    return this.value = value;
  }
  getRichValue() {
    if (this.$$value !== void 0) {
      return this.$$value;
    }
    ;
    return this.value;
  }
  click$(e) {
    let data = this.data;
    let toggled = this.checked;
    let val = this.richValue;
    if (isGroup(data)) {
      toggled ? bindRemove(data, val) : bindAdd(data, val);
    } else if (this.$$value == void 0) {
      this.data = toggled ? false : true;
    } else {
      this.data = toggled ? null : val;
    }
    ;
    this[\u03A8afterVisit4]();
    return commit();
  }
  [\u03A8afterVisit4]() {
    if (this.$$bound) {
      let data = this.data;
      let val = this.$$value == void 0 ? true : this.$$value;
      if (isGroup(data)) {
        this.checked = bindHas(data, val);
      } else {
        this.checked = data == val;
      }
      ;
    }
    ;
    return;
  }
};
extend$__2(HTMLButtonElement.prototype, Extend$HTMLButtonElement$ak.prototype);

// node_modules/imba/src/imba/events/keyboard.imba
function extend$__3(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_keyboard() {
  return true;
}
var Extend$KeyboardEvent$af = class {
  \u03B1esc() {
    return this.keyCode == 27;
  }
  \u03B1tab() {
    return this.keyCode == 9;
  }
  \u03B1enter() {
    return this.keyCode == 13;
  }
  \u03B1space() {
    return this.keyCode == 32;
  }
  \u03B1up() {
    return this.keyCode == 38;
  }
  \u03B1down() {
    return this.keyCode == 40;
  }
  \u03B1left() {
    return this.keyCode == 37;
  }
  \u03B1right() {
    return this.keyCode == 39;
  }
  \u03B1del() {
    return this.keyCode == 8 || this.keyCode == 46;
  }
  \u03B1key(code) {
    if (typeof code == "string") {
      return this.key == code;
    } else if (typeof code == "number") {
      return this.keyCode == code;
    }
    ;
  }
};
extend$__3(KeyboardEvent.prototype, Extend$KeyboardEvent$af.prototype);

// node_modules/imba/src/imba/events/mouse.imba
function extend$__4(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_mouse() {
  return true;
}
var Extend$MouseEvent$af = class {
  \u03B1left() {
    return this.button == 0;
  }
  \u03B1middle() {
    return this.button == 1;
  }
  \u03B1right() {
    return this.button == 2;
  }
  \u03B1shift() {
    return !!this.shiftKey;
  }
  \u03B1alt() {
    return !!this.altKey;
  }
  \u03B1ctrl() {
    return !!this.ctrlKey;
  }
  \u03B1meta() {
    return !!this.metaKey;
  }
  \u03B1mod() {
    let nav = globalThis.navigator.platform;
    return /^(Mac|iPhone|iPad|iPod)/.test(nav || "") ? !!this.metaKey : !!this.ctrlKey;
  }
};
extend$__4(MouseEvent.prototype, Extend$MouseEvent$af.prototype);

// node_modules/imba/src/imba/events/core.imba
function extend$__5(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__7(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8extendType = Symbol.for("#extendType");
var \u03A8modifierState = Symbol.for("#modifierState");
var \u03A8sharedModifierState = Symbol.for("#sharedModifierState");
var \u03A8onceHandlerEnd = Symbol.for("#onceHandlerEnd");
var \u03A8__initor__8 = Symbol.for("#__initor__");
var \u03A8__inited__8 = Symbol.for("#__inited__");
var \u03A8extendDescriptors = Symbol.for("#extendDescriptors");
var \u03A8context2 = Symbol.for("#context");
var \u03A8self = Symbol.for("#self");
var \u03A8target = Symbol.for("#target");
var \u03A8stopPropagation = Symbol.for("#stopPropagation");
var \u03A8defaultPrevented = Symbol.for("#defaultPrevented");
use_events_keyboard();
use_events_mouse();
var Extend$CustomEvent$af = class {
  [\u03A8extendType](kls) {
    var \u03C622, desc, \u03C65;
    let ext = kls[\u03A8extendDescriptors] || (kls[\u03A8extendDescriptors] = (desc = Object.getOwnPropertyDescriptors(kls.prototype), \u03C65 = desc.constructor, delete desc.constructor, \u03C65, desc));
    return Object.defineProperties(this, ext);
  }
};
extend$__5(CustomEvent.prototype, Extend$CustomEvent$af.prototype);
var Extend$Event$ag = class {
  get [\u03A8modifierState]() {
    var \u03C642, \u03C632;
    return (\u03C642 = this[\u03A8context2])[\u03C632 = this[\u03A8context2].step] || (\u03C642[\u03C632] = {});
  }
  get [\u03A8sharedModifierState]() {
    var \u03C66, \u03C65;
    return (\u03C66 = this[\u03A8context2].handler)[\u03C65 = this[\u03A8context2].step] || (\u03C66[\u03C65] = {});
  }
  [\u03A8onceHandlerEnd](cb) {
    return once(this[\u03A8context2], "end", cb);
  }
  \u03B1sel(selector) {
    return !!this.target.matches(String(selector));
  }
  \u03B1log(...params) {
    console.info(...params);
    return true;
  }
  \u03B1trusted() {
    return !!this.isTrusted;
  }
  \u03B1if(expr) {
    return !!expr;
  }
  \u03B1wait(time = 250) {
    return new Promise(function(_0) {
      return setTimeout(_0, parseTime(time));
    });
  }
  \u03B1self() {
    return this.target == this[\u03A8context2].element;
  }
  \u03B1cooldown(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      return false;
    }
    ;
    o.active = true;
    o.target = this[\u03A8context2].element;
    o.target.flags.incr("cooldown");
    this[\u03A8onceHandlerEnd](function() {
      return setTimeout(function() {
        o.target.flags.decr("cooldown");
        return o.active = false;
      }, parseTime(time));
    });
    return true;
  }
  \u03B1throttle(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      if (o.next) {
        o.next(false);
      }
      ;
      return new Promise(function(r) {
        return o.next = function(val) {
          o.next = null;
          return r(val);
        };
      });
    }
    ;
    o.active = true;
    o.el || (o.el = this[\u03A8context2].element);
    o.el.flags.incr("throttled");
    once(this[\u03A8context2], "end", function() {
      let delay = parseTime(time);
      return o.interval = setInterval(function() {
        if (o.next) {
          o.next(true);
        } else {
          clearInterval(o.interval);
          o.el.flags.decr("throttled");
          o.active = false;
        }
        ;
        return;
      }, delay);
    });
    return true;
  }
  \u03B1debounce(time = 250) {
    let o = this[\u03A8sharedModifierState];
    let e = this;
    o.queue || (o.queue = []);
    o.queue.push(o.last = e);
    return new Promise(function(resolve) {
      return setTimeout(function() {
        if (o.last == e) {
          e.debounced = o.queue;
          o.last = null;
          o.queue = [];
          return resolve(true);
        } else {
          return resolve(false);
        }
        ;
      }, parseTime(time));
    });
  }
  \u03B1flag(name, sel) {
    const {element, step, state, id, current} = this[\u03A8context2];
    let el = sel instanceof Element ? sel : sel ? element.closest(sel) : element;
    if (!el) {
      return true;
    }
    ;
    this[\u03A8context2].commit = true;
    state[step] = id;
    el.flags.incr(name);
    let ts = Date.now();
    once(current, "end", function() {
      let elapsed = Date.now() - ts;
      let delay = Math.max(250 - elapsed, 0);
      return setTimeout(function() {
        return el.flags.decr(name);
      }, delay);
    });
    return true;
  }
  \u03B1busy(sel) {
    return this["\u03B1flag"]("busy", sel);
  }
  \u03B1mod(name) {
    return this["\u03B1flag"]("mod-" + name, globalThis.document.documentElement);
  }
  \u03B1outside() {
    const {handler} = this[\u03A8context2];
    if (handler && handler[\u03A8self]) {
      return !handler[\u03A8self].parentNode.contains(this.target);
    }
    ;
  }
};
extend$__5(Event.prototype, Extend$Event$ag.prototype);
function use_events() {
  return true;
}
var EventHandler = class {
  constructor(params, closure) {
    this.params = params;
    this.closure = closure;
  }
  getHandlerForMethod(el, name) {
    if (!el) {
      return null;
    }
    ;
    return el[name] ? el : this.getHandlerForMethod(el.parentNode, name);
  }
  emit(name, ...params) {
    return emit(this, name, params);
  }
  on(name, ...params) {
    return listen(this, name, ...params);
  }
  once(name, ...params) {
    return once(this, name, ...params);
  }
  un(name, ...params) {
    return unlisten(this, name, ...params);
  }
  get passive\u03A6() {
    return this.params.passive;
  }
  get capture\u03A6() {
    return this.params.capture;
  }
  get silent\u03A6() {
    return this.params.silent;
  }
  get global\u03A6() {
    return this.params.global;
  }
  async handleEvent(event) {
    let element = this[\u03A8target] || event.currentTarget;
    let mods = this.params;
    let error = null;
    let silence = mods.silence || mods.silent;
    this.count || (this.count = 0);
    this.state || (this.state = {});
    let state = {
      element,
      event,
      modifiers: mods,
      handler: this,
      id: ++this.count,
      step: -1,
      state: this.state,
      commit: null,
      current: null
    };
    state.current = state;
    if (event.handle$mod) {
      if (event.handle$mod.apply(state, mods.options || []) == false) {
        return;
      }
      ;
    }
    ;
    let guard = Event[this.type + "$handle"] || Event[event.type + "$handle"] || event.handle$mod;
    if (guard && guard.apply(state, mods.options || []) == false) {
      return;
    }
    ;
    this.currentEvents || (this.currentEvents = new Set());
    this.currentEvents.add(event);
    for (let i\u03C6 = 0, keys\u03C6 = Object.keys(mods), l\u03C6 = keys\u03C6.length, handler, val; i\u03C6 < l\u03C6; i\u03C6++) {
      handler = keys\u03C6[i\u03C6];
      val = mods[handler];
      state.step++;
      if (handler[0] == "_") {
        continue;
      }
      ;
      if (handler.indexOf("~") > 0) {
        handler = handler.split("~")[0];
      }
      ;
      let modargs = null;
      let args = [event, state];
      let res = void 0;
      let context = null;
      let m;
      let negated = false;
      let isstring = typeof handler == "string";
      if (handler[0] == "$" && handler[1] == "_" && val[0] instanceof Function) {
        handler = val[0];
        if (!handler.passive) {
          state.commit = true;
        }
        ;
        args = [event, state].concat(val.slice(1));
        context = element;
      } else if (val instanceof Array) {
        args = val.slice();
        modargs = args;
        for (let i = 0, items\u03C6 = iter$__7(args), len\u03C62 = items\u03C6.length; i < len\u03C62; i++) {
          let par = items\u03C6[i];
          if (typeof par == "string" && par[0] == "~" && par[1] == "$") {
            let name = par.slice(2);
            let chain = name.split(".");
            let value = state[chain.shift()] || event;
            for (let i2 = 0, items\u03C62 = iter$__7(chain), len\u03C6 = items\u03C62.length; i2 < len\u03C6; i2++) {
              let part = items\u03C62[i2];
              value = value ? value[part] : void 0;
            }
            ;
            args[i] = value;
          }
          ;
        }
        ;
      }
      ;
      if (typeof handler == "string" && (m = handler.match(/^(emit|flag|mod|moved|pin|fit|refit|map|remap|css)-(.+)$/))) {
        if (!modargs) {
          modargs = args = [];
        }
        ;
        args.unshift(m[2]);
        handler = m[1];
      }
      ;
      if (handler == "trap") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "stop") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
      } else if (handler == "prevent") {
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "commit") {
        state.commit = true;
      } else if (handler == "once") {
        element.removeEventListener(event.type, this);
      } else if (handler == "options" || handler == "silence" || handler == "silent") {
        continue;
      } else if (handler == "emit") {
        let name = args[0];
        let detail = args[1];
        let e = new CustomEvent(name, {bubbles: true, detail});
        e.originalEvent = event;
        let customRes = element.dispatchEvent(e);
      } else if (typeof handler == "string") {
        if (handler[0] == "!") {
          negated = true;
          handler = handler.slice(1);
        }
        ;
        let path = "\u03B1" + handler;
        let fn = event[path];
        fn || (fn = this.type && Event[this.type + "$" + handler + "$mod"]);
        fn || (fn = event[handler + "$mod"] || Event[event.type + "$" + handler] || Event[handler + "$mod"]);
        if (fn instanceof Function) {
          handler = fn;
          context = state;
          args = modargs || [];
          if (event[path]) {
            context = event;
            event[\u03A8context2] = state;
          }
          ;
        } else if (handler[0] == "_") {
          handler = handler.slice(1);
          context = this.closure;
        } else {
          context = this.getHandlerForMethod(element, handler);
        }
        ;
      }
      ;
      try {
        if (handler instanceof Function) {
          res = handler.apply(context || element, args);
        } else if (context) {
          res = context[handler].apply(context, args);
        }
        ;
        if (res && res.then instanceof Function && res != scheduler.$promise) {
          if (state.commit && !silence) {
            scheduler.commit();
          }
          ;
          res = await res;
        }
        ;
      } catch (e) {
        error = e;
        break;
      }
      ;
      if (negated && res === true) {
        break;
      }
      ;
      if (!negated && res === false) {
        break;
      }
      ;
      state.value = res;
    }
    ;
    emit(state, "end", state);
    if (state.commit && !silence) {
      scheduler.commit();
    }
    ;
    this.currentEvents.delete(event);
    if (this.currentEvents.size == 0) {
      this.emit("idle");
    }
    ;
    if (error) {
      throw error;
    }
    ;
    return;
  }
};
var Extend$Element$ah2 = class {
  on$(type, mods, scope) {
    let check = "on$" + type;
    let handler;
    handler = new EventHandler(mods, scope);
    let capture = mods.capture || false;
    let passive = mods.passive;
    let o = capture;
    if (passive) {
      o = {passive, capture};
    }
    ;
    if (this[check] instanceof Function) {
      handler = this[check](mods, scope, handler, o);
    } else {
      this.addEventListener(type, handler, o);
    }
    ;
    return handler;
  }
};
extend$__5(Element.prototype, Extend$Element$ah2.prototype);

// node_modules/imba/src/imba/events/pointer.imba
function extend$__6(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
use_events_mouse();
function use_events_pointer() {
  return true;
}
var Extend$PointerEvent$af = class {
  \u03B1primary() {
    return !!this.isPrimary;
  }
  \u03B1mouse() {
    return this.pointerType == "mouse";
  }
  \u03B1pen() {
    return this.pointerType == "pen";
  }
  \u03B1touch() {
    return this.pointerType == "touch";
  }
  \u03B1pressure(threshold = 0.5) {
    return this.pressure >= threshold;
  }
  \u03B1lock() {
    return true;
  }
};
extend$__6(PointerEvent.prototype, Extend$PointerEvent$af.prototype);

// app/client.imba
var \u03A8__init__6 = Symbol.for("#__init__");
var \u03A8beforeReconcile3 = Symbol.for("#beforeReconcile");
var \u03A8\u03A8up3 = Symbol.for("##up");
var \u03A8placeChild3 = Symbol.for("#placeChild");
var \u03A8afterVisit5 = Symbol.for("#afterVisit");
var \u03A8afterReconcile2 = Symbol.for("#afterReconcile");
var \u03B5self = Symbol();
var \u03B5div = Symbol();
var \u03B5div2 = Symbol();
var \u03B5i = Symbol();
var \u03B5 = Symbol();
var \u03B5div3 = Symbol();
var \u03B5i2 = Symbol();
var \u03B5$ = Symbol();
var \u03B52 = Symbol();
var \u03B50\u03B9 = Symbol();
var \u03B5div4 = Symbol();
var \u03B53 = Symbol();
var bz\u03C6 = Symbol();
var ca\u03C6 = Symbol();
var \u03B5i3 = Symbol();
var \u03B5$2 = Symbol();
var \u03B54 = Symbol();
var cc\u03C6 = Symbol();
var \u03B5i4 = Symbol();
var \u03B55 = Symbol();
var \u03B5div5 = Symbol();
var \u03B5div6 = Symbol();
var ce\u03C6 = Symbol();
var \u03B5div7 = Symbol();
var \u03B5input = Symbol();
var cf\u03C6 = Symbol();
var \u03B5input2 = Symbol();
var cg\u03C6 = Symbol();
var \u03B5input3 = Symbol();
var ch\u03C6 = Symbol();
var ci\u03C6 = Symbol();
var \u03B5input4 = Symbol();
var cj\u03C6 = Symbol();
var ck\u03C6 = Symbol();
var \u03B5input5 = Symbol();
var cl\u03C6 = Symbol();
var \u03B5input6 = Symbol();
var cm\u03C6 = Symbol();
var \u03B5input7 = Symbol();
var cn\u03C6 = Symbol();
var \u03B50\u03B92 = Symbol();
var \u03B51\u03B9 = Symbol();
var \u03C4app;
var \u03F2\u03C4 = renderContext.context || {};
var \u03B5app = Symbol();
var \u03B9app;
var \u0394app;
use_events(), use_events_mouse(), use_events_pointer(), use_dom_bind();
var show_total_time = true;
var interval = 1 * 1e3;
var max_time = 5 * 1e3;
var min_time = 2 * 1e3;
var timer_count = 4;
var chance = 0.5;
var game_tick_interval = 10;
var score = 0;
var total_time = 0;
var timers = {};
function increment_interval(id) {
  return timers[id].current_time -= game_tick_interval;
}
var AppComponent = class extends Component {
  [\u03A8__init__6]($$ = null) {
    var v\u03C6;
    super[\u03A8__init__6](...arguments);
    this.autorender = $$ && (v\u03C6 = $$.autorender) !== void 0 ? v\u03C6 : interval;
    this.game_ticker = $$ && (v\u03C6 = $$.game_ticker) !== void 0 ? v\u03C6 : null;
  }
  get render\u03A6() {
    return true;
  }
  get game_has_started() {
    return this.game_ticker !== null;
  }
  sample(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  get_random_timer() {
    let null_timers = [];
    for (let i\u03C6 = 0, keys\u03C6 = Object.keys(timers), l\u03C6 = keys\u03C6.length, id, val; i\u03C6 < l\u03C6; i\u03C6++) {
      id = keys\u03C6[i\u03C6];
      val = timers[id];
      if (val === null) {
        null_timers.push(id);
      }
      ;
    }
    ;
    if (null_timers.length <= 0) {
      return false;
    }
    ;
    return this.sample(null_timers);
  }
  getRandomTime(min, max) {
    let delta = max - min;
    return Math.round(Math.random() * delta / interval) * interval + min;
  }
  game_tick() {
    let id;
    total_time += game_tick_interval;
    commit();
    if (total_time % interval !== 0) {
      return;
    }
    ;
    if (Math.random() < chance && (id = this.get_random_timer())) {
      let new_time = this.getRandomTime(min_time, max_time);
      timers[id] = {};
      timers[id].original_time = new_time;
      timers[id].current_time = new_time;
      return timers[id].interval = setInterval(increment_interval, game_tick_interval, id);
    }
    ;
  }
  handle_start() {
    timers = {};
    for (let len = timer_count - 1, timer = 0, rd = len - timer; rd > 0 ? timer <= len : timer >= len; rd > 0 ? timer++ : timer--) {
      timers[timer] = null;
    }
    ;
    return this.game_ticker = setInterval(this.game_tick.bind(this), game_tick_interval);
  }
  handle_stop() {
    var res\u03C6;
    total_time = 0;
    score = 0;
    clearInterval(this.game_ticker);
    this.game_ticker = null;
    res\u03C6 = [];
    for (let i\u03C62 = 0, keys\u03C62 = Object.keys(timers), l\u03C62 = keys\u03C62.length, id, val; i\u03C62 < l\u03C62; i\u03C62++) {
      id = keys\u03C62[i\u03C62];
      val = timers[id];
      res\u03C6.push(val !== null && (clearInterval(timers[id].interval), timers[id] = null));
    }
    ;
    return res\u03C6;
  }
  handle_timer_click(id) {
    let current_time = timers[id].current_time;
    if (current_time < 0) {
      score += 1;
    }
    ;
    clearInterval(timers[id].interval);
    return timers[id].click_time = current_time;
  }
  get_timers() {
    return timers;
  }
  render() {
    var self = this, \u03C40if2, \u03C40if, \u03C41if, \u03C4self, \u03B9self, \u0394self, \u03C65 = this._ns_ || "", \u03B9div, \u0394div, \u03C4div, \u03C5div, \u03C4div2, \u03B9div2, \u0394div2, \u03C5div2, \u03B9div3, \u0394div3, \u03C4, \u03BA, \u03C1, \u03C4div3, \u03BAdiv, \u03B9div4, \u0394div4, \u03C4div4, \u03BAdiv2, \u03B9div5, \u0394div5, \u03C5div3, \u03C4div5, \u03BAdiv3, \u03B9div6, \u0394div6, \u03B8div, \u03C5div4, \u03B9div7, \u0394div7, \u03C4div6, \u03B9div8, \u0394div8, \u03B8div2, \u03B9div9, \u0394div9, \u03C4div7, \u03C4div8, \u03C4input, \u03B9input, \u0394input, \u03C4hr, \u03C4div9, \u03C4div10, \u03C4input2, \u03B9input2, \u0394input2, \u03C4hr2, \u03C4div11, \u03C4div12, \u03C4input3, \u03B9input3, \u0394input3, \u03C4hr3, \u03C4div13, \u03C4div14, \u03C4input4, \u03B9input4, \u0394input4, \u03C4hr4, \u03C4div15, \u03C4div16, \u03C4input5, \u03B9input5, \u0394input5, \u03C4hr5, \u03C4div17, \u03C4div18, \u03C4input6, \u03B9input6, \u0394input6, \u03C4hr6, \u03C4div19, \u03C4div20, \u03C4input7, \u03B9input7, \u0394input7;
    \u03C4self = this;
    \u03C4self[\u03A8beforeReconcile3]();
    (\u03B9self = \u0394self = 1, \u03C4self[\u03B5self] === 1) || (\u03B9self = \u0394self = 0, \u03C4self[\u03B5self] = 1);
    \u03C40if = \u03C41if = null;
    if (this.game_has_started) {
      (\u03B9div = \u0394div = 1, \u03C40if = \u03C4self[\u03B5div]) || (\u03B9div = \u0394div = 0, \u03C4self[\u03B5div] = \u03C40if = createElement("div", null, `header ${\u03C65}`, null));
      \u03B9div || (\u03C40if[\u03A8\u03A8up3] = \u03C4self);
      (\u03C4div = \u03C40if[\u03B5div2]) || (\u03C40if[\u03B5div2] = \u03C4div = createElement("div", \u03C40if, `score ${\u03C65}`, null));
      \u03B9div || \u03C4div[\u03A8placeChild3]("SCORE: ");
      \u03C5div = score, \u03C5div === \u03C40if[\u03B5] && \u03B9div || (\u03C40if[\u03B5i] = \u03C4div[\u03A8placeChild3](\u03C40if[\u03B5] = \u03C5div, 256, \u03C40if[\u03B5i]));
      \u03B9div || (\u03C4div2 = createElement("div", \u03C40if, `start ${\u03C65}`, "STOP"));
      \u03B9div || \u03C4div2.on$(`click`, {$_: [function(e, $$) {
        return self.handle_stop(e);
      }]}, this);
      \u03C40if2 = null;
      if (show_total_time) {
        (\u03B9div2 = \u0394div2 = 1, \u03C40if2 = \u03C40if[\u03B5div3]) || (\u03B9div2 = \u0394div2 = 0, \u03C40if[\u03B5div3] = \u03C40if2 = createElement("div", null, `score ${\u03C65}`, null));
        \u03B9div2 || (\u03C40if2[\u03A8\u03A8up3] = \u03C40if);
        \u03B9div2 || \u03C40if2[\u03A8placeChild3]("TIME: ");
        renderContext.context = \u03C40if2[\u03B5$] || (\u03C40if2[\u03B5$] = {_: \u03C40if2}), \u03C5div2 = (total_time / 1e3).toFixed(2), renderContext.context = null, \u03C5div2 === \u03C40if2[\u03B52] && \u03B9div2 || (\u03C40if2[\u03B5i2] = \u03C40if2[\u03A8placeChild3](\u03C40if2[\u03B52] = \u03C5div2, 256, \u03C40if2[\u03B5i2]));
      }
      ;
      \u03C40if[\u03B50\u03B9] = \u03C40if[\u03A8placeChild3](\u03C40if2, 0, \u03C40if[\u03B50\u03B9]);
      (\u03B9div3 = \u0394div3 = 1, \u03C41if = \u03C4self[\u03B5div4]) || (\u03B9div3 = \u0394div3 = 0, \u03C4self[\u03B5div4] = \u03C41if = createElement("div", null, `timers ${\u03C65}`, null));
      \u03B9div3 || (\u03C41if[\u03A8\u03A8up3] = \u03C4self);
      (\u03C4 = \u03C41if[\u03B53]) || (\u03C41if[\u03B53] = \u03C4 = createKeyedList(1408, \u03C41if));
      \u03BA = 0;
      \u03C1 = \u03C4.$;
      for (let o\u03C6 = self.get_timers(), i\u03C63 = 0, keys\u03C63 = Object.keys(o\u03C6), l\u03C63 = keys\u03C63.length, id, obj; i\u03C63 < l\u03C63; i\u03C63++) {
        id = keys\u03C63[i\u03C63];
        obj = o\u03C6[id];
        if (obj === null) {
          \u03BAdiv = "am$" + \u03BA;
          (\u03B9div4 = \u0394div4 = 1, \u03C4div3 = \u03C1[\u03BAdiv]) || (\u03B9div4 = \u0394div4 = 0, \u03C1[\u03BAdiv] = \u03C4div3 = createElement("div", \u03C4, `timer ${\u03C65}`, null));
          \u03B9div4 || (\u03C4div3[\u03A8\u03A8up3] = \u03C4);
          \u03C4.push(\u03C4div3, \u03BA++, \u03BAdiv);
        } else if (obj.hasOwnProperty("click_time")) {
          \u03BAdiv2 = "an$" + \u03BA;
          (\u03B9div5 = \u0394div5 = 1, \u03C4div4 = \u03C1[\u03BAdiv2]) || (\u03B9div5 = \u0394div5 = 0, \u03C1[\u03BAdiv2] = \u03C4div4 = createElement("div", \u03C4, `dy-an timer ${\u03C65}`, null));
          \u03B9div5 || (\u03C4div4[\u03A8\u03A8up3] = \u03C4);
          \u03C5div3 = obj.click_time > 0 || void 0, \u03C5div3 === \u03C4div4[ca\u03C6] || (\u0394div5 |= 2, \u03C4div4[ca\u03C6] = \u03C5div3);
          \u0394div5 & 2 && \u03C4div4.flag$(`dy-an timer ${\u03C65} ` + (\u03C4div4[ca\u03C6] ? "dy_afao" : ""));
          renderContext.context = \u03C4div4[\u03B5$2] || (\u03C4div4[\u03B5$2] = {_: \u03C4div4}), \u03C5div3 = (obj.click_time / 1e3).toFixed(2), renderContext.context = null, \u03C5div3 === \u03C4div4[\u03B54] && \u03B9div5 || (\u03C4div4[\u03B5i3] = \u03C4div4[\u03A8placeChild3](\u03C4div4[\u03B54] = \u03C5div3, 384, \u03C4div4[\u03B5i3]));
          \u03C4.push(\u03C4div4, \u03BA++, \u03BAdiv2);
        } else {
          \u03BAdiv3 = "ap$" + \u03BA;
          (\u03B9div6 = \u0394div6 = 1, \u03C4div5 = \u03C1[\u03BAdiv3]) || (\u03B9div6 = \u0394div6 = 0, \u03C1[\u03BAdiv3] = \u03C4div5 = createElement("div", \u03C4, `timer ${\u03C65}`, null));
          \u03B9div6 || (\u03C4div5[\u03A8\u03A8up3] = \u03C4);
          \u03B8div = \u03C4div5[cc\u03C6] || (\u03C4div5[cc\u03C6] = {$_: [function(e, $$, _2, _3) {
            return _3.handle_timer_click(_2);
          }, null, null]});
          \u03B8div.$_[1] = id;
          \u03B8div.$_[2] = self;
          \u03B9div6 || \u03C4div5.on$(`pointerdown`, \u03B8div, this);
          \u03C5div4 = obj.original_time / 1e3, \u03C5div4 === \u03C4div5[\u03B55] && \u03B9div6 || (\u03C4div5[\u03B5i4] = \u03C4div5[\u03A8placeChild3](\u03C4div5[\u03B55] = \u03C5div4, 384, \u03C4div5[\u03B5i4]));
          \u03C4.push(\u03C4div5, \u03BA++, \u03BAdiv3);
        }
        ;
      }
      ;
      \u03C4[\u03A8afterVisit5](\u03BA);
    } else {
      (\u03B9div7 = \u0394div7 = 1, \u03C40if = \u03C4self[\u03B5div5]) || (\u03B9div7 = \u0394div7 = 0, \u03C4self[\u03B5div5] = \u03C40if = createElement("div", null, `header ${\u03C65}`, null));
      \u03B9div7 || (\u03C40if[\u03A8\u03A8up3] = \u03C4self);
      (\u03B9div8 = \u0394div8 = 1, \u03C4div6 = \u03C40if[\u03B5div6]) || (\u03B9div8 = \u0394div8 = 0, \u03C40if[\u03B5div6] = \u03C4div6 = createElement("div", \u03C40if, `start ${\u03C65}`, "START"));
      \u03B8div2 = \u03C40if[ce\u03C6] || (\u03C40if[ce\u03C6] = {$_: [function(e, $$, _2) {
        return _2.handle_start(e);
      }, null]});
      \u03B8div2.$_[1] = self;
      \u03B9div8 || \u03C4div6.on$(`click`, \u03B8div2, this);
      (\u03B9div9 = \u0394div9 = 1, \u03C41if = \u03C4self[\u03B5div7]) || (\u03B9div9 = \u0394div9 = 0, \u03C4self[\u03B5div7] = \u03C41if = createElement("div", null, `settings ${\u03C65}`, null));
      \u03B9div9 || (\u03C41if[\u03A8\u03A8up3] = \u03C4self);
      \u03B9div9 || (\u03C4div7 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div8 = createElement("div", \u03C4div7, `setting-name ${\u03C65}`, "Show Total Time:"));
      (\u03B9input = \u0394input = 1, \u03C4input = \u03C41if[\u03B5input]) || (\u03B9input = \u0394input = 0, \u03C41if[\u03B5input] = \u03C4input = createElement("input", \u03C4div7, `${\u03C65}`, null));
      \u03B9input || \u03C4input.bind$("data", {get: function() {
        return show_total_time;
      }, set: function(v$) {
        show_total_time = v$;
      }});
      \u03B9input || (\u03C4input.type = "checkbox");
      \u03B9input || !\u03C4input.setup || \u03C4input.setup(\u0394input);
      \u03C4input[\u03A8afterVisit5](\u0394input);
      \u03B9div9 || (\u03C4hr = createElement("hr", \u03C41if, `dy-aw ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div9 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div10 = createElement("div", \u03C4div9, `setting-name ${\u03C65}`, "Interval:"));
      (\u03B9input2 = \u0394input2 = 1, \u03C4input2 = \u03C41if[\u03B5input2]) || (\u03B9input2 = \u0394input2 = 0, \u03C41if[\u03B5input2] = \u03C4input2 = createElement("input", \u03C4div9, `${\u03C65}`, null));
      \u03B9input2 || \u03C4input2.bind$("data", {get: function() {
        return interval;
      }, set: function(v$) {
        interval = v$;
      }});
      \u03B9input2 || (\u03C4input2.type = "number");
      \u03B9input2 || (\u03C4input2.step = "0.01");
      \u03B9input2 || !\u03C4input2.setup || \u03C4input2.setup(\u0394input2);
      \u03C4input2[\u03A8afterVisit5](\u0394input2);
      \u03B9div9 || (\u03C4hr2 = createElement("hr", \u03C41if, `dy-ba ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div11 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div12 = createElement("div", \u03C4div11, `setting-name ${\u03C65}`, "Max Time:"));
      (\u03B9input3 = \u0394input3 = 1, \u03C4input3 = \u03C41if[\u03B5input3]) || (\u03B9input3 = \u0394input3 = 0, \u03C41if[\u03B5input3] = \u03C4input3 = createElement("input", \u03C4div11, `${\u03C65}`, null));
      \u03B9input3 || \u03C4input3.bind$("data", {get: function() {
        return max_time;
      }, set: function(v$) {
        max_time = v$;
      }});
      \u03B9input3 || (\u03C4input3.type = "number");
      interval === \u03C41if[ci\u03C6] || (\u03C4input3.step = \u03C41if[ci\u03C6] = interval);
      \u03B9input3 || !\u03C4input3.setup || \u03C4input3.setup(\u0394input3);
      \u03C4input3[\u03A8afterVisit5](\u0394input3);
      \u03B9div9 || (\u03C4hr3 = createElement("hr", \u03C41if, `dy-be ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div13 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div14 = createElement("div", \u03C4div13, `setting-name ${\u03C65}`, "Min Time:"));
      (\u03B9input4 = \u0394input4 = 1, \u03C4input4 = \u03C41if[\u03B5input4]) || (\u03B9input4 = \u0394input4 = 0, \u03C41if[\u03B5input4] = \u03C4input4 = createElement("input", \u03C4div13, `${\u03C65}`, null));
      \u03B9input4 || \u03C4input4.bind$("data", {get: function() {
        return min_time;
      }, set: function(v$) {
        min_time = v$;
      }});
      \u03B9input4 || (\u03C4input4.type = "number");
      interval === \u03C41if[ck\u03C6] || (\u03C4input4.step = \u03C41if[ck\u03C6] = interval);
      \u03B9input4 || !\u03C4input4.setup || \u03C4input4.setup(\u0394input4);
      \u03C4input4[\u03A8afterVisit5](\u0394input4);
      \u03B9div9 || (\u03C4hr4 = createElement("hr", \u03C41if, `dy-bi ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div15 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div16 = createElement("div", \u03C4div15, `setting-name ${\u03C65}`, "Timer Count:"));
      (\u03B9input5 = \u0394input5 = 1, \u03C4input5 = \u03C41if[\u03B5input5]) || (\u03B9input5 = \u0394input5 = 0, \u03C41if[\u03B5input5] = \u03C4input5 = createElement("input", \u03C4div15, `${\u03C65}`, null));
      \u03B9input5 || \u03C4input5.bind$("data", {get: function() {
        return timer_count;
      }, set: function(v$) {
        timer_count = v$;
      }});
      \u03B9input5 || (\u03C4input5.type = "number");
      \u03B9input5 || !\u03C4input5.setup || \u03C4input5.setup(\u0394input5);
      \u03C4input5[\u03A8afterVisit5](\u0394input5);
      \u03B9div9 || (\u03C4hr5 = createElement("hr", \u03C41if, `dy-bm ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div17 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div18 = createElement("div", \u03C4div17, `setting-name ${\u03C65}`, "Chance:"));
      (\u03B9input6 = \u0394input6 = 1, \u03C4input6 = \u03C41if[\u03B5input6]) || (\u03B9input6 = \u0394input6 = 0, \u03C41if[\u03B5input6] = \u03C4input6 = createElement("input", \u03C4div17, `${\u03C65}`, null));
      \u03B9input6 || \u03C4input6.bind$("data", {get: function() {
        return chance;
      }, set: function(v$) {
        chance = v$;
      }});
      \u03B9input6 || (\u03C4input6.type = "number");
      \u03B9input6 || (\u03C4input6.step = "0.01");
      \u03B9input6 || !\u03C4input6.setup || \u03C4input6.setup(\u0394input6);
      \u03C4input6[\u03A8afterVisit5](\u0394input6);
      \u03B9div9 || (\u03C4hr6 = createElement("hr", \u03C41if, `dy-bq ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div19 = createElement("div", \u03C41if, `setting ${\u03C65}`, null));
      \u03B9div9 || (\u03C4div20 = createElement("div", \u03C4div19, `setting-name ${\u03C65}`, "Game Tick Interval:"));
      (\u03B9input7 = \u0394input7 = 1, \u03C4input7 = \u03C41if[\u03B5input7]) || (\u03B9input7 = \u0394input7 = 0, \u03C41if[\u03B5input7] = \u03C4input7 = createElement("input", \u03C4div19, `${\u03C65}`, null));
      \u03B9input7 || \u03C4input7.bind$("data", {get: function() {
        return game_tick_interval;
      }, set: function(v$) {
        game_tick_interval = v$;
      }});
      \u03B9input7 || (\u03C4input7.type = "number");
      \u03B9input7 || (\u03C4input7.step = "1");
      \u03B9input7 || !\u03C4input7.setup || \u03C4input7.setup(\u0394input7);
      \u03C4input7[\u03A8afterVisit5](\u0394input7);
    }
    ;
    \u03C4self[\u03B50\u03B92] = \u03C4self[\u03A8placeChild3](\u03C40if, 0, \u03C4self[\u03B50\u03B92]);
    \u03C4self[\u03B51\u03B9] = \u03C4self[\u03A8placeChild3](\u03C41if, 0, \u03C4self[\u03B51\u03B9]);
    \u03C4self[\u03A8afterReconcile2](\u0394self);
    return \u03C4self;
  }
};
defineTag("app", AppComponent, {ns: "dy_af"});
mount(((\u03B9app = \u0394app = 1, \u03C4app = \u03F2\u03C4[\u03B5app]) || (\u03B9app = \u0394app = 0, \u03F2\u03C4[\u03B5app] = \u03C4app = createComponent("app", null, null, null)), \u03B9app || (\u03C4app[\u03A8\u03A8up3] = \u03F2\u03C4._), \u03B9app || !\u03C4app.setup || \u03C4app.setup(\u0394app), \u03C4app[\u03A8afterVisit5](\u0394app), \u03C4app));
//__FOOT__
