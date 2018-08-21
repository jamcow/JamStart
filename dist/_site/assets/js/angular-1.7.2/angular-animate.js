(function (window, angular) {
    'use strict';
    var ELEMENT_NODE = 1;
    var COMMENT_NODE = 8;
    var ADD_CLASS_SUFFIX = '-add';
    var REMOVE_CLASS_SUFFIX = '-remove';
    var EVENT_CLASS_PREFIX = 'ng-';
    var ACTIVE_CLASS_SUFFIX = '-active';
    var PREPARE_CLASS_SUFFIX = '-prepare';
    var NG_ANIMATE_CLASSNAME = 'ng-animate';
    var NG_ANIMATE_CHILDREN_DATA = '$$ngAnimateChildren';
    var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;
    if ((window.ontransitionend === undefined) && (window.onwebkittransitionend !== undefined)) {
        CSS_PREFIX = '-webkit-';
        TRANSITION_PROP = 'WebkitTransition';
        TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
    }
    else {
        TRANSITION_PROP = 'transition';
        TRANSITIONEND_EVENT = 'transitionend';
    }
    if ((window.onanimationend === undefined) && (window.onwebkitanimationend !== undefined)) {
        CSS_PREFIX = '-webkit-';
        ANIMATION_PROP = 'WebkitAnimation';
        ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
    }
    else {
        ANIMATION_PROP = 'animation';
        ANIMATIONEND_EVENT = 'animationend';
    }
    var DURATION_KEY = 'Duration';
    var PROPERTY_KEY = 'Property';
    var DELAY_KEY = 'Delay';
    var TIMING_KEY = 'TimingFunction';
    var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
    var ANIMATION_PLAYSTATE_KEY = 'PlayState';
    var SAFE_FAST_FORWARD_DURATION_VALUE = 9999;
    var ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
    var ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
    var TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
    var TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;
    var ngMinErr = angular.$$minErr('ng');
    function assertArg(arg, name, reason) {
        if (!arg) {
            throw ngMinErr('areq', 'Argument \'{0}\' is {1}', (name || '?'), (reason || 'required'));
        }
        return arg;
    }
    function mergeClasses(a, b) {
        if (!a && !b)
            return '';
        if (!a)
            return b;
        if (!b)
            return a;
        if (isArray(a))
            a = a.join(' ');
        if (isArray(b))
            b = b.join(' ');
        return a + ' ' + b;
    }
    function packageStyles(options) {
        var styles = {};
        if (options && (options.to || options.from)) {
            styles.to = options.to;
            styles.from = options.from;
        }
        return styles;
    }
    function pendClasses(classes, fix, isPrefix) {
        var className = '';
        classes = isArray(classes)
            ? classes
            : classes && isString(classes) && classes.length
                ? classes.split(/\s+/)
                : [];
        forEach(classes, function (klass, i) {
            if (klass && klass.length > 0) {
                className += (i > 0) ? ' ' : '';
                className += isPrefix ? fix + klass
                    : klass + fix;
            }
        });
        return className;
    }
    function removeFromArray(arr, val) {
        var index = arr.indexOf(val);
        if (val >= 0) {
            arr.splice(index, 1);
        }
    }
    function stripCommentsFromElement(element) {
        if (element instanceof jqLite) {
            switch (element.length) {
                case 0:
                    return element;
                case 1:
                    if (element[0].nodeType === ELEMENT_NODE) {
                        return element;
                    }
                    break;
                default:
                    return jqLite(extractElementNode(element));
            }
        }
        if (element.nodeType === ELEMENT_NODE) {
            return jqLite(element);
        }
    }
    function extractElementNode(element) {
        if (!element[0])
            return element;
        for (var i = 0; i < element.length; i++) {
            var elm = element[i];
            if (elm.nodeType === ELEMENT_NODE) {
                return elm;
            }
        }
    }
    function $$addClass($$jqLite, element, className) {
        forEach(element, function (elm) {
            $$jqLite.addClass(elm, className);
        });
    }
    function $$removeClass($$jqLite, element, className) {
        forEach(element, function (elm) {
            $$jqLite.removeClass(elm, className);
        });
    }
    function applyAnimationClassesFactory($$jqLite) {
        return function (element, options) {
            if (options.addClass) {
                $$addClass($$jqLite, element, options.addClass);
                options.addClass = null;
            }
            if (options.removeClass) {
                $$removeClass($$jqLite, element, options.removeClass);
                options.removeClass = null;
            }
        };
    }
    function prepareAnimationOptions(options) {
        options = options || {};
        if (!options.$$prepared) {
            var domOperation = options.domOperation || noop;
            options.domOperation = function () {
                options.$$domOperationFired = true;
                domOperation();
                domOperation = noop;
            };
            options.$$prepared = true;
        }
        return options;
    }
    function applyAnimationStyles(element, options) {
        applyAnimationFromStyles(element, options);
        applyAnimationToStyles(element, options);
    }
    function applyAnimationFromStyles(element, options) {
        if (options.from) {
            element.css(options.from);
            options.from = null;
        }
    }
    function applyAnimationToStyles(element, options) {
        if (options.to) {
            element.css(options.to);
            options.to = null;
        }
    }
    function mergeAnimationDetails(element, oldAnimation, newAnimation) {
        var target = oldAnimation.options || {};
        var newOptions = newAnimation.options || {};
        var toAdd = (target.addClass || '') + ' ' + (newOptions.addClass || '');
        var toRemove = (target.removeClass || '') + ' ' + (newOptions.removeClass || '');
        var classes = resolveElementClasses(element.attr('class'), toAdd, toRemove);
        if (newOptions.preparationClasses) {
            target.preparationClasses = concatWithSpace(newOptions.preparationClasses, target.preparationClasses);
            delete newOptions.preparationClasses;
        }
        var realDomOperation = target.domOperation !== noop ? target.domOperation : null;
        extend(target, newOptions);
        if (realDomOperation) {
            target.domOperation = realDomOperation;
        }
        if (classes.addClass) {
            target.addClass = classes.addClass;
        }
        else {
            target.addClass = null;
        }
        if (classes.removeClass) {
            target.removeClass = classes.removeClass;
        }
        else {
            target.removeClass = null;
        }
        oldAnimation.addClass = target.addClass;
        oldAnimation.removeClass = target.removeClass;
        return target;
    }
    function resolveElementClasses(existing, toAdd, toRemove) {
        var ADD_CLASS = 1;
        var REMOVE_CLASS = -1;
        var flags = {};
        existing = splitClassesToLookup(existing);
        toAdd = splitClassesToLookup(toAdd);
        forEach(toAdd, function (value, key) {
            flags[key] = ADD_CLASS;
        });
        toRemove = splitClassesToLookup(toRemove);
        forEach(toRemove, function (value, key) {
            flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
        });
        var classes = {
            addClass: '',
            removeClass: ''
        };
        forEach(flags, function (val, klass) {
            var prop, allow;
            if (val === ADD_CLASS) {
                prop = 'addClass';
                allow = !existing[klass] || existing[klass + REMOVE_CLASS_SUFFIX];
            }
            else if (val === REMOVE_CLASS) {
                prop = 'removeClass';
                allow = existing[klass] || existing[klass + ADD_CLASS_SUFFIX];
            }
            if (allow) {
                if (classes[prop].length) {
                    classes[prop] += ' ';
                }
                classes[prop] += klass;
            }
        });
        function splitClassesToLookup(classes) {
            if (isString(classes)) {
                classes = classes.split(' ');
            }
            var obj = {};
            forEach(classes, function (klass) {
                if (klass.length) {
                    obj[klass] = true;
                }
            });
            return obj;
        }
        return classes;
    }
    function getDomNode(element) {
        return (element instanceof jqLite) ? element[0] : element;
    }
    function applyGeneratedPreparationClasses(element, event, options) {
        var classes = '';
        if (event) {
            classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
        }
        if (options.addClass) {
            classes = concatWithSpace(classes, pendClasses(options.addClass, ADD_CLASS_SUFFIX));
        }
        if (options.removeClass) {
            classes = concatWithSpace(classes, pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX));
        }
        if (classes.length) {
            options.preparationClasses = classes;
            element.addClass(classes);
        }
    }
    function clearGeneratedClasses(element, options) {
        if (options.preparationClasses) {
            element.removeClass(options.preparationClasses);
            options.preparationClasses = null;
        }
        if (options.activeClasses) {
            element.removeClass(options.activeClasses);
            options.activeClasses = null;
        }
    }
    function blockTransitions(node, duration) {
        var value = duration ? '-' + duration + 's' : '';
        applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
        return [TRANSITION_DELAY_PROP, value];
    }
    function blockKeyframeAnimations(node, applyBlock) {
        var value = applyBlock ? 'paused' : '';
        var key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
        applyInlineStyle(node, [key, value]);
        return [key, value];
    }
    function applyInlineStyle(node, styleTuple) {
        var prop = styleTuple[0];
        var value = styleTuple[1];
        node.style[prop] = value;
    }
    function concatWithSpace(a, b) {
        if (!a)
            return b;
        if (!b)
            return a;
        return a + ' ' + b;
    }
    var $$rAFSchedulerFactory = ['$$rAF', function ($$rAF) {
            var queue, cancelFn;
            function scheduler(tasks) {
                queue = queue.concat(tasks);
                nextTick();
            }
            queue = scheduler.queue = [];
            scheduler.waitUntilQuiet = function (fn) {
                if (cancelFn)
                    cancelFn();
                cancelFn = $$rAF(function () {
                    cancelFn = null;
                    fn();
                    nextTick();
                });
            };
            return scheduler;
            function nextTick() {
                if (!queue.length)
                    return;
                var items = queue.shift();
                for (var i = 0; i < items.length; i++) {
                    items[i]();
                }
                if (!cancelFn) {
                    $$rAF(function () {
                        if (!cancelFn)
                            nextTick();
                    });
                }
            }
        }];
    var $$AnimateChildrenDirective = ['$interpolate', function ($interpolate) {
            return {
                link: function (scope, element, attrs) {
                    var val = attrs.ngAnimateChildren;
                    if (isString(val) && val.length === 0) {
                        element.data(NG_ANIMATE_CHILDREN_DATA, true);
                    }
                    else {
                        setData($interpolate(val)(scope));
                        attrs.$observe('ngAnimateChildren', setData);
                    }
                    function setData(value) {
                        value = value === 'on' || value === 'true';
                        element.data(NG_ANIMATE_CHILDREN_DATA, value);
                    }
                }
            };
        }];
    var ANIMATE_TIMER_KEY = '$$animateCss';
    var ONE_SECOND = 1000;
    var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
    var CLOSING_TIME_BUFFER = 1.5;
    var DETECT_CSS_PROPERTIES = {
        transitionDuration: TRANSITION_DURATION_PROP,
        transitionDelay: TRANSITION_DELAY_PROP,
        transitionProperty: TRANSITION_PROP + PROPERTY_KEY,
        animationDuration: ANIMATION_DURATION_PROP,
        animationDelay: ANIMATION_DELAY_PROP,
        animationIterationCount: ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY
    };
    var DETECT_STAGGER_CSS_PROPERTIES = {
        transitionDuration: TRANSITION_DURATION_PROP,
        transitionDelay: TRANSITION_DELAY_PROP,
        animationDuration: ANIMATION_DURATION_PROP,
        animationDelay: ANIMATION_DELAY_PROP
    };
    function getCssKeyframeDurationStyle(duration) {
        return [ANIMATION_DURATION_PROP, duration + 's'];
    }
    function getCssDelayStyle(delay, isKeyframeAnimation) {
        var prop = isKeyframeAnimation ? ANIMATION_DELAY_PROP : TRANSITION_DELAY_PROP;
        return [prop, delay + 's'];
    }
    function computeCssStyles($window, element, properties) {
        var styles = Object.create(null);
        var detectedStyles = $window.getComputedStyle(element) || {};
        forEach(properties, function (formalStyleName, actualStyleName) {
            var val = detectedStyles[formalStyleName];
            if (val) {
                var c = val.charAt(0);
                if (c === '-' || c === '+' || c >= 0) {
                    val = parseMaxTime(val);
                }
                if (val === 0) {
                    val = null;
                }
                styles[actualStyleName] = val;
            }
        });
        return styles;
    }
    function parseMaxTime(str) {
        var maxValue = 0;
        var values = str.split(/\s*,\s*/);
        forEach(values, function (value) {
            if (value.charAt(value.length - 1) === 's') {
                value = value.substring(0, value.length - 1);
            }
            value = parseFloat(value) || 0;
            maxValue = maxValue ? Math.max(value, maxValue) : value;
        });
        return maxValue;
    }
    function truthyTimingValue(val) {
        return val === 0 || val != null;
    }
    function getCssTransitionDurationStyle(duration, applyOnlyDuration) {
        var style = TRANSITION_PROP;
        var value = duration + 's';
        if (applyOnlyDuration) {
            style += DURATION_KEY;
        }
        else {
            value += ' linear all';
        }
        return [style, value];
    }
    function createLocalCacheLookup() {
        var cache = Object.create(null);
        return {
            flush: function () {
                cache = Object.create(null);
            },
            count: function (key) {
                var entry = cache[key];
                return entry ? entry.total : 0;
            },
            get: function (key) {
                var entry = cache[key];
                return entry && entry.value;
            },
            put: function (key, value) {
                if (!cache[key]) {
                    cache[key] = { total: 1, value: value };
                }
                else {
                    cache[key].total++;
                }
            }
        };
    }
    function registerRestorableStyles(backup, node, properties) {
        forEach(properties, function (prop) {
            backup[prop] = isDefined(backup[prop])
                ? backup[prop]
                : node.style.getPropertyValue(prop);
        });
    }
    var $AnimateCssProvider = ['$animateProvider', function ($animateProvider) {
            var gcsLookup = createLocalCacheLookup();
            var gcsStaggerLookup = createLocalCacheLookup();
            this.$get = ['$window', '$$jqLite', '$$AnimateRunner', '$timeout',
                '$$forceReflow', '$sniffer', '$$rAFScheduler', '$$animateQueue',
                function ($window, $$jqLite, $$AnimateRunner, $timeout, $$forceReflow, $sniffer, $$rAFScheduler, $$animateQueue) {
                    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
                    var parentCounter = 0;
                    function gcsHashFn(node, extraClasses) {
                        var KEY = '$$ngAnimateParentKey';
                        var parentNode = node.parentNode;
                        var parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
                        return parentID + '-' + node.getAttribute('class') + '-' + extraClasses;
                    }
                    function computeCachedCssStyles(node, className, cacheKey, properties) {
                        var timings = gcsLookup.get(cacheKey);
                        if (!timings) {
                            timings = computeCssStyles($window, node, properties);
                            if (timings.animationIterationCount === 'infinite') {
                                timings.animationIterationCount = 1;
                            }
                        }
                        gcsLookup.put(cacheKey, timings);
                        return timings;
                    }
                    function computeCachedCssStaggerStyles(node, className, cacheKey, properties) {
                        var stagger;
                        if (gcsLookup.count(cacheKey) > 0) {
                            stagger = gcsStaggerLookup.get(cacheKey);
                            if (!stagger) {
                                var staggerClassName = pendClasses(className, '-stagger');
                                $$jqLite.addClass(node, staggerClassName);
                                stagger = computeCssStyles($window, node, properties);
                                stagger.animationDuration = Math.max(stagger.animationDuration, 0);
                                stagger.transitionDuration = Math.max(stagger.transitionDuration, 0);
                                $$jqLite.removeClass(node, staggerClassName);
                                gcsStaggerLookup.put(cacheKey, stagger);
                            }
                        }
                        return stagger || {};
                    }
                    var rafWaitQueue = [];
                    function waitUntilQuiet(callback) {
                        rafWaitQueue.push(callback);
                        $$rAFScheduler.waitUntilQuiet(function () {
                            gcsLookup.flush();
                            gcsStaggerLookup.flush();
                            var pageWidth = $$forceReflow();
                            for (var i = 0; i < rafWaitQueue.length; i++) {
                                rafWaitQueue[i](pageWidth);
                            }
                            rafWaitQueue.length = 0;
                        });
                    }
                    function computeTimings(node, className, cacheKey) {
                        var timings = computeCachedCssStyles(node, className, cacheKey, DETECT_CSS_PROPERTIES);
                        var aD = timings.animationDelay;
                        var tD = timings.transitionDelay;
                        timings.maxDelay = aD && tD
                            ? Math.max(aD, tD)
                            : (aD || tD);
                        timings.maxDuration = Math.max(timings.animationDuration * timings.animationIterationCount, timings.transitionDuration);
                        return timings;
                    }
                    return function init(element, initialOptions) {
                        var options = initialOptions || {};
                        if (!options.$$prepared) {
                            options = prepareAnimationOptions(copy(options));
                        }
                        var restoreStyles = {};
                        var node = getDomNode(element);
                        if (!node
                            || !node.parentNode
                            || !$$animateQueue.enabled()) {
                            return closeAndReturnNoopAnimator();
                        }
                        var temporaryStyles = [];
                        var classes = element.attr('class');
                        var styles = packageStyles(options);
                        var animationClosed;
                        var animationPaused;
                        var animationCompleted;
                        var runner;
                        var runnerHost;
                        var maxDelay;
                        var maxDelayTime;
                        var maxDuration;
                        var maxDurationTime;
                        var startTime;
                        var events = [];
                        if (options.duration === 0 || (!$sniffer.animations && !$sniffer.transitions)) {
                            return closeAndReturnNoopAnimator();
                        }
                        var method = options.event && isArray(options.event)
                            ? options.event.join(' ')
                            : options.event;
                        var isStructural = method && options.structural;
                        var structuralClassName = '';
                        var addRemoveClassName = '';
                        if (isStructural) {
                            structuralClassName = pendClasses(method, EVENT_CLASS_PREFIX, true);
                        }
                        else if (method) {
                            structuralClassName = method;
                        }
                        if (options.addClass) {
                            addRemoveClassName += pendClasses(options.addClass, ADD_CLASS_SUFFIX);
                        }
                        if (options.removeClass) {
                            if (addRemoveClassName.length) {
                                addRemoveClassName += ' ';
                            }
                            addRemoveClassName += pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX);
                        }
                        if (options.applyClassesEarly && addRemoveClassName.length) {
                            applyAnimationClasses(element, options);
                        }
                        var preparationClasses = [structuralClassName, addRemoveClassName].join(' ').trim();
                        var fullClassName = classes + ' ' + preparationClasses;
                        var activeClasses = pendClasses(preparationClasses, ACTIVE_CLASS_SUFFIX);
                        var hasToStyles = styles.to && Object.keys(styles.to).length > 0;
                        var containsKeyframeAnimation = (options.keyframeStyle || '').length > 0;
                        if (!containsKeyframeAnimation
                            && !hasToStyles
                            && !preparationClasses) {
                            return closeAndReturnNoopAnimator();
                        }
                        var cacheKey, stagger;
                        if (options.stagger > 0) {
                            var staggerVal = parseFloat(options.stagger);
                            stagger = {
                                transitionDelay: staggerVal,
                                animationDelay: staggerVal,
                                transitionDuration: 0,
                                animationDuration: 0
                            };
                        }
                        else {
                            cacheKey = gcsHashFn(node, fullClassName);
                            stagger = computeCachedCssStaggerStyles(node, preparationClasses, cacheKey, DETECT_STAGGER_CSS_PROPERTIES);
                        }
                        if (!options.$$skipPreparationClasses) {
                            $$jqLite.addClass(element, preparationClasses);
                        }
                        var applyOnlyDuration;
                        if (options.transitionStyle) {
                            var transitionStyle = [TRANSITION_PROP, options.transitionStyle];
                            applyInlineStyle(node, transitionStyle);
                            temporaryStyles.push(transitionStyle);
                        }
                        if (options.duration >= 0) {
                            applyOnlyDuration = node.style[TRANSITION_PROP].length > 0;
                            var durationStyle = getCssTransitionDurationStyle(options.duration, applyOnlyDuration);
                            applyInlineStyle(node, durationStyle);
                            temporaryStyles.push(durationStyle);
                        }
                        if (options.keyframeStyle) {
                            var keyframeStyle = [ANIMATION_PROP, options.keyframeStyle];
                            applyInlineStyle(node, keyframeStyle);
                            temporaryStyles.push(keyframeStyle);
                        }
                        var itemIndex = stagger
                            ? options.staggerIndex >= 0
                                ? options.staggerIndex
                                : gcsLookup.count(cacheKey)
                            : 0;
                        var isFirst = itemIndex === 0;
                        if (isFirst && !options.skipBlocking) {
                            blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);
                        }
                        var timings = computeTimings(node, fullClassName, cacheKey);
                        var relativeDelay = timings.maxDelay;
                        maxDelay = Math.max(relativeDelay, 0);
                        maxDuration = timings.maxDuration;
                        var flags = {};
                        flags.hasTransitions = timings.transitionDuration > 0;
                        flags.hasAnimations = timings.animationDuration > 0;
                        flags.hasTransitionAll = flags.hasTransitions && timings.transitionProperty === 'all';
                        flags.applyTransitionDuration = hasToStyles && ((flags.hasTransitions && !flags.hasTransitionAll)
                            || (flags.hasAnimations && !flags.hasTransitions));
                        flags.applyAnimationDuration = options.duration && flags.hasAnimations;
                        flags.applyTransitionDelay = truthyTimingValue(options.delay) && (flags.applyTransitionDuration || flags.hasTransitions);
                        flags.applyAnimationDelay = truthyTimingValue(options.delay) && flags.hasAnimations;
                        flags.recalculateTimingStyles = addRemoveClassName.length > 0;
                        if (flags.applyTransitionDuration || flags.applyAnimationDuration) {
                            maxDuration = options.duration ? parseFloat(options.duration) : maxDuration;
                            if (flags.applyTransitionDuration) {
                                flags.hasTransitions = true;
                                timings.transitionDuration = maxDuration;
                                applyOnlyDuration = node.style[TRANSITION_PROP + PROPERTY_KEY].length > 0;
                                temporaryStyles.push(getCssTransitionDurationStyle(maxDuration, applyOnlyDuration));
                            }
                            if (flags.applyAnimationDuration) {
                                flags.hasAnimations = true;
                                timings.animationDuration = maxDuration;
                                temporaryStyles.push(getCssKeyframeDurationStyle(maxDuration));
                            }
                        }
                        if (maxDuration === 0 && !flags.recalculateTimingStyles) {
                            return closeAndReturnNoopAnimator();
                        }
                        if (options.delay != null) {
                            var delayStyle;
                            if (typeof options.delay !== 'boolean') {
                                delayStyle = parseFloat(options.delay);
                                maxDelay = Math.max(delayStyle, 0);
                            }
                            if (flags.applyTransitionDelay) {
                                temporaryStyles.push(getCssDelayStyle(delayStyle));
                            }
                            if (flags.applyAnimationDelay) {
                                temporaryStyles.push(getCssDelayStyle(delayStyle, true));
                            }
                        }
                        if (options.duration == null && timings.transitionDuration > 0) {
                            flags.recalculateTimingStyles = flags.recalculateTimingStyles || isFirst;
                        }
                        maxDelayTime = maxDelay * ONE_SECOND;
                        maxDurationTime = maxDuration * ONE_SECOND;
                        if (!options.skipBlocking) {
                            flags.blockTransition = timings.transitionDuration > 0;
                            flags.blockKeyframeAnimation = timings.animationDuration > 0 &&
                                stagger.animationDelay > 0 &&
                                stagger.animationDuration === 0;
                        }
                        if (options.from) {
                            if (options.cleanupStyles) {
                                registerRestorableStyles(restoreStyles, node, Object.keys(options.from));
                            }
                            applyAnimationFromStyles(element, options);
                        }
                        if (flags.blockTransition || flags.blockKeyframeAnimation) {
                            applyBlocking(maxDuration);
                        }
                        else if (!options.skipBlocking) {
                            blockTransitions(node, false);
                        }
                        return {
                            $$willAnimate: true,
                            end: endFn,
                            start: function () {
                                if (animationClosed)
                                    return;
                                runnerHost = {
                                    end: endFn,
                                    cancel: cancelFn,
                                    resume: null,
                                    pause: null
                                };
                                runner = new $$AnimateRunner(runnerHost);
                                waitUntilQuiet(start);
                                return runner;
                            }
                        };
                        function endFn() {
                            close();
                        }
                        function cancelFn() {
                            close(true);
                        }
                        function close(rejected) {
                            if (animationClosed || (animationCompleted && animationPaused))
                                return;
                            animationClosed = true;
                            animationPaused = false;
                            if (!options.$$skipPreparationClasses) {
                                $$jqLite.removeClass(element, preparationClasses);
                            }
                            $$jqLite.removeClass(element, activeClasses);
                            blockKeyframeAnimations(node, false);
                            blockTransitions(node, false);
                            forEach(temporaryStyles, function (entry) {
                                node.style[entry[0]] = '';
                            });
                            applyAnimationClasses(element, options);
                            applyAnimationStyles(element, options);
                            if (Object.keys(restoreStyles).length) {
                                forEach(restoreStyles, function (value, prop) {
                                    if (value) {
                                        node.style.setProperty(prop, value);
                                    }
                                    else {
                                        node.style.removeProperty(prop);
                                    }
                                });
                            }
                            if (options.onDone) {
                                options.onDone();
                            }
                            if (events && events.length) {
                                element.off(events.join(' '), onAnimationProgress);
                            }
                            var animationTimerData = element.data(ANIMATE_TIMER_KEY);
                            if (animationTimerData) {
                                $timeout.cancel(animationTimerData[0].timer);
                                element.removeData(ANIMATE_TIMER_KEY);
                            }
                            if (runner) {
                                runner.complete(!rejected);
                            }
                        }
                        function applyBlocking(duration) {
                            if (flags.blockTransition) {
                                blockTransitions(node, duration);
                            }
                            if (flags.blockKeyframeAnimation) {
                                blockKeyframeAnimations(node, !!duration);
                            }
                        }
                        function closeAndReturnNoopAnimator() {
                            runner = new $$AnimateRunner({
                                end: endFn,
                                cancel: cancelFn
                            });
                            waitUntilQuiet(noop);
                            close();
                            return {
                                $$willAnimate: false,
                                start: function () {
                                    return runner;
                                },
                                end: endFn
                            };
                        }
                        function onAnimationProgress(event) {
                            event.stopPropagation();
                            var ev = event.originalEvent || event;
                            if (ev.target !== node) {
                                return;
                            }
                            var timeStamp = ev.$manualTimeStamp || Date.now();
                            var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));
                            if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
                                animationCompleted = true;
                                close();
                            }
                        }
                        function start() {
                            if (animationClosed)
                                return;
                            if (!node.parentNode) {
                                close();
                                return;
                            }
                            var playPause = function (playAnimation) {
                                if (!animationCompleted) {
                                    animationPaused = !playAnimation;
                                    if (timings.animationDuration) {
                                        var value = blockKeyframeAnimations(node, animationPaused);
                                        if (animationPaused) {
                                            temporaryStyles.push(value);
                                        }
                                        else {
                                            removeFromArray(temporaryStyles, value);
                                        }
                                    }
                                }
                                else if (animationPaused && playAnimation) {
                                    animationPaused = false;
                                    close();
                                }
                            };
                            var maxStagger = itemIndex > 0
                                && ((timings.transitionDuration && stagger.transitionDuration === 0) ||
                                    (timings.animationDuration && stagger.animationDuration === 0))
                                && Math.max(stagger.animationDelay, stagger.transitionDelay);
                            if (maxStagger) {
                                $timeout(triggerAnimationStart, Math.floor(maxStagger * itemIndex * ONE_SECOND), false);
                            }
                            else {
                                triggerAnimationStart();
                            }
                            runnerHost.resume = function () {
                                playPause(true);
                            };
                            runnerHost.pause = function () {
                                playPause(false);
                            };
                            function triggerAnimationStart() {
                                if (animationClosed)
                                    return;
                                applyBlocking(false);
                                forEach(temporaryStyles, function (entry) {
                                    var key = entry[0];
                                    var value = entry[1];
                                    node.style[key] = value;
                                });
                                applyAnimationClasses(element, options);
                                $$jqLite.addClass(element, activeClasses);
                                if (flags.recalculateTimingStyles) {
                                    fullClassName = node.getAttribute('class') + ' ' + preparationClasses;
                                    cacheKey = gcsHashFn(node, fullClassName);
                                    timings = computeTimings(node, fullClassName, cacheKey);
                                    relativeDelay = timings.maxDelay;
                                    maxDelay = Math.max(relativeDelay, 0);
                                    maxDuration = timings.maxDuration;
                                    if (maxDuration === 0) {
                                        close();
                                        return;
                                    }
                                    flags.hasTransitions = timings.transitionDuration > 0;
                                    flags.hasAnimations = timings.animationDuration > 0;
                                }
                                if (flags.applyAnimationDelay) {
                                    relativeDelay = typeof options.delay !== 'boolean' && truthyTimingValue(options.delay)
                                        ? parseFloat(options.delay)
                                        : relativeDelay;
                                    maxDelay = Math.max(relativeDelay, 0);
                                    timings.animationDelay = relativeDelay;
                                    delayStyle = getCssDelayStyle(relativeDelay, true);
                                    temporaryStyles.push(delayStyle);
                                    node.style[delayStyle[0]] = delayStyle[1];
                                }
                                maxDelayTime = maxDelay * ONE_SECOND;
                                maxDurationTime = maxDuration * ONE_SECOND;
                                if (options.easing) {
                                    var easeProp, easeVal = options.easing;
                                    if (flags.hasTransitions) {
                                        easeProp = TRANSITION_PROP + TIMING_KEY;
                                        temporaryStyles.push([easeProp, easeVal]);
                                        node.style[easeProp] = easeVal;
                                    }
                                    if (flags.hasAnimations) {
                                        easeProp = ANIMATION_PROP + TIMING_KEY;
                                        temporaryStyles.push([easeProp, easeVal]);
                                        node.style[easeProp] = easeVal;
                                    }
                                }
                                if (timings.transitionDuration) {
                                    events.push(TRANSITIONEND_EVENT);
                                }
                                if (timings.animationDuration) {
                                    events.push(ANIMATIONEND_EVENT);
                                }
                                startTime = Date.now();
                                var timerTime = maxDelayTime + CLOSING_TIME_BUFFER * maxDurationTime;
                                var endTime = startTime + timerTime;
                                var animationsData = element.data(ANIMATE_TIMER_KEY) || [];
                                var setupFallbackTimer = true;
                                if (animationsData.length) {
                                    var currentTimerData = animationsData[0];
                                    setupFallbackTimer = endTime > currentTimerData.expectedEndTime;
                                    if (setupFallbackTimer) {
                                        $timeout.cancel(currentTimerData.timer);
                                    }
                                    else {
                                        animationsData.push(close);
                                    }
                                }
                                if (setupFallbackTimer) {
                                    var timer = $timeout(onAnimationExpired, timerTime, false);
                                    animationsData[0] = {
                                        timer: timer,
                                        expectedEndTime: endTime
                                    };
                                    animationsData.push(close);
                                    element.data(ANIMATE_TIMER_KEY, animationsData);
                                }
                                if (events.length) {
                                    element.on(events.join(' '), onAnimationProgress);
                                }
                                if (options.to) {
                                    if (options.cleanupStyles) {
                                        registerRestorableStyles(restoreStyles, node, Object.keys(options.to));
                                    }
                                    applyAnimationToStyles(element, options);
                                }
                            }
                            function onAnimationExpired() {
                                var animationsData = element.data(ANIMATE_TIMER_KEY);
                                if (animationsData) {
                                    for (var i = 1; i < animationsData.length; i++) {
                                        animationsData[i]();
                                    }
                                    element.removeData(ANIMATE_TIMER_KEY);
                                }
                            }
                        }
                    };
                }];
        }];
    var $$AnimateCssDriverProvider = ['$$animationProvider', function ($$animationProvider) {
            $$animationProvider.drivers.push('$$animateCssDriver');
            var NG_ANIMATE_SHIM_CLASS_NAME = 'ng-animate-shim';
            var NG_ANIMATE_ANCHOR_CLASS_NAME = 'ng-anchor';
            var NG_OUT_ANCHOR_CLASS_NAME = 'ng-anchor-out';
            var NG_IN_ANCHOR_CLASS_NAME = 'ng-anchor-in';
            function isDocumentFragment(node) {
                return node.parentNode && node.parentNode.nodeType === 11;
            }
            this.$get = ['$animateCss', '$rootScope', '$$AnimateRunner', '$rootElement', '$sniffer', '$$jqLite', '$document',
                function ($animateCss, $rootScope, $$AnimateRunner, $rootElement, $sniffer, $$jqLite, $document) {
                    if (!$sniffer.animations && !$sniffer.transitions)
                        return noop;
                    var bodyNode = $document[0].body;
                    var rootNode = getDomNode($rootElement);
                    var rootBodyElement = jqLite(isDocumentFragment(rootNode) || bodyNode.contains(rootNode) ? rootNode : bodyNode);
                    return function initDriverFn(animationDetails) {
                        return animationDetails.from && animationDetails.to
                            ? prepareFromToAnchorAnimation(animationDetails.from, animationDetails.to, animationDetails.classes, animationDetails.anchors)
                            : prepareRegularAnimation(animationDetails);
                    };
                    function filterCssClasses(classes) {
                        return classes.replace(/\bng-\S+\b/g, '');
                    }
                    function getUniqueValues(a, b) {
                        if (isString(a))
                            a = a.split(' ');
                        if (isString(b))
                            b = b.split(' ');
                        return a.filter(function (val) {
                            return b.indexOf(val) === -1;
                        }).join(' ');
                    }
                    function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
                        var clone = jqLite(getDomNode(outAnchor).cloneNode(true));
                        var startingClasses = filterCssClasses(getClassVal(clone));
                        outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
                        inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
                        clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);
                        rootBodyElement.append(clone);
                        var animatorIn, animatorOut = prepareOutAnimation();
                        if (!animatorOut) {
                            animatorIn = prepareInAnimation();
                            if (!animatorIn) {
                                return end();
                            }
                        }
                        var startingAnimator = animatorOut || animatorIn;
                        return {
                            start: function () {
                                var runner;
                                var currentAnimation = startingAnimator.start();
                                currentAnimation.done(function () {
                                    currentAnimation = null;
                                    if (!animatorIn) {
                                        animatorIn = prepareInAnimation();
                                        if (animatorIn) {
                                            currentAnimation = animatorIn.start();
                                            currentAnimation.done(function () {
                                                currentAnimation = null;
                                                end();
                                                runner.complete();
                                            });
                                            return currentAnimation;
                                        }
                                    }
                                    end();
                                    runner.complete();
                                });
                                runner = new $$AnimateRunner({
                                    end: endFn,
                                    cancel: endFn
                                });
                                return runner;
                                function endFn() {
                                    if (currentAnimation) {
                                        currentAnimation.end();
                                    }
                                }
                            }
                        };
                        function calculateAnchorStyles(anchor) {
                            var styles = {};
                            var coords = getDomNode(anchor).getBoundingClientRect();
                            forEach(['width', 'height', 'top', 'left'], function (key) {
                                var value = coords[key];
                                switch (key) {
                                    case 'top':
                                        value += bodyNode.scrollTop;
                                        break;
                                    case 'left':
                                        value += bodyNode.scrollLeft;
                                        break;
                                }
                                styles[key] = Math.floor(value) + 'px';
                            });
                            return styles;
                        }
                        function prepareOutAnimation() {
                            var animator = $animateCss(clone, {
                                addClass: NG_OUT_ANCHOR_CLASS_NAME,
                                delay: true,
                                from: calculateAnchorStyles(outAnchor)
                            });
                            return animator.$$willAnimate ? animator : null;
                        }
                        function getClassVal(element) {
                            return element.attr('class') || '';
                        }
                        function prepareInAnimation() {
                            var endingClasses = filterCssClasses(getClassVal(inAnchor));
                            var toAdd = getUniqueValues(endingClasses, startingClasses);
                            var toRemove = getUniqueValues(startingClasses, endingClasses);
                            var animator = $animateCss(clone, {
                                to: calculateAnchorStyles(inAnchor),
                                addClass: NG_IN_ANCHOR_CLASS_NAME + ' ' + toAdd,
                                removeClass: NG_OUT_ANCHOR_CLASS_NAME + ' ' + toRemove,
                                delay: true
                            });
                            return animator.$$willAnimate ? animator : null;
                        }
                        function end() {
                            clone.remove();
                            outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
                            inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
                        }
                    }
                    function prepareFromToAnchorAnimation(from, to, classes, anchors) {
                        var fromAnimation = prepareRegularAnimation(from, noop);
                        var toAnimation = prepareRegularAnimation(to, noop);
                        var anchorAnimations = [];
                        forEach(anchors, function (anchor) {
                            var outElement = anchor['out'];
                            var inElement = anchor['in'];
                            var animator = prepareAnchoredAnimation(classes, outElement, inElement);
                            if (animator) {
                                anchorAnimations.push(animator);
                            }
                        });
                        if (!fromAnimation && !toAnimation && anchorAnimations.length === 0)
                            return;
                        return {
                            start: function () {
                                var animationRunners = [];
                                if (fromAnimation) {
                                    animationRunners.push(fromAnimation.start());
                                }
                                if (toAnimation) {
                                    animationRunners.push(toAnimation.start());
                                }
                                forEach(anchorAnimations, function (animation) {
                                    animationRunners.push(animation.start());
                                });
                                var runner = new $$AnimateRunner({
                                    end: endFn,
                                    cancel: endFn
                                });
                                $$AnimateRunner.all(animationRunners, function (status) {
                                    runner.complete(status);
                                });
                                return runner;
                                function endFn() {
                                    forEach(animationRunners, function (runner) {
                                        runner.end();
                                    });
                                }
                            }
                        };
                    }
                    function prepareRegularAnimation(animationDetails) {
                        var element = animationDetails.element;
                        var options = animationDetails.options || {};
                        if (animationDetails.structural) {
                            options.event = animationDetails.event;
                            options.structural = true;
                            options.applyClassesEarly = true;
                            if (animationDetails.event === 'leave') {
                                options.onDone = options.domOperation;
                            }
                        }
                        if (options.preparationClasses) {
                            options.event = concatWithSpace(options.event, options.preparationClasses);
                        }
                        var animator = $animateCss(element, options);
                        return animator.$$willAnimate ? animator : null;
                    }
                }];
        }];
    var $$AnimateJsProvider = ['$animateProvider', function ($animateProvider) {
            this.$get = ['$injector', '$$AnimateRunner', '$$jqLite',
                function ($injector, $$AnimateRunner, $$jqLite) {
                    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
                    return function (element, event, classes, options) {
                        var animationClosed = false;
                        if (arguments.length === 3 && isObject(classes)) {
                            options = classes;
                            classes = null;
                        }
                        options = prepareAnimationOptions(options);
                        if (!classes) {
                            classes = element.attr('class') || '';
                            if (options.addClass) {
                                classes += ' ' + options.addClass;
                            }
                            if (options.removeClass) {
                                classes += ' ' + options.removeClass;
                            }
                        }
                        var classesToAdd = options.addClass;
                        var classesToRemove = options.removeClass;
                        var animations = lookupAnimations(classes);
                        var before, after;
                        if (animations.length) {
                            var afterFn, beforeFn;
                            if (event === 'leave') {
                                beforeFn = 'leave';
                                afterFn = 'afterLeave';
                            }
                            else {
                                beforeFn = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
                                afterFn = event;
                            }
                            if (event !== 'enter' && event !== 'move') {
                                before = packageAnimations(element, event, options, animations, beforeFn);
                            }
                            after = packageAnimations(element, event, options, animations, afterFn);
                        }
                        if (!before && !after)
                            return;
                        function applyOptions() {
                            options.domOperation();
                            applyAnimationClasses(element, options);
                        }
                        function close() {
                            animationClosed = true;
                            applyOptions();
                            applyAnimationStyles(element, options);
                        }
                        var runner;
                        return {
                            $$willAnimate: true,
                            end: function () {
                                if (runner) {
                                    runner.end();
                                }
                                else {
                                    close();
                                    runner = new $$AnimateRunner();
                                    runner.complete(true);
                                }
                                return runner;
                            },
                            start: function () {
                                if (runner) {
                                    return runner;
                                }
                                runner = new $$AnimateRunner();
                                var closeActiveAnimations;
                                var chain = [];
                                if (before) {
                                    chain.push(function (fn) {
                                        closeActiveAnimations = before(fn);
                                    });
                                }
                                if (chain.length) {
                                    chain.push(function (fn) {
                                        applyOptions();
                                        fn(true);
                                    });
                                }
                                else {
                                    applyOptions();
                                }
                                if (after) {
                                    chain.push(function (fn) {
                                        closeActiveAnimations = after(fn);
                                    });
                                }
                                runner.setHost({
                                    end: function () {
                                        endAnimations();
                                    },
                                    cancel: function () {
                                        endAnimations(true);
                                    }
                                });
                                $$AnimateRunner.chain(chain, onComplete);
                                return runner;
                                function onComplete(success) {
                                    close(success);
                                    runner.complete(success);
                                }
                                function endAnimations(cancelled) {
                                    if (!animationClosed) {
                                        (closeActiveAnimations || noop)(cancelled);
                                        onComplete(cancelled);
                                    }
                                }
                            }
                        };
                        function executeAnimationFn(fn, element, event, options, onDone) {
                            var args;
                            switch (event) {
                                case 'animate':
                                    args = [element, options.from, options.to, onDone];
                                    break;
                                case 'setClass':
                                    args = [element, classesToAdd, classesToRemove, onDone];
                                    break;
                                case 'addClass':
                                    args = [element, classesToAdd, onDone];
                                    break;
                                case 'removeClass':
                                    args = [element, classesToRemove, onDone];
                                    break;
                                default:
                                    args = [element, onDone];
                                    break;
                            }
                            args.push(options);
                            var value = fn.apply(fn, args);
                            if (value) {
                                if (isFunction(value.start)) {
                                    value = value.start();
                                }
                                if (value instanceof $$AnimateRunner) {
                                    value.done(onDone);
                                }
                                else if (isFunction(value)) {
                                    return value;
                                }
                            }
                            return noop;
                        }
                        function groupEventedAnimations(element, event, options, animations, fnName) {
                            var operations = [];
                            forEach(animations, function (ani) {
                                var animation = ani[fnName];
                                if (!animation)
                                    return;
                                operations.push(function () {
                                    var runner;
                                    var endProgressCb;
                                    var resolved = false;
                                    var onAnimationComplete = function (rejected) {
                                        if (!resolved) {
                                            resolved = true;
                                            (endProgressCb || noop)(rejected);
                                            runner.complete(!rejected);
                                        }
                                    };
                                    runner = new $$AnimateRunner({
                                        end: function () {
                                            onAnimationComplete();
                                        },
                                        cancel: function () {
                                            onAnimationComplete(true);
                                        }
                                    });
                                    endProgressCb = executeAnimationFn(animation, element, event, options, function (result) {
                                        var cancelled = result === false;
                                        onAnimationComplete(cancelled);
                                    });
                                    return runner;
                                });
                            });
                            return operations;
                        }
                        function packageAnimations(element, event, options, animations, fnName) {
                            var operations = groupEventedAnimations(element, event, options, animations, fnName);
                            if (operations.length === 0) {
                                var a, b;
                                if (fnName === 'beforeSetClass') {
                                    a = groupEventedAnimations(element, 'removeClass', options, animations, 'beforeRemoveClass');
                                    b = groupEventedAnimations(element, 'addClass', options, animations, 'beforeAddClass');
                                }
                                else if (fnName === 'setClass') {
                                    a = groupEventedAnimations(element, 'removeClass', options, animations, 'removeClass');
                                    b = groupEventedAnimations(element, 'addClass', options, animations, 'addClass');
                                }
                                if (a) {
                                    operations = operations.concat(a);
                                }
                                if (b) {
                                    operations = operations.concat(b);
                                }
                            }
                            if (operations.length === 0)
                                return;
                            return function startAnimation(callback) {
                                var runners = [];
                                if (operations.length) {
                                    forEach(operations, function (animateFn) {
                                        runners.push(animateFn());
                                    });
                                }
                                if (runners.length) {
                                    $$AnimateRunner.all(runners, callback);
                                }
                                else {
                                    callback();
                                }
                                return function endFn(reject) {
                                    forEach(runners, function (runner) {
                                        if (reject) {
                                            runner.cancel();
                                        }
                                        else {
                                            runner.end();
                                        }
                                    });
                                };
                            };
                        }
                    };
                    function lookupAnimations(classes) {
                        classes = isArray(classes) ? classes : classes.split(' ');
                        var matches = [], flagMap = {};
                        for (var i = 0; i < classes.length; i++) {
                            var klass = classes[i], animationFactory = $animateProvider.$$registeredAnimations[klass];
                            if (animationFactory && !flagMap[klass]) {
                                matches.push($injector.get(animationFactory));
                                flagMap[klass] = true;
                            }
                        }
                        return matches;
                    }
                }];
        }];
    var $$AnimateJsDriverProvider = ['$$animationProvider', function ($$animationProvider) {
            $$animationProvider.drivers.push('$$animateJsDriver');
            this.$get = ['$$animateJs', '$$AnimateRunner', function ($$animateJs, $$AnimateRunner) {
                    return function initDriverFn(animationDetails) {
                        if (animationDetails.from && animationDetails.to) {
                            var fromAnimation = prepareAnimation(animationDetails.from);
                            var toAnimation = prepareAnimation(animationDetails.to);
                            if (!fromAnimation && !toAnimation)
                                return;
                            return {
                                start: function () {
                                    var animationRunners = [];
                                    if (fromAnimation) {
                                        animationRunners.push(fromAnimation.start());
                                    }
                                    if (toAnimation) {
                                        animationRunners.push(toAnimation.start());
                                    }
                                    $$AnimateRunner.all(animationRunners, done);
                                    var runner = new $$AnimateRunner({
                                        end: endFnFactory(),
                                        cancel: endFnFactory()
                                    });
                                    return runner;
                                    function endFnFactory() {
                                        return function () {
                                            forEach(animationRunners, function (runner) {
                                                runner.end();
                                            });
                                        };
                                    }
                                    function done(status) {
                                        runner.complete(status);
                                    }
                                }
                            };
                        }
                        else {
                            return prepareAnimation(animationDetails);
                        }
                    };
                    function prepareAnimation(animationDetails) {
                        var element = animationDetails.element;
                        var event = animationDetails.event;
                        var options = animationDetails.options;
                        var classes = animationDetails.classes;
                        return $$animateJs(element, event, classes, options);
                    }
                }];
        }];
    var NG_ANIMATE_ATTR_NAME = 'data-ng-animate';
    var NG_ANIMATE_PIN_DATA = '$ngAnimatePin';
    var $$AnimateQueueProvider = ['$animateProvider', function ($animateProvider) {
            var PRE_DIGEST_STATE = 1;
            var RUNNING_STATE = 2;
            var ONE_SPACE = ' ';
            var rules = this.rules = {
                skip: [],
                cancel: [],
                join: []
            };
            function makeTruthyCssClassMap(classString) {
                if (!classString) {
                    return null;
                }
                var keys = classString.split(ONE_SPACE);
                var map = Object.create(null);
                forEach(keys, function (key) {
                    map[key] = true;
                });
                return map;
            }
            function hasMatchingClasses(newClassString, currentClassString) {
                if (newClassString && currentClassString) {
                    var currentClassMap = makeTruthyCssClassMap(currentClassString);
                    return newClassString.split(ONE_SPACE).some(function (className) {
                        return currentClassMap[className];
                    });
                }
            }
            function isAllowed(ruleType, currentAnimation, previousAnimation) {
                return rules[ruleType].some(function (fn) {
                    return fn(currentAnimation, previousAnimation);
                });
            }
            function hasAnimationClasses(animation, and) {
                var a = (animation.addClass || '').length > 0;
                var b = (animation.removeClass || '').length > 0;
                return and ? a && b : a || b;
            }
            rules.join.push(function (newAnimation, currentAnimation) {
                return !newAnimation.structural && hasAnimationClasses(newAnimation);
            });
            rules.skip.push(function (newAnimation, currentAnimation) {
                return !newAnimation.structural && !hasAnimationClasses(newAnimation);
            });
            rules.skip.push(function (newAnimation, currentAnimation) {
                return currentAnimation.event === 'leave' && newAnimation.structural;
            });
            rules.skip.push(function (newAnimation, currentAnimation) {
                return currentAnimation.structural && currentAnimation.state === RUNNING_STATE && !newAnimation.structural;
            });
            rules.cancel.push(function (newAnimation, currentAnimation) {
                return currentAnimation.structural && newAnimation.structural;
            });
            rules.cancel.push(function (newAnimation, currentAnimation) {
                return currentAnimation.state === RUNNING_STATE && newAnimation.structural;
            });
            rules.cancel.push(function (newAnimation, currentAnimation) {
                if (currentAnimation.structural)
                    return false;
                var nA = newAnimation.addClass;
                var nR = newAnimation.removeClass;
                var cA = currentAnimation.addClass;
                var cR = currentAnimation.removeClass;
                if ((isUndefined(nA) && isUndefined(nR)) || (isUndefined(cA) && isUndefined(cR))) {
                    return false;
                }
                return hasMatchingClasses(nA, cR) || hasMatchingClasses(nR, cA);
            });
            this.$get = ['$$rAF', '$rootScope', '$rootElement', '$document', '$$Map',
                '$$animation', '$$AnimateRunner', '$templateRequest', '$$jqLite', '$$forceReflow',
                '$$isDocumentHidden',
                function ($$rAF, $rootScope, $rootElement, $document, $$Map, $$animation, $$AnimateRunner, $templateRequest, $$jqLite, $$forceReflow, $$isDocumentHidden) {
                    var activeAnimationsLookup = new $$Map();
                    var disabledElementsLookup = new $$Map();
                    var animationsEnabled = null;
                    function postDigestTaskFactory() {
                        var postDigestCalled = false;
                        return function (fn) {
                            if (postDigestCalled) {
                                fn();
                            }
                            else {
                                $rootScope.$$postDigest(function () {
                                    postDigestCalled = true;
                                    fn();
                                });
                            }
                        };
                    }
                    var deregisterWatch = $rootScope.$watch(function () { return $templateRequest.totalPendingRequests === 0; }, function (isEmpty) {
                        if (!isEmpty)
                            return;
                        deregisterWatch();
                        $rootScope.$$postDigest(function () {
                            $rootScope.$$postDigest(function () {
                                if (animationsEnabled === null) {
                                    animationsEnabled = true;
                                }
                            });
                        });
                    });
                    var callbackRegistry = Object.create(null);
                    var customFilter = $animateProvider.customFilter();
                    var classNameFilter = $animateProvider.classNameFilter();
                    var returnTrue = function () { return true; };
                    var isAnimatableByFilter = customFilter || returnTrue;
                    var isAnimatableClassName = !classNameFilter ? returnTrue : function (node, options) {
                        var className = [node.getAttribute('class'), options.addClass, options.removeClass].join(' ');
                        return classNameFilter.test(className);
                    };
                    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
                    function normalizeAnimationDetails(element, animation) {
                        return mergeAnimationDetails(element, animation, {});
                    }
                    var contains = window.Node.prototype.contains || function (arg) {
                        return this === arg || !!(this.compareDocumentPosition(arg) & 16);
                    };
                    function findCallbacks(targetParentNode, targetNode, event) {
                        var matches = [];
                        var entries = callbackRegistry[event];
                        if (entries) {
                            forEach(entries, function (entry) {
                                if (contains.call(entry.node, targetNode)) {
                                    matches.push(entry.callback);
                                }
                                else if (event === 'leave' && contains.call(entry.node, targetParentNode)) {
                                    matches.push(entry.callback);
                                }
                            });
                        }
                        return matches;
                    }
                    function filterFromRegistry(list, matchContainer, matchCallback) {
                        var containerNode = extractElementNode(matchContainer);
                        return list.filter(function (entry) {
                            var isMatch = entry.node === containerNode &&
                                (!matchCallback || entry.callback === matchCallback);
                            return !isMatch;
                        });
                    }
                    function cleanupEventListeners(phase, node) {
                        if (phase === 'close' && !node.parentNode) {
                            $animate.off(node);
                        }
                    }
                    var $animate = {
                        on: function (event, container, callback) {
                            var node = extractElementNode(container);
                            callbackRegistry[event] = callbackRegistry[event] || [];
                            callbackRegistry[event].push({
                                node: node,
                                callback: callback
                            });
                            jqLite(container).on('$destroy', function () {
                                var animationDetails = activeAnimationsLookup.get(node);
                                if (!animationDetails) {
                                    $animate.off(event, container, callback);
                                }
                            });
                        },
                        off: function (event, container, callback) {
                            if (arguments.length === 1 && !isString(arguments[0])) {
                                container = arguments[0];
                                for (var eventType in callbackRegistry) {
                                    callbackRegistry[eventType] = filterFromRegistry(callbackRegistry[eventType], container);
                                }
                                return;
                            }
                            var entries = callbackRegistry[event];
                            if (!entries)
                                return;
                            callbackRegistry[event] = arguments.length === 1
                                ? null
                                : filterFromRegistry(entries, container, callback);
                        },
                        pin: function (element, parentElement) {
                            assertArg(isElement(element), 'element', 'not an element');
                            assertArg(isElement(parentElement), 'parentElement', 'not an element');
                            element.data(NG_ANIMATE_PIN_DATA, parentElement);
                        },
                        push: function (element, event, options, domOperation) {
                            options = options || {};
                            options.domOperation = domOperation;
                            return queueAnimation(element, event, options);
                        },
                        enabled: function (element, bool) {
                            var argCount = arguments.length;
                            if (argCount === 0) {
                                bool = !!animationsEnabled;
                            }
                            else {
                                var hasElement = isElement(element);
                                if (!hasElement) {
                                    bool = animationsEnabled = !!element;
                                }
                                else {
                                    var node = getDomNode(element);
                                    if (argCount === 1) {
                                        bool = !disabledElementsLookup.get(node);
                                    }
                                    else {
                                        disabledElementsLookup.set(node, !bool);
                                    }
                                }
                            }
                            return bool;
                        }
                    };
                    return $animate;
                    function queueAnimation(originalElement, event, initialOptions) {
                        var options = copy(initialOptions);
                        var element = stripCommentsFromElement(originalElement);
                        var node = getDomNode(element);
                        var parentNode = node && node.parentNode;
                        options = prepareAnimationOptions(options);
                        var runner = new $$AnimateRunner();
                        var runInNextPostDigestOrNow = postDigestTaskFactory();
                        if (isArray(options.addClass)) {
                            options.addClass = options.addClass.join(' ');
                        }
                        if (options.addClass && !isString(options.addClass)) {
                            options.addClass = null;
                        }
                        if (isArray(options.removeClass)) {
                            options.removeClass = options.removeClass.join(' ');
                        }
                        if (options.removeClass && !isString(options.removeClass)) {
                            options.removeClass = null;
                        }
                        if (options.from && !isObject(options.from)) {
                            options.from = null;
                        }
                        if (options.to && !isObject(options.to)) {
                            options.to = null;
                        }
                        if (!animationsEnabled ||
                            !node ||
                            !isAnimatableByFilter(node, event, initialOptions) ||
                            !isAnimatableClassName(node, options)) {
                            close();
                            return runner;
                        }
                        var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;
                        var documentHidden = $$isDocumentHidden();
                        var skipAnimations = documentHidden || disabledElementsLookup.get(node);
                        var existingAnimation = (!skipAnimations && activeAnimationsLookup.get(node)) || {};
                        var hasExistingAnimation = !!existingAnimation.state;
                        if (!skipAnimations && (!hasExistingAnimation || existingAnimation.state !== PRE_DIGEST_STATE)) {
                            skipAnimations = !areAnimationsAllowed(node, parentNode, event);
                        }
                        if (skipAnimations) {
                            if (documentHidden)
                                notifyProgress(runner, event, 'start');
                            close();
                            if (documentHidden)
                                notifyProgress(runner, event, 'close');
                            return runner;
                        }
                        if (isStructural) {
                            closeChildAnimations(node);
                        }
                        var newAnimation = {
                            structural: isStructural,
                            element: element,
                            event: event,
                            addClass: options.addClass,
                            removeClass: options.removeClass,
                            close: close,
                            options: options,
                            runner: runner
                        };
                        if (hasExistingAnimation) {
                            var skipAnimationFlag = isAllowed('skip', newAnimation, existingAnimation);
                            if (skipAnimationFlag) {
                                if (existingAnimation.state === RUNNING_STATE) {
                                    close();
                                    return runner;
                                }
                                else {
                                    mergeAnimationDetails(element, existingAnimation, newAnimation);
                                    return existingAnimation.runner;
                                }
                            }
                            var cancelAnimationFlag = isAllowed('cancel', newAnimation, existingAnimation);
                            if (cancelAnimationFlag) {
                                if (existingAnimation.state === RUNNING_STATE) {
                                    existingAnimation.runner.end();
                                }
                                else if (existingAnimation.structural) {
                                    existingAnimation.close();
                                }
                                else {
                                    mergeAnimationDetails(element, existingAnimation, newAnimation);
                                    return existingAnimation.runner;
                                }
                            }
                            else {
                                var joinAnimationFlag = isAllowed('join', newAnimation, existingAnimation);
                                if (joinAnimationFlag) {
                                    if (existingAnimation.state === RUNNING_STATE) {
                                        normalizeAnimationDetails(element, newAnimation);
                                    }
                                    else {
                                        applyGeneratedPreparationClasses(element, isStructural ? event : null, options);
                                        event = newAnimation.event = existingAnimation.event;
                                        options = mergeAnimationDetails(element, existingAnimation, newAnimation);
                                        return existingAnimation.runner;
                                    }
                                }
                            }
                        }
                        else {
                            normalizeAnimationDetails(element, newAnimation);
                        }
                        var isValidAnimation = newAnimation.structural;
                        if (!isValidAnimation) {
                            isValidAnimation = (newAnimation.event === 'animate' && Object.keys(newAnimation.options.to || {}).length > 0)
                                || hasAnimationClasses(newAnimation);
                        }
                        if (!isValidAnimation) {
                            close();
                            clearElementAnimationState(node);
                            return runner;
                        }
                        var counter = (existingAnimation.counter || 0) + 1;
                        newAnimation.counter = counter;
                        markElementAnimationState(node, PRE_DIGEST_STATE, newAnimation);
                        $rootScope.$$postDigest(function () {
                            element = stripCommentsFromElement(originalElement);
                            var animationDetails = activeAnimationsLookup.get(node);
                            var animationCancelled = !animationDetails;
                            animationDetails = animationDetails || {};
                            var parentElement = element.parent() || [];
                            var isValidAnimation = parentElement.length > 0
                                && (animationDetails.event === 'animate'
                                    || animationDetails.structural
                                    || hasAnimationClasses(animationDetails));
                            if (animationCancelled || animationDetails.counter !== counter || !isValidAnimation) {
                                if (animationCancelled) {
                                    applyAnimationClasses(element, options);
                                    applyAnimationStyles(element, options);
                                }
                                if (animationCancelled || (isStructural && animationDetails.event !== event)) {
                                    options.domOperation();
                                    runner.end();
                                }
                                if (!isValidAnimation) {
                                    clearElementAnimationState(node);
                                }
                                return;
                            }
                            event = !animationDetails.structural && hasAnimationClasses(animationDetails, true)
                                ? 'setClass'
                                : animationDetails.event;
                            markElementAnimationState(node, RUNNING_STATE);
                            var realRunner = $$animation(element, event, animationDetails.options);
                            runner.setHost(realRunner);
                            notifyProgress(runner, event, 'start', {});
                            realRunner.done(function (status) {
                                close(!status);
                                var animationDetails = activeAnimationsLookup.get(node);
                                if (animationDetails && animationDetails.counter === counter) {
                                    clearElementAnimationState(node);
                                }
                                notifyProgress(runner, event, 'close', {});
                            });
                        });
                        return runner;
                        function notifyProgress(runner, event, phase, data) {
                            runInNextPostDigestOrNow(function () {
                                var callbacks = findCallbacks(parentNode, node, event);
                                if (callbacks.length) {
                                    $$rAF(function () {
                                        forEach(callbacks, function (callback) {
                                            callback(element, phase, data);
                                        });
                                        cleanupEventListeners(phase, node);
                                    });
                                }
                                else {
                                    cleanupEventListeners(phase, node);
                                }
                            });
                            runner.progress(event, phase, data);
                        }
                        function close(reject) {
                            clearGeneratedClasses(element, options);
                            applyAnimationClasses(element, options);
                            applyAnimationStyles(element, options);
                            options.domOperation();
                            runner.complete(!reject);
                        }
                    }
                    function closeChildAnimations(node) {
                        var children = node.querySelectorAll('[' + NG_ANIMATE_ATTR_NAME + ']');
                        forEach(children, function (child) {
                            var state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME), 10);
                            var animationDetails = activeAnimationsLookup.get(child);
                            if (animationDetails) {
                                switch (state) {
                                    case RUNNING_STATE:
                                        animationDetails.runner.end();
                                    case PRE_DIGEST_STATE:
                                        activeAnimationsLookup["delete"](child);
                                        break;
                                }
                            }
                        });
                    }
                    function clearElementAnimationState(node) {
                        node.removeAttribute(NG_ANIMATE_ATTR_NAME);
                        activeAnimationsLookup["delete"](node);
                    }
                    function areAnimationsAllowed(node, parentNode, event) {
                        var bodyNode = $document[0].body;
                        var rootNode = getDomNode($rootElement);
                        var bodyNodeDetected = (node === bodyNode) || node.nodeName === 'HTML';
                        var rootNodeDetected = (node === rootNode);
                        var parentAnimationDetected = false;
                        var elementDisabled = disabledElementsLookup.get(node);
                        var animateChildren;
                        var parentHost = jqLite.data(node, NG_ANIMATE_PIN_DATA);
                        if (parentHost) {
                            parentNode = getDomNode(parentHost);
                        }
                        while (parentNode) {
                            if (!rootNodeDetected) {
                                rootNodeDetected = (parentNode === rootNode);
                            }
                            if (parentNode.nodeType !== ELEMENT_NODE) {
                                break;
                            }
                            var details = activeAnimationsLookup.get(parentNode) || {};
                            if (!parentAnimationDetected) {
                                var parentNodeDisabled = disabledElementsLookup.get(parentNode);
                                if (parentNodeDisabled === true && elementDisabled !== false) {
                                    elementDisabled = true;
                                    break;
                                }
                                else if (parentNodeDisabled === false) {
                                    elementDisabled = false;
                                }
                                parentAnimationDetected = details.structural;
                            }
                            if (isUndefined(animateChildren) || animateChildren === true) {
                                var value = jqLite.data(parentNode, NG_ANIMATE_CHILDREN_DATA);
                                if (isDefined(value)) {
                                    animateChildren = value;
                                }
                            }
                            if (parentAnimationDetected && animateChildren === false)
                                break;
                            if (!bodyNodeDetected) {
                                bodyNodeDetected = (parentNode === bodyNode);
                            }
                            if (bodyNodeDetected && rootNodeDetected) {
                                break;
                            }
                            if (!rootNodeDetected) {
                                parentHost = jqLite.data(parentNode, NG_ANIMATE_PIN_DATA);
                                if (parentHost) {
                                    parentNode = getDomNode(parentHost);
                                    continue;
                                }
                            }
                            parentNode = parentNode.parentNode;
                        }
                        var allowAnimation = (!parentAnimationDetected || animateChildren) && elementDisabled !== true;
                        return allowAnimation && rootNodeDetected && bodyNodeDetected;
                    }
                    function markElementAnimationState(node, state, details) {
                        details = details || {};
                        details.state = state;
                        node.setAttribute(NG_ANIMATE_ATTR_NAME, state);
                        var oldValue = activeAnimationsLookup.get(node);
                        var newValue = oldValue
                            ? extend(oldValue, details)
                            : details;
                        activeAnimationsLookup.set(node, newValue);
                    }
                }];
        }];
    var $$AnimationProvider = ['$animateProvider', function ($animateProvider) {
            var NG_ANIMATE_REF_ATTR = 'ng-animate-ref';
            var drivers = this.drivers = [];
            var RUNNER_STORAGE_KEY = '$$animationRunner';
            function setRunner(element, runner) {
                element.data(RUNNER_STORAGE_KEY, runner);
            }
            function removeRunner(element) {
                element.removeData(RUNNER_STORAGE_KEY);
            }
            function getRunner(element) {
                return element.data(RUNNER_STORAGE_KEY);
            }
            this.$get = ['$$jqLite', '$rootScope', '$injector', '$$AnimateRunner', '$$Map', '$$rAFScheduler',
                function ($$jqLite, $rootScope, $injector, $$AnimateRunner, $$Map, $$rAFScheduler) {
                    var animationQueue = [];
                    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
                    function sortAnimations(animations) {
                        var tree = { children: [] };
                        var i, lookup = new $$Map();
                        for (i = 0; i < animations.length; i++) {
                            var animation = animations[i];
                            lookup.set(animation.domNode, animations[i] = {
                                domNode: animation.domNode,
                                fn: animation.fn,
                                children: []
                            });
                        }
                        for (i = 0; i < animations.length; i++) {
                            processNode(animations[i]);
                        }
                        return flatten(tree);
                        function processNode(entry) {
                            if (entry.processed)
                                return entry;
                            entry.processed = true;
                            var elementNode = entry.domNode;
                            var parentNode = elementNode.parentNode;
                            lookup.set(elementNode, entry);
                            var parentEntry;
                            while (parentNode) {
                                parentEntry = lookup.get(parentNode);
                                if (parentEntry) {
                                    if (!parentEntry.processed) {
                                        parentEntry = processNode(parentEntry);
                                    }
                                    break;
                                }
                                parentNode = parentNode.parentNode;
                            }
                            (parentEntry || tree).children.push(entry);
                            return entry;
                        }
                        function flatten(tree) {
                            var result = [];
                            var queue = [];
                            var i;
                            for (i = 0; i < tree.children.length; i++) {
                                queue.push(tree.children[i]);
                            }
                            var remainingLevelEntries = queue.length;
                            var nextLevelEntries = 0;
                            var row = [];
                            for (i = 0; i < queue.length; i++) {
                                var entry = queue[i];
                                if (remainingLevelEntries <= 0) {
                                    remainingLevelEntries = nextLevelEntries;
                                    nextLevelEntries = 0;
                                    result.push(row);
                                    row = [];
                                }
                                row.push(entry.fn);
                                entry.children.forEach(function (childEntry) {
                                    nextLevelEntries++;
                                    queue.push(childEntry);
                                });
                                remainingLevelEntries--;
                            }
                            if (row.length) {
                                result.push(row);
                            }
                            return result;
                        }
                    }
                    return function (element, event, options) {
                        options = prepareAnimationOptions(options);
                        var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;
                        var runner = new $$AnimateRunner({
                            end: function () { close(); },
                            cancel: function () { close(true); }
                        });
                        if (!drivers.length) {
                            close();
                            return runner;
                        }
                        setRunner(element, runner);
                        var classes = mergeClasses(element.attr('class'), mergeClasses(options.addClass, options.removeClass));
                        var tempClasses = options.tempClasses;
                        if (tempClasses) {
                            classes += ' ' + tempClasses;
                            options.tempClasses = null;
                        }
                        var prepareClassName;
                        if (isStructural) {
                            prepareClassName = 'ng-' + event + PREPARE_CLASS_SUFFIX;
                            $$jqLite.addClass(element, prepareClassName);
                        }
                        animationQueue.push({
                            element: element,
                            classes: classes,
                            event: event,
                            structural: isStructural,
                            options: options,
                            beforeStart: beforeStart,
                            close: close
                        });
                        element.on('$destroy', handleDestroyedElement);
                        if (animationQueue.length > 1)
                            return runner;
                        $rootScope.$$postDigest(function () {
                            var animations = [];
                            forEach(animationQueue, function (entry) {
                                if (getRunner(entry.element)) {
                                    animations.push(entry);
                                }
                                else {
                                    entry.close();
                                }
                            });
                            animationQueue.length = 0;
                            var groupedAnimations = groupAnimations(animations);
                            var toBeSortedAnimations = [];
                            forEach(groupedAnimations, function (animationEntry) {
                                toBeSortedAnimations.push({
                                    domNode: getDomNode(animationEntry.from ? animationEntry.from.element : animationEntry.element),
                                    fn: function triggerAnimationStart() {
                                        animationEntry.beforeStart();
                                        var startAnimationFn, closeFn = animationEntry.close;
                                        var targetElement = animationEntry.anchors
                                            ? (animationEntry.from.element || animationEntry.to.element)
                                            : animationEntry.element;
                                        if (getRunner(targetElement)) {
                                            var operation = invokeFirstDriver(animationEntry);
                                            if (operation) {
                                                startAnimationFn = operation.start;
                                            }
                                        }
                                        if (!startAnimationFn) {
                                            closeFn();
                                        }
                                        else {
                                            var animationRunner = startAnimationFn();
                                            animationRunner.done(function (status) {
                                                closeFn(!status);
                                            });
                                            updateAnimationRunners(animationEntry, animationRunner);
                                        }
                                    }
                                });
                            });
                            $$rAFScheduler(sortAnimations(toBeSortedAnimations));
                        });
                        return runner;
                        function getAnchorNodes(node) {
                            var SELECTOR = '[' + NG_ANIMATE_REF_ATTR + ']';
                            var items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
                                ? [node]
                                : node.querySelectorAll(SELECTOR);
                            var anchors = [];
                            forEach(items, function (node) {
                                var attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
                                if (attr && attr.length) {
                                    anchors.push(node);
                                }
                            });
                            return anchors;
                        }
                        function groupAnimations(animations) {
                            var preparedAnimations = [];
                            var refLookup = {};
                            forEach(animations, function (animation, index) {
                                var element = animation.element;
                                var node = getDomNode(element);
                                var event = animation.event;
                                var enterOrMove = ['enter', 'move'].indexOf(event) >= 0;
                                var anchorNodes = animation.structural ? getAnchorNodes(node) : [];
                                if (anchorNodes.length) {
                                    var direction = enterOrMove ? 'to' : 'from';
                                    forEach(anchorNodes, function (anchor) {
                                        var key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
                                        refLookup[key] = refLookup[key] || {};
                                        refLookup[key][direction] = {
                                            animationID: index,
                                            element: jqLite(anchor)
                                        };
                                    });
                                }
                                else {
                                    preparedAnimations.push(animation);
                                }
                            });
                            var usedIndicesLookup = {};
                            var anchorGroups = {};
                            forEach(refLookup, function (operations, key) {
                                var from = operations.from;
                                var to = operations.to;
                                if (!from || !to) {
                                    var index = from ? from.animationID : to.animationID;
                                    var indexKey = index.toString();
                                    if (!usedIndicesLookup[indexKey]) {
                                        usedIndicesLookup[indexKey] = true;
                                        preparedAnimations.push(animations[index]);
                                    }
                                    return;
                                }
                                var fromAnimation = animations[from.animationID];
                                var toAnimation = animations[to.animationID];
                                var lookupKey = from.animationID.toString();
                                if (!anchorGroups[lookupKey]) {
                                    var group = anchorGroups[lookupKey] = {
                                        structural: true,
                                        beforeStart: function () {
                                            fromAnimation.beforeStart();
                                            toAnimation.beforeStart();
                                        },
                                        close: function () {
                                            fromAnimation.close();
                                            toAnimation.close();
                                        },
                                        classes: cssClassesIntersection(fromAnimation.classes, toAnimation.classes),
                                        from: fromAnimation,
                                        to: toAnimation,
                                        anchors: []
                                    };
                                    if (group.classes.length) {
                                        preparedAnimations.push(group);
                                    }
                                    else {
                                        preparedAnimations.push(fromAnimation);
                                        preparedAnimations.push(toAnimation);
                                    }
                                }
                                anchorGroups[lookupKey].anchors.push({
                                    'out': from.element, 'in': to.element
                                });
                            });
                            return preparedAnimations;
                        }
                        function cssClassesIntersection(a, b) {
                            a = a.split(' ');
                            b = b.split(' ');
                            var matches = [];
                            for (var i = 0; i < a.length; i++) {
                                var aa = a[i];
                                if (aa.substring(0, 3) === 'ng-')
                                    continue;
                                for (var j = 0; j < b.length; j++) {
                                    if (aa === b[j]) {
                                        matches.push(aa);
                                        break;
                                    }
                                }
                            }
                            return matches.join(' ');
                        }
                        function invokeFirstDriver(animationDetails) {
                            for (var i = drivers.length - 1; i >= 0; i--) {
                                var driverName = drivers[i];
                                var factory = $injector.get(driverName);
                                var driver = factory(animationDetails);
                                if (driver) {
                                    return driver;
                                }
                            }
                        }
                        function beforeStart() {
                            element.addClass(NG_ANIMATE_CLASSNAME);
                            if (tempClasses) {
                                $$jqLite.addClass(element, tempClasses);
                            }
                            if (prepareClassName) {
                                $$jqLite.removeClass(element, prepareClassName);
                                prepareClassName = null;
                            }
                        }
                        function updateAnimationRunners(animation, newRunner) {
                            if (animation.from && animation.to) {
                                update(animation.from.element);
                                update(animation.to.element);
                            }
                            else {
                                update(animation.element);
                            }
                            function update(element) {
                                var runner = getRunner(element);
                                if (runner)
                                    runner.setHost(newRunner);
                            }
                        }
                        function handleDestroyedElement() {
                            var runner = getRunner(element);
                            if (runner && (event !== 'leave' || !options.$$domOperationFired)) {
                                runner.end();
                            }
                        }
                        function close(rejected) {
                            element.off('$destroy', handleDestroyedElement);
                            removeRunner(element);
                            applyAnimationClasses(element, options);
                            applyAnimationStyles(element, options);
                            options.domOperation();
                            if (tempClasses) {
                                $$jqLite.removeClass(element, tempClasses);
                            }
                            element.removeClass(NG_ANIMATE_CLASSNAME);
                            runner.complete(!rejected);
                        }
                    };
                }];
        }];
    var ngAnimateSwapDirective = ['$animate', function ($animate) {
            return {
                restrict: 'A',
                transclude: 'element',
                terminal: true,
                priority: 600,
                link: function (scope, $element, attrs, ctrl, $transclude) {
                    var previousElement, previousScope;
                    scope.$watchCollection(attrs.ngAnimateSwap || attrs['for'], function (value) {
                        if (previousElement) {
                            $animate.leave(previousElement);
                        }
                        if (previousScope) {
                            previousScope.$destroy();
                            previousScope = null;
                        }
                        if (value || value === 0) {
                            $transclude(function (clone, childScope) {
                                previousElement = clone;
                                previousScope = childScope;
                                $animate.enter(clone, null, $element);
                            });
                        }
                    });
                }
            };
        }];
    var copy;
    var extend;
    var forEach;
    var isArray;
    var isDefined;
    var isElement;
    var isFunction;
    var isObject;
    var isString;
    var isUndefined;
    var jqLite;
    var noop;
    angular.module('ngAnimate', [], function initAngularHelpers() {
        noop = angular.noop;
        copy = angular.copy;
        extend = angular.extend;
        jqLite = angular.element;
        forEach = angular.forEach;
        isArray = angular.isArray;
        isString = angular.isString;
        isObject = angular.isObject;
        isUndefined = angular.isUndefined;
        isDefined = angular.isDefined;
        isFunction = angular.isFunction;
        isElement = angular.isElement;
    })
        .info({ angularVersion: '1.7.2' })
        .directive('ngAnimateSwap', ngAnimateSwapDirective)
        .directive('ngAnimateChildren', $$AnimateChildrenDirective)
        .factory('$$rAFScheduler', $$rAFSchedulerFactory)
        .provider('$$animateQueue', $$AnimateQueueProvider)
        .provider('$$animation', $$AnimationProvider)
        .provider('$animateCss', $AnimateCssProvider)
        .provider('$$animateCssDriver', $$AnimateCssDriverProvider)
        .provider('$$animateJs', $$AnimateJsProvider)
        .provider('$$animateJsDriver', $$AnimateJsDriverProvider);
})(window, window.angular);

//# sourceMappingURL=../maps/angular-1.7.2/angular-animate.js.map