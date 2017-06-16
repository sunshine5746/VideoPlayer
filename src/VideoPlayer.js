/*
    html5视频播放器
    作者：yxs
    项目地址：https://github.com/qq597392321/VideoPlayer
*/
(function () {
    /*
    兼容处理
*/
    //数据类型判断
    function isType(obj, name) {
        return Object.prototype.toString.call(obj).toLowerCase() == '[object ' + name.toLowerCase() + ']';
    };
    //判断是否具有指定样式类
    HTMLElement.prototype.hasClass = function (name) {
        var c = this.className.split(' ');
        for (var i = c.length - 1; i >= 0; i--) {
            if (c[i].toLowerCase() == name.toLowerCase()) {
                return true;
            }
        }
        return false;
    };
    //添加样式类
    HTMLElement.prototype.addClass = function (name) {
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
    };
    //删除样式类
    HTMLElement.prototype.removeClass = function (name) {
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
    };
    //删除自己
    HTMLElement.prototype.remove = function () {
        this.parentNode.removeChild(this);
        return this;
    };
    //获取指定样式值，数值只会返回数字
    HTMLElement.prototype.getComputedStyle = function (name, pseudoElt) {
        var res;
        var style = getComputedStyle(this, pseudoElt);
        if (res = /^([0-9.%]+)[^0-9.%]+$/.exec(style[name])) {
            return Number(res[1]);
        }
        return style[name];
    };
    //设置指定样式值
    var browsersCompatible = ['transform', 'transition', 'animation'];
    HTMLElement.prototype.css = function (json) {
        for (var name in json) {
            var index = browsersCompatible.indexOf(name);
            if (index > -1) {
                var n = name.replace(/^([a-z])/, name[0].toUpperCase());
                this.style['webkit' + n] = json[name];
            }
            this.style[name] = json[name];
        }
        return this;
    };
    //indexOf增强版，可以指定多级属性
    Array.prototype.indexOf2 = function (value, property) {
        var list = property && property.split('.');
        var length = (list && list.length) || 0;
        var index = -1;
        var temporary;
        for (var i = 0; i < this.length; i++) {
            var temporary = this[i];
            for (var z = 0; z < length; z++) {
                if (typeof temporary === 'object' || typeof temporary === 'function') {
                    if (list[z] !== '') {
                        temporary = temporary[list[z]];
                    }
                } else {
                    temporary = null;
                    break;
                }
            }
            if (temporary === value) {
                return i;
            }
        }
        return index;
    };
    /*
        监听器
    */
    var Listeners = function () {
        var s = this;
        //公用变量名
        s.publicName1 = '__ListenersisRegistered__';
        s.publicName2 = '__ListenersCallbackList__';
    };
    //注册监听器
    Listeners.prototype.register = function (obj) {
        var s = this;
        if (!obj[s.publicName1]) {
            obj[s.publicName1] = true;
            obj[s.publicName2] = obj[s.publicName2] || {};
            obj.dispatchEvent = s.dispatchEvent.bind(obj);
            obj.on = obj.addEventListener = s.addEventListener.bind(obj);
            obj.off = obj.removeEventListener = s.removeEventListener.bind(obj);
        }
    };
    //删除监听器
    Listeners.prototype.remove = function (obj) {
        var s = this;
        obj[s.publicName1] = false;
        obj[s.publicName2] = null;
        obj.dispatchEvent = null;
        obj.on = obj.addEventListener = null;
        obj.off = obj.removeEventListener = null;
    };
    //事件派送
    Listeners.prototype.dispatchEvent = function (type, data, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        if (s[Listeners.publicName2][phase]) {
            var list = s[Listeners.publicName2][phase][type];
            if (list) {
                list.forEach(function (item) {
                    item.call(s, data);
                });
            }
        }
        var typeName = type.toLowerCase().replace(/^([a-z])/g, type[0].toUpperCase());
        if (s['on' + typeName] && isType(s['on' + typeName], 'function')) {
            s['on' + typeName].call(s, data);
        }
    };
    //添加事件监听
    Listeners.prototype.addEventListener = function (type, callback, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        s[Listeners.publicName2][phase] = s[Listeners.publicName2][phase] || {};
        s[Listeners.publicName2][phase][type] = s[Listeners.publicName2][phase][type] || [];
        s[Listeners.publicName2][phase][type].push(callback);
    };
    //删除事件监听
    Listeners.prototype.removeEventListener = function (type, callback, phase) {
        var s = this;
        phase = phase || 1;
        type = type.toLowerCase();
        if (s[Listeners.publicName2][phase] && s[Listeners.publicName2][phase][type]) {
            var list = s[Listeners.publicName2][phase][type];
            if (typeof callback === 'string' && callback.toLowerCase() === 'all') {
                list.length = 0;
            } else {
                var i = list.indexOf(callback);
                if (i !== -1) { list.splice(i, 1); }
            }
        }
    };
    Listeners = new Listeners();
    /*
        视频播放器
    */
    //元素
    var _Element = {};
    //私有方法
    var _Private = {
        //初始化
        init: function () {
            _Element.container = document.querySelector('.VideoPlayer');
            _Element.vp_video = _Element.container.querySelector('.vp_video');
            _Element.vp_cover = _Element.container.querySelector('.vp_cover');
            _Element.vp_block = _Element.container.querySelector('.vp_block');
            _Element.vp_loading = _Element.container.querySelector('.vp_loading');
            _Element.vp_retreat_btn = _Element.container.querySelector('.vp_retreat_btn');
            _Element.vp_title_roll = _Element.container.querySelector('.vp_title_roll');
            _Element.vp_control_play_btn = _Element.container.querySelector('.vp_control_play_btn');
            _Element.vp_time_current = _Element.container.querySelector('.vp_time_current');
            _Element.vp_time_duration = _Element.container.querySelector('.vp_time_duration');
            _Element.vp_progress_load = _Element.container.querySelector('.vp_progress_load');
            _Element.vp_progress_play = _Element.container.querySelector('.vp_progress_play');
            _Element.vp_progress_btn = _Element.container.querySelector('.vp_progress_btn');
            _Element.vp_bullet_screen_btn = _Element.container.querySelector('.vp_bullet_screen_btn');
            _Element.vp_switch_box = _Element.vp_bullet_screen_btn.querySelector('.vp_switch_box');
            _Element.vp_control_definition = _Element.container.querySelector('.vp_control_definition');
            _Element.vp_control_fullscreen_btn = _Element.container.querySelector('.vp_control_fullscreen_btn');
            _Element.vp_definition_option = _Element.container.querySelector('.vp_definition_option');
            _Private.bindingEvent();
        },
        //事件绑定
        bindingEvent: function () {

        },
    };
    function VideoPlayer(option) {
        var s = this;

    };
    //初始化
    _Private.init();
    //实例化
    window.VideoPlayer = VideoPlayer;
})();