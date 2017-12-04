/*
    html5视频播放器
    作者：yxs
    项目地址：https://github.com/qq597392321/VideoPlayer
*/
(function (window) {
    'use strict'
    //常用功能
    var oftenFunc = {
        //判断指定对象的数据类型(指定对象，类型名称(可选，如果为空，则返回指定对象的类型字符串))
        isType: function (obj, name) {
            var toString = Object.prototype.toString.call(obj).toLowerCase();
            if (name === undefined) {
                return /^\[object (\w+)\]$/.exec(toString)[1];
            } else {
                return toString === '[object ' + name.toLowerCase() + ']';
            }
        },
        //indexOf增强版，可以指定多级属性(指定数组对象，指定需要匹配的值，链式调用路径)
        indexOf2: function (_this, value, tier) {
            var i, z;
            var tier = (tier && tier.split('.')) || [];
            var length = (tier && tier.length) || 0;
            var errorsign = [];
            var temporary = null;
            for (var i = 0; i < _this.length; i++) {
                temporary = _this[i];
                for (var z = 0; z < length; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary !== errorsign &&
                    temporary === value) {
                    return i;
                }
            }
            return -1;
        },
        //对象克隆(指定对象)
        clone: function (_this) {
            var obj = null;
            switch (oftenFunc.isType(_this)) {
                case 'array':
                    obj = [];
                    _this.forEach(function (item, i) {
                        obj[i] = oftenFunc.clone(item);
                    });
                    break;
                case 'object':
                    obj = {};
                    Object.keys(_this).forEach(function (name) {
                        obj[name] = oftenFunc.clone(_this[name]);
                    });
                    break;
                default: return _this;
            }
            return obj;
        },
        //数组去重(指定对象，链式调用路径(可选，如果不为空，则只判断该链式路径下的值))
        unique: function (_this, tier) {
            var i, z;
            var len1 = _this.length;
            var tier = (tier && tier.split('.')) || [];
            var len2 = (tier && tier.length) || 0;
            var newdata = [];
            var valuelist = [];
            var errorsign = [];
            var temporary = null;
            for (i = 0; i < len1; i++) {
                var temporary = _this[i];
                for (z = 0; z < len2; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary === errorsign) {
                    newdata.push(_this[i]);
                } else if (valuelist.indexOf(temporary) === -1) {
                    newdata.push(_this[i]);
                    valuelist.push(temporary);
                }
            }
            return newdata;
        },
        //对象继承(指定继承对象，指定继承自对象，当继承对象已存在属性，是否用新的值覆盖旧的值(可选，默认false))
        extend: function (target, obj, isrep) {
            Object.keys(obj).forEach(function (name) {
                if (target[name] !== undefined && !isrep) return;
                target[name] = obj[name];
            });
        },
        //绑定上下文(指定对象，指定上下文对象)
        bindContext: function (obj, context) {
            var type = oftenFunc.isType(obj);
            if (type === 'object' || type === 'function') {
                Object.keys(obj).forEach(function (name) {
                    switch (oftenFunc.isType(obj[name])) {
                        case 'function':
                            obj[name] = obj[name].bind(context);
                            break;
                        case 'object':
                            oftenFunc.bindContext(obj[name], context);
                            break;
                    }
                });
            }
        },
    };
    /*
        事件推送
    */
    var EventPush = {
        //自定义数据key名
        keyName: '__CustomData' + Date.now() + '__',
        //注册
        register: function (obj) {
            var s = this;
            if (obj[s.keyName] === undefined) {
                obj[s.keyName] = {};
                obj['dispatchEvent'] = s.dispatchEvent.bind(obj);
                obj['addEvent'] = obj['on'] = s.addEvent.bind(obj);
                obj['removeEvent'] = obj['off'] = s.removeEvent.bind(obj);
                obj['emptyEvent'] = s.emptyEvent.bind(obj);
            }
        },
        //取消注册
        destroy: function (obj) {
            var names = ['on', 'off', 'dispatchEvent', 'addEvent', 'removeEvent', 'emptyEvent'];
            names.forEach(function (name) {
                delete obj[name];
            });
        },
        //派送事件
        dispatchEvent: function (type, data) {
            var s = this;
            type = type.toLowerCase();
            if (s[EventPush.keyName] !== undefined) {
                var list = s[EventPush.keyName][type];
                list && list.forEach(function (item) {
                    item.call(s, data);
                });
                var humpName = 'on' + type[0].toUpperCase() + type.substring(1);
                if (Object.prototype.toString.call(s[humpName]).toLowerCase() === '[object function]') {
                    s[humpName].call(s, data);
                }
            }
        },
        //添加事件
        addEvent: function (type, callback) {
            var s = this;
            type = type.toLowerCase();
            (s[EventPush.keyName][type] = s[EventPush.keyName][type] || []).push(callback);
        },
        //删除事件
        removeEvent: function (type, callback) {
            var s = this;
            type = type.toLowerCase();
            var list = s[EventPush.keyName][type];
            if (list) {
                var index = list.indexOf(callback);
                if (i > -1) {
                    list.splice(i, 1);
                }
            }
        },
        //清空事件
        emptyEvent: function () {
            var s = this;
            s[EventPush.keyName] = {};
        }
    };
    //dom常用功能封装
    var oftenDomFunc = {
        //自定义数据key名
        keyName: '__CustomData' + Date.now() + '__',
        //继承
        extend: function (element) {
            Object.keys(oftenDomFunc).forEach(function (name) {
                if (oftenFunc.isType(oftenDomFunc[name], 'function')) {
                    element[name] = oftenDomFunc[name].bind(element);
                }
            });
            element[oftenDomFunc.keyName] = {
                //队列数据
                'queue': {
                    //默认队列
                    'def': {
                        //队列数据列表
                        list: [],
                        //计时器id
                        timerid: null
                    }
                }
            };
        },
        //取消继承
        destroy: function (element) {
            Object.keys(oftenDomFunc).forEach(function (name) {
                if (oftenFunc.isType(oftenDomFunc[name], 'function')) {
                    delete element[name];
                }
            });
            delete element[oftenDomFunc.keyName];
        },
        //设置指定样式值
        css: function (json) {
            var browsersCompatible = ['transform', 'transition', 'animation', 'clipPath'];
            for (var name in json) {
                var index = browsersCompatible.indexOf(name);
                if (index > -1) {
                    var n = name.replace(/^([a-z])/, name[0].toUpperCase());
                    this.style['webkit' + n] = json[name];
                }
                this.style[name] = json[name];
            }
            return this;
        },
        //删除自己
        remove: function () {
            this.parentNode.removeChild(this);
            return this;
        },
        //获取指定选择器的祖先元素列表
        parents: function (exp) {
            var s = this;
            var list = [];
            //获取祖先元素列表
            var node = s.parentNode;
            var path = [];
            while (node) {
                path.push(node);
                node = node.parentNode;
            }
            //筛选符合选择器的元素
            var explist = document.querySelectorAll(exp);
            var length = explist.length;
            for (var i = 0; i < length; i++) {
                if (path.indexOf(explist[i]) > -1) {
                    list.push(explist[i]);
                }
            }
            return list;
        },
        //判断是否具有指定样式类
        hasClass: function (name) {
            var c = this.className.split(' ');
            for (var i = c.length - 1; i >= 0; i--) {
                if (c[i].toLowerCase() == name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        },
        //添加样式类
        addClass: function (name) {
            var list1 = name.split(' ');
            var list2 = this.className.split(' ');
            list1.forEach(function (item, i) {
                var index = list2.indexOf(item);
                if (index === -1) {
                    list2.push(item);
                }
            });
            this.className = list2.join(' ');
            return this;
        },
        //删除样式类
        removeClass: function (name) {
            var list1 = name.split(' ');
            var list2 = this.className.split(' ');
            list1.forEach(function (item) {
                var index = list2.indexOf(item);
                if (index > -1) {
                    list2.splice(index, 1);
                }
            });
            this.className = list2.join(' ');
            return this;
        },
        //获取指定样式值，数值只会返回数字
        getComputedStyle: function (name, pseudoElt) {
            var res;
            var style = getComputedStyle(this, pseudoElt);
            if (res = /^([0-9.%]+)[^0-9.%]+$/.exec(style[name])) {
                return Number(res[1]);
            }
            return style[name];
        },
        //判断给定选择器元素是否在事件冒泡路径中
        isEventAgencyTarget: function (exp) {
            var s = this;
            var path = [];
            var target = event.target;
            //获取冒泡路径
            while (target) {
                path.push(target);
                target = target.parentNode;
            }
            var list = s.querySelectorAll(exp);
            var length = list.length;
            for (var i = 0; i < length; i++) {
                if (path.indexOf(list[i]) > -1) {
                    return list[i];
                }
            }
            return false;
        },
        //加入队列
        queue: function () {
            var s = this;
            var data = s[oftenDomFunc.keyName]['queue'];
            //修正参数
            var name = 'def', func, delay = 0;
            [].forEach.call(arguments, function (item) {
                switch (oftenFunc.isType(item)) {
                    case 'string': name = item; break;
                    case 'function': func = item; break;
                    case 'number': delay = item; break;
                }
            });
            if (func) {
                if (!data[name]) {
                    data[name] = { list: [], timerid: null };
                }
                data[name].list.push({ func: func, delay: delay });
                //是否有延时队列正在执行
                if (data[name].timerid === null) {
                    s.dequeue(name);
                }
            }
            return s;
        },
        //是否有延时队列正在执行
        isqueue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[oftenDomFunc.keyName]['queue'];
            return !!data[name].timerid;
        },
        //从队列最前端移除并执行一个队列函数。
        dequeue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[oftenDomFunc.keyName]['queue'];
            var first = data[name].list.shift();
            if (first) {
                data[name].timerid = setTimeout(function () {
                    first.func.call(s);
                    data[name].timerid = null;
                    return s.dequeue(name);
                }, first.delay);
            }
            return s;
        },
        //清空队列
        clearQueue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[oftenDomFunc.keyName]['queue'];
            data[name].list = [];
            clearTimeout(data[name].timerid);
            return s;
        }
    };
    /*
        视频播放器
    */
    function VideoPlayer(option) {
        var s = this;
        //注册监听器
        EventPush.register(s);
        //元素缓存
        s.elementCache = {};
        //当前选项数据
        s.currentOption = {};
        //动画对象缓存
        s.animationCache = {};
        //当前的播放状态(play(正在播放) pause(暂停) end(播放结束) buffer(正在缓冲中))
        s.playState = '';

        /*
            初始化操作
        */
        s.interaction = oftenFunc.clone(s.interaction);
        //绑定上下文
        oftenFunc.bindContext(s.interaction, s);
        //创建dom
        s.interaction.createdom.call(s);
        //绑定事件
        s.interaction.bindingEvent.call(s);
        //更新
        s.update(option);
    };
    //缓存原型
    var pt = VideoPlayer.prototype;
    //默认选项
    pt.defaultOption = {
        //显示容器
        container: '',
        //封面图
        cover: '',
        //源数据
        source: {},
        //选中的清晰度
        selected_definition: ''
    };
    //更新
    pt.update = function (option) {
        var s = this;
        var html = '';
        //应用选项
        Object.keys(s.defaultOption).forEach(function (name) {
            if (name in option) {
                s.currentOption[name] = option[name];
            } else {
                s.currentOption[name] = s.defaultOption[name];
            }
        });
        //更新封面图
        s.elementCache.vp_cover.style.backgroundImage = 'url(' + s.currentOption.cover + ')';
        //更新清晰度选择列表
        var source = Object.keys(s.currentOption.source);
        if (source) {
            source.forEach(function (item) {
                html += '<div class="vp_item" data-code="' + item + '">' + item + '</div>';
            });
            s.elementCache.vp_definition_option.innerHTML = html;
            s.elementCache.vp_control_definition.removeClass('vp_hide');
        } else {
            s.elementCache.vp_control_definition.addClass('vp_hide');
        }
        //居中显示
        var ph = s.elementCache.vp_definition_wrap.clientHeight;
        var ch = s.elementCache.vp_definition_option.clientHeight;
        if (ch < ph) {
            s.elementCache.vp_definition_option.css({
                'marginTop': (ph / 2 - ch / 2) + 'px'
            });
        }
        //更新清晰度视图
        s.interaction.definitionControl.update();
    };
    //播放
    pt.play = function () {
        var s = this;

    };
    //暂停
    pt.pause = function () {
        var s = this;

    };
    //交互
    pt.interaction = {
        //创建dom
        createdom: function (id) {
            var s = this;
            //填充html

            //缓存元素
            s.elementCache.container = document.querySelector('.VideoPlayer');
            s.elementCache.vp_video = s.elementCache.container.querySelector('.vp_video');
            s.elementCache.vp_cover = s.elementCache.container.querySelector('.vp_cover');
            s.elementCache.vp_loading_wrap = s.elementCache.container.querySelector('.vp_loading');
            s.elementCache.vp_control_priming = s.elementCache.container.querySelector('.vp_control_priming');
            s.elementCache.vp_retreat_btn = s.elementCache.container.querySelector('.vp_retreat_btn');
            s.elementCache.vp_title_roll = s.elementCache.container.querySelector('.vp_title_roll');
            s.elementCache.vp_control_play_btn = s.elementCache.container.querySelector('.vp_control_play_btn');
            s.elementCache.vp_time_current = s.elementCache.container.querySelector('.vp_time_current');
            s.elementCache.vp_time_duration = s.elementCache.container.querySelector('.vp_time_duration');
            s.elementCache.vp_progress_wrap = s.elementCache.container.querySelector('.vp_progress_wrap');
            s.elementCache.vp_progress_load = s.elementCache.vp_progress_wrap.querySelector('.vp_progress_load');
            s.elementCache.vp_progress_play = s.elementCache.vp_progress_wrap.querySelector('.vp_progress_play');
            s.elementCache.vp_progress_btn = s.elementCache.vp_progress_wrap.querySelector('.vp_progress_btn');
            s.elementCache.vp_bullet_screen_btn = s.elementCache.container.querySelector('.vp_bullet_screen_btn');
            s.elementCache.vp_switch_box = s.elementCache.vp_bullet_screen_btn.querySelector('.vp_switch_box');
            s.elementCache.vp_control_definition = s.elementCache.container.querySelector('.vp_control_definition');
            s.elementCache.vp_control_fullscreen_btn = s.elementCache.container.querySelector('.vp_control_fullscreen_btn');
            s.elementCache.vp_definition_wrap = s.elementCache.container.querySelector('.vp_definition_wrap');
            s.elementCache.vp_definition_option = s.elementCache.vp_definition_wrap.querySelector('.vp_definition_option');
            s.elementCache.vp_control_load_wrap = s.elementCache.container.querySelector('.vp_control_load_wrap');
            //继承常用功能
            oftenDomFunc.extend(s.elementCache.container);
            oftenDomFunc.extend(s.elementCache.vp_video);
            oftenDomFunc.extend(s.elementCache.vp_cover);
            oftenDomFunc.extend(s.elementCache.vp_control_priming);
            oftenDomFunc.extend(s.elementCache.vp_loading_wrap);
            oftenDomFunc.extend(s.elementCache.vp_retreat_btn);
            oftenDomFunc.extend(s.elementCache.vp_title_roll);
            oftenDomFunc.extend(s.elementCache.vp_control_play_btn);
            oftenDomFunc.extend(s.elementCache.vp_time_current);
            oftenDomFunc.extend(s.elementCache.vp_time_duration);
            oftenDomFunc.extend(s.elementCache.vp_progress_wrap);
            oftenDomFunc.extend(s.elementCache.vp_progress_load);
            oftenDomFunc.extend(s.elementCache.vp_progress_play);
            oftenDomFunc.extend(s.elementCache.vp_progress_btn);
            oftenDomFunc.extend(s.elementCache.vp_bullet_screen_btn);
            oftenDomFunc.extend(s.elementCache.vp_switch_box);
            oftenDomFunc.extend(s.elementCache.vp_control_definition);
            oftenDomFunc.extend(s.elementCache.vp_control_fullscreen_btn);
            oftenDomFunc.extend(s.elementCache.vp_definition_option);
            oftenDomFunc.extend(s.elementCache.vp_control_load_wrap);
        },
        //事件绑定
        bindingEvent: function () {
            var s = this;
            //显示/隐藏控件层
            s.elementCache.vp_control_priming.addEventListener('click', s.interaction.autoControl);
            //播放进度条事件
            if ('ontouchend' in document) {
                s.elementCache.vp_progress_wrap.addEventListener('touchstart', s.interaction.progressControl.down);
                s.elementCache.vp_progress_wrap.addEventListener('touchmove', s.interaction.progressControl.move);
                s.elementCache.vp_progress_wrap.addEventListener('touchend', s.interaction.progressControl.lift);
            } else {
                s.elementCache.vp_progress_wrap.addEventListener('mousedown', s.interaction.progressControl.down);
                window.addEventListener('mousemove', s.interaction.progressControl.move);
                window.addEventListener('mouseup', s.interaction.progressControl.lift);
            }
            //当浏览器可在不因缓冲而停顿的情况下进行播放时
            s.elementCache.vp_video.addEventListener('canplaythrough', function () {

            });
            //当音频/视频的时长更改时
            s.elementCache.vp_video.addEventListener('durationchange', function () {

            });
            //当音频/视频在已因缓冲而暂停或停止后已就绪时
            s.elementCache.vp_video.addEventListener('playing', function () {

            });
            //当在音频/视频加载期间发生错误时
            s.elementCache.vp_video.addEventListener('error', function () {

            });
            //当音频/视频的播放速度已更改时
            s.elementCache.vp_video.addEventListener('ratechange', function () {

            });
            //当浏览器正在下载音频/视频时
            s.elementCache.vp_video.addEventListener('progress', function () {

            });
            //清晰度按钮单击事件
            s.elementCache.vp_control_definition.addEventListener('click', s.interaction.definitionControl.show);
            //单击其它区域关闭清晰度选择弹出层
            s.elementCache.vp_definition_wrap.addEventListener('click', s.interaction.definitionControl.close);
            //清晰度选择事件
            s.elementCache.vp_definition_option.addEventListener('click', s.interaction.definitionControl.select);
        },
        //自动判断是否显示控件层
        autoControl: function () {
            var s = this;
            switch (s.elementCache.container.getAttribute('data-control')) {
                case 'true':
                    s.elementCache.container.setAttribute('data-control', 'false');
                    break;
                case 'false':
                    s.elementCache.container.setAttribute('data-control', 'true');
                    break;
            }
        },
        //显示控件层
        showControl: function () {
            var s = this;
            s.elementCache.container.setAttribute('data-control', 'true');
        },
        //隐藏控件层
        hideControl: function () {
            var s = this;
            s.elementCache.container.setAttribute('data-control', 'false');
        },
        //视频控制
        videoControl: {
            //可以播放
            canplaythrough: function () {

            },
            //
            durationchange: function () {

            },
        },
        //进度条控制
        progressControl: {
            //标记事件是否在进度条区域触发
            sign: false,
            //手指按下时的处理
            down: function (e) {
                var s = this;
                if (oftenFunc.isType(e, 'TouchEvent')) {
                    e.clientX = e.changedTouches[0].clientX;
                }
                var left = e.clientX - s.elementCache.vp_progress_wrap.getBoundingClientRect().left;
                s.interaction.progressControl.sign = true;
                s.interaction.progressControl.useChange.call(s, left);
                e.preventDefault();
            },
            //手指移动时的处理
            move: function (e) {
                var s = this;
                if (s.interaction.progressControl.sign) {
                    if (oftenFunc.isType(e, 'TouchEvent')) {
                        e.clientX = e.changedTouches[0].clientX;
                    }
                    var left = e.clientX - s.elementCache.vp_progress_wrap.getBoundingClientRect().left;
                    s.interaction.progressControl.useChange.call(s, left);
                }
                e.preventDefault();
            },
            //手指提起时的处理
            lift: function (e) {
                var s = this;
                if (s.interaction.progressControl.sign) {
                    s.interaction.progressControl.sign = false;
                }
                e.preventDefault();
            },
            //应用改变到dom
            useChange: function (left) {
                var s = this;
                left = Math.max(Math.min(left, s.elementCache.vp_progress_wrap.clientWidth), 0);
                s.elementCache.vp_progress_play.css({
                    width: left + 'px'
                });
                s.elementCache.vp_progress_btn.css({
                    transform: 'translateX(' + left + 'px)'
                });
            }
        },
        //清晰度控制
        definitionControl: {
            //更新视图
            update: function () {
                var s = this;
                var _this = s.elementCache.vp_definition_option.querySelector('.vp_item[data-code="' + s.currentOption.selected_definition + '"]');
                if (_this) {
                    var _selected = s.elementCache.vp_definition_option.querySelector('.selected');
                    _selected && oftenDomFunc.removeClass.call(_selected, 'selected');
                    oftenDomFunc.addClass.call(_this, 'selected');
                    s.elementCache.vp_control_definition.innerText = s.currentOption.selected_definition;
                }
            },
            //清晰度选择
            select: function (e) {
                var s = this;
                var _this = s.elementCache.vp_definition_option.isEventAgencyTarget('.vp_item');
                if (_this) {
                    s.currentOption.selected_definition = _this.getAttribute('data-code');
                    s.interaction.definitionControl.update();
                    s.interaction.definitionControl.close();
                }
                e.stopPropagation();
            },
            //显示弹出层
            show: function () {
                var s = this;
                if (!s.elementCache.vp_definition_option.isqueue()) {
                    s.interaction.hideControl();
                    s.elementCache.vp_definition_wrap.setAttribute('data-state', 'show');
                    //垂直居中显示选择项
                    var _this = s.elementCache.vp_definition_option.querySelector('.vp_item[data-code="' + s.currentOption.selected_definition + '"]');
                    if (_this) {
                        var offtop = _this.offsetTop - s.elementCache.vp_definition_option.clientHeight / 2 + _this.clientHeight / 2;
                        s.elementCache.vp_definition_option.scrollTop = offtop;
                    }
                }
            },
            //关闭弹出层
            close: function () {
                var s = this;
                s.interaction.showControl();
                s.elementCache.vp_definition_wrap.setAttribute('data-state', 'hide');
            },
        },
    };
    //开放入口
    window.VideoPlayer = VideoPlayer;
})(window);