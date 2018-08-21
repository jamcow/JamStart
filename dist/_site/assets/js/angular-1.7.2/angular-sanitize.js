(function (window, angular) {
    'use strict';
    var $sanitizeMinErr = angular.$$minErr('$sanitize');
    var bind;
    var extend;
    var forEach;
    var isArray;
    var isDefined;
    var lowercase;
    var noop;
    var nodeContains;
    var htmlParser;
    var htmlSanitizeWriter;
    function $SanitizeProvider() {
        var hasBeenInstantiated = false;
        var svgEnabled = false;
        this.$get = ['$$sanitizeUri', function ($$sanitizeUri) {
                hasBeenInstantiated = true;
                if (svgEnabled) {
                    extend(validElements, svgElements);
                }
                return function (html) {
                    var buf = [];
                    htmlParser(html, htmlSanitizeWriter(buf, function (uri, isImage) {
                        return !/^unsafe:/.test($$sanitizeUri(uri, isImage));
                    }));
                    return buf.join('');
                };
            }];
        this.enableSvg = function (enableSvg) {
            if (isDefined(enableSvg)) {
                svgEnabled = enableSvg;
                return this;
            }
            else {
                return svgEnabled;
            }
        };
        this.addValidElements = function (elements) {
            if (!hasBeenInstantiated) {
                if (isArray(elements)) {
                    elements = { htmlElements: elements };
                }
                addElementsTo(svgElements, elements.svgElements);
                addElementsTo(voidElements, elements.htmlVoidElements);
                addElementsTo(validElements, elements.htmlVoidElements);
                addElementsTo(validElements, elements.htmlElements);
            }
            return this;
        };
        this.addValidAttrs = function (attrs) {
            if (!hasBeenInstantiated) {
                extend(validAttrs, arrayToMap(attrs, true));
            }
            return this;
        };
        bind = angular.bind;
        extend = angular.extend;
        forEach = angular.forEach;
        isArray = angular.isArray;
        isDefined = angular.isDefined;
        lowercase = angular.$$lowercase;
        noop = angular.noop;
        htmlParser = htmlParserImpl;
        htmlSanitizeWriter = htmlSanitizeWriterImpl;
        nodeContains = window.Node.prototype.contains || function (arg) {
            return !!(this.compareDocumentPosition(arg) & 16);
        };
        var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;
        var voidElements = stringToMap('area,br,col,hr,img,wbr');
        var optionalEndTagBlockElements = stringToMap('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr'), optionalEndTagInlineElements = stringToMap('rp,rt'), optionalEndTagElements = extend({}, optionalEndTagInlineElements, optionalEndTagBlockElements);
        var blockElements = extend({}, optionalEndTagBlockElements, stringToMap('address,article,' +
            'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
            'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul'));
        var inlineElements = extend({}, optionalEndTagInlineElements, stringToMap('a,abbr,acronym,b,' +
            'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' +
            'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));
        var svgElements = stringToMap('circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,' +
            'hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,' +
            'radialGradient,rect,stop,svg,switch,text,title,tspan');
        var blockedElements = stringToMap('script,style');
        var validElements = extend({}, voidElements, blockElements, inlineElements, optionalEndTagElements);
        var uriAttrs = stringToMap('background,cite,href,longdesc,src,xlink:href,xml:base');
        var htmlAttrs = stringToMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
            'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
            'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
            'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
            'valign,value,vspace,width');
        var svgAttrs = stringToMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
            'baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,' +
            'cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,' +
            'font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,' +
            'height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,' +
            'marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,' +
            'max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,' +
            'path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,' +
            'requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,' +
            'stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,' +
            'stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,' +
            'stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,' +
            'underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,' +
            'width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,' +
            'xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan', true);
        var validAttrs = extend({}, uriAttrs, svgAttrs, htmlAttrs);
        function stringToMap(str, lowercaseKeys) {
            return arrayToMap(str.split(','), lowercaseKeys);
        }
        function arrayToMap(items, lowercaseKeys) {
            var obj = {}, i;
            for (i = 0; i < items.length; i++) {
                obj[lowercaseKeys ? lowercase(items[i]) : items[i]] = true;
            }
            return obj;
        }
        function addElementsTo(elementsMap, newElements) {
            if (newElements && newElements.length) {
                extend(elementsMap, arrayToMap(newElements));
            }
        }
        var getInertBodyElement = (function (window, document) {
            var inertDocument;
            if (document && document.implementation) {
                inertDocument = document.implementation.createHTMLDocument('inert');
            }
            else {
                throw $sanitizeMinErr('noinert', 'Can\'t create an inert html document');
            }
            var inertBodyElement = (inertDocument.documentElement || inertDocument.getDocumentElement()).querySelector('body');
            inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
            if (!inertBodyElement.querySelector('svg')) {
                return getInertBodyElement_XHR;
            }
            else {
                inertBodyElement.innerHTML = '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
                if (inertBodyElement.querySelector('svg img')) {
                    return getInertBodyElement_DOMParser;
                }
                else {
                    return getInertBodyElement_InertDocument;
                }
            }
            function getInertBodyElement_XHR(html) {
                html = '<remove></remove>' + html;
                try {
                    html = encodeURI(html);
                }
                catch (e) {
                    return undefined;
                }
                var xhr = new window.XMLHttpRequest();
                xhr.responseType = 'document';
                xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
                xhr.send(null);
                var body = xhr.response.body;
                body.firstChild.remove();
                return body;
            }
            function getInertBodyElement_DOMParser(html) {
                html = '<remove></remove>' + html;
                try {
                    var body = new window.DOMParser().parseFromString(html, 'text/html').body;
                    body.firstChild.remove();
                    return body;
                }
                catch (e) {
                    return undefined;
                }
            }
            function getInertBodyElement_InertDocument(html) {
                inertBodyElement.innerHTML = html;
                if (document.documentMode) {
                    stripCustomNsAttrs(inertBodyElement);
                }
                return inertBodyElement;
            }
        })(window, window.document);
        function htmlParserImpl(html, handler) {
            if (html === null || html === undefined) {
                html = '';
            }
            else if (typeof html !== 'string') {
                html = '' + html;
            }
            var inertBodyElement = getInertBodyElement(html);
            if (!inertBodyElement)
                return '';
            var mXSSAttempts = 5;
            do {
                if (mXSSAttempts === 0) {
                    throw $sanitizeMinErr('uinput', 'Failed to sanitize html because the input is unstable');
                }
                mXSSAttempts--;
                html = inertBodyElement.innerHTML;
                inertBodyElement = getInertBodyElement(html);
            } while (html !== inertBodyElement.innerHTML);
            var node = inertBodyElement.firstChild;
            while (node) {
                switch (node.nodeType) {
                    case 1:
                        handler.start(node.nodeName.toLowerCase(), attrToMap(node.attributes));
                        break;
                    case 3:
                        handler.chars(node.textContent);
                        break;
                }
                var nextNode;
                if (!(nextNode = node.firstChild)) {
                    if (node.nodeType === 1) {
                        handler.end(node.nodeName.toLowerCase());
                    }
                    nextNode = getNonDescendant('nextSibling', node);
                    if (!nextNode) {
                        while (nextNode == null) {
                            node = getNonDescendant('parentNode', node);
                            if (node === inertBodyElement)
                                break;
                            nextNode = getNonDescendant('nextSibling', node);
                            if (node.nodeType === 1) {
                                handler.end(node.nodeName.toLowerCase());
                            }
                        }
                    }
                }
                node = nextNode;
            }
            while ((node = inertBodyElement.firstChild)) {
                inertBodyElement.removeChild(node);
            }
        }
        function attrToMap(attrs) {
            var map = {};
            for (var i = 0, ii = attrs.length; i < ii; i++) {
                var attr = attrs[i];
                map[attr.name] = attr.value;
            }
            return map;
        }
        function encodeEntities(value) {
            return value.
                replace(/&/g, '&amp;').
                replace(SURROGATE_PAIR_REGEXP, function (value) {
                var hi = value.charCodeAt(0);
                var low = value.charCodeAt(1);
                return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
            }).
                replace(NON_ALPHANUMERIC_REGEXP, function (value) {
                return '&#' + value.charCodeAt(0) + ';';
            }).
                replace(/</g, '&lt;').
                replace(/>/g, '&gt;');
        }
        function htmlSanitizeWriterImpl(buf, uriValidator) {
            var ignoreCurrentElement = false;
            var out = bind(buf, buf.push);
            return {
                start: function (tag, attrs) {
                    tag = lowercase(tag);
                    if (!ignoreCurrentElement && blockedElements[tag]) {
                        ignoreCurrentElement = tag;
                    }
                    if (!ignoreCurrentElement && validElements[tag] === true) {
                        out('<');
                        out(tag);
                        forEach(attrs, function (value, key) {
                            var lkey = lowercase(key);
                            var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
                            if (validAttrs[lkey] === true &&
                                (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
                                out(' ');
                                out(key);
                                out('="');
                                out(encodeEntities(value));
                                out('"');
                            }
                        });
                        out('>');
                    }
                },
                end: function (tag) {
                    tag = lowercase(tag);
                    if (!ignoreCurrentElement && validElements[tag] === true && voidElements[tag] !== true) {
                        out('</');
                        out(tag);
                        out('>');
                    }
                    if (tag == ignoreCurrentElement) {
                        ignoreCurrentElement = false;
                    }
                },
                chars: function (chars) {
                    if (!ignoreCurrentElement) {
                        out(encodeEntities(chars));
                    }
                }
            };
        }
        function stripCustomNsAttrs(node) {
            while (node) {
                if (node.nodeType === window.Node.ELEMENT_NODE) {
                    var attrs = node.attributes;
                    for (var i = 0, l = attrs.length; i < l; i++) {
                        var attrNode = attrs[i];
                        var attrName = attrNode.name.toLowerCase();
                        if (attrName === 'xmlns:ns1' || attrName.lastIndexOf('ns1:', 0) === 0) {
                            node.removeAttributeNode(attrNode);
                            i--;
                            l--;
                        }
                    }
                }
                var nextNode = node.firstChild;
                if (nextNode) {
                    stripCustomNsAttrs(nextNode);
                }
                node = getNonDescendant('nextSibling', node);
            }
        }
        function getNonDescendant(propName, node) {
            var nextNode = node[propName];
            if (nextNode && nodeContains.call(node, nextNode)) {
                throw $sanitizeMinErr('elclob', 'Failed to sanitize html because the element is clobbered: {0}', node.outerHTML || node.outerText);
            }
            return nextNode;
        }
    }
    function sanitizeText(chars) {
        var buf = [];
        var writer = htmlSanitizeWriter(buf, noop);
        writer.chars(chars);
        return buf.join('');
    }
    angular.module('ngSanitize', [])
        .provider('$sanitize', $SanitizeProvider)
        .info({ angularVersion: '1.7.2' });
    angular.module('ngSanitize').filter('linky', ['$sanitize', function ($sanitize) {
            var LINKY_URL_REGEXP = /((s?ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i, MAILTO_REGEXP = /^mailto:/i;
            var linkyMinErr = angular.$$minErr('linky');
            var isDefined = angular.isDefined;
            var isFunction = angular.isFunction;
            var isObject = angular.isObject;
            var isString = angular.isString;
            return function (text, target, attributes) {
                if (text == null || text === '')
                    return text;
                if (!isString(text))
                    throw linkyMinErr('notstring', 'Expected string but received: {0}', text);
                var attributesFn = isFunction(attributes) ? attributes :
                    isObject(attributes) ? function getAttributesObject() { return attributes; } :
                        function getEmptyAttributesObject() { return {}; };
                var match;
                var raw = text;
                var html = [];
                var url;
                var i;
                while ((match = raw.match(LINKY_URL_REGEXP))) {
                    url = match[0];
                    if (!match[2] && !match[4]) {
                        url = (match[3] ? 'http://' : 'mailto:') + url;
                    }
                    i = match.index;
                    addText(raw.substr(0, i));
                    addLink(url, match[0].replace(MAILTO_REGEXP, ''));
                    raw = raw.substring(i + match[0].length);
                }
                addText(raw);
                return $sanitize(html.join(''));
                function addText(text) {
                    if (!text) {
                        return;
                    }
                    html.push(sanitizeText(text));
                }
                function addLink(url, text) {
                    var key, linkAttributes = attributesFn(url);
                    html.push('<a ');
                    for (key in linkAttributes) {
                        html.push(key + '="' + linkAttributes[key] + '" ');
                    }
                    if (isDefined(target) && !('target' in linkAttributes)) {
                        html.push('target="', target, '" ');
                    }
                    html.push('href="', url.replace(/"/g, '&quot;'), '">');
                    addText(text);
                    html.push('</a>');
                }
            };
        }]);
})(window, window.angular);

//# sourceMappingURL=../maps/angular-1.7.2/angular-sanitize.js.map
