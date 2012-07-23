/**
 * refrag.js
 * Breathing new life into URL hashes
 * @author Karol Kuczmarski "Xion"
 */


(function($) {
    
    var PREFIX = '^';
    var TAG_SEP = PREFIX;

    var log = function(type_or_msg, msg) {
        var type, message;
        if (typeof msg === 'undefined') {
             type = 'log'; message = type_or_msg;
        }
        else {
             type = type_or_msg; message = msg;
        }
        console[type]("[refrag.js] " + message);
    };

    /** Code invoked on page load **/

    var hashPrefix = '#' + PREFIX;
    var anchor = window.location.hash;
    if (anchor.substr(0, hashPrefix.length) !== hashPrefix)   return;    // no refrag anchor
    anchor = anchor.substr(hashPrefix.length);
 
    log("Anchor `" + anchor + "` found, will redirect...");
    
    $(function() {
        log("Attempting to redirect...");
        anchor = unescape(anchor);

        var am = matchQuery(anchor);
        if (am.$dom) {
            log("Matched '" + am.$dom.nodeName + "' element");
            var $highlighted = highlightText(am.text, am.$dom);
            var scrollTarget = $highlighted || am.$dom;
            scrollTarget.scrollIntoView();
        }
        else {
            log('warn', "No element matching anchor: " + anchor);
        }
    });

    /** Searching for anchor query within HTML document **/

    var matchQuery = (function() {
        /** Searches for a query within HTML document and returns the DOM element that contains it.
            Depending on the phrase's form, it could be an innermost
            DOM element containing given text or a specified DOM element,
            such as header. */

        var QUERY_SEPS_REGEX = new RegExp('\\' + TAG_SEP + '[^\\' + TAG_SEP + ']', 'g');

        var parseQuery = function(query) {
            sepIndex = query.search(QUERY_SEPS_REGEX);
            if (sepIndex < 0)   return { text: query };
            else {
                var tag = query.substring(0, sepIndex);
                var text = query.substring(sepIndex + 1);
                return { tag: tag, text: text };
            }
        };

        var findTextWithinTags = function(text, tag) {
            var elements = document.getElementsByTagName(tag);
            if (!elements)  return null;

            for (var i = 0; i < elements.length; ++i) {
                var $match = findSanitizedTextInDom(text, $(elements[i]));
                if ($match) return $match;
            }
            return null;
        };

        var findSanitizedTextInDom = function(text, $root, isRecursive) {
            var $match = null;

            var domWalker = function(docText) {
                docText = docText || "";
                return function() {
                    if ($match) return false;

                    var $this = $(this);
                    var elemText = sanitizeText($this.textInside());

                    // take care of whitespace at the boundary between
                    // current text and new element
                    if (/\s+$/.test(docText) && /^\s+/.test(elemText))
                        elemText = elemText.replace(/^\s+/, "");    // trim whitespace from start of element text

                    var newDocText = docText + elemText;
                    if (newDocText.indexOf(text) >= 0) {
                        $match = $this;
                        return false;
                    }

                    $.each($this.contents(), domWalker(newDocText));
                };
            };

            $root = $root || $('body');
            $.each($root.contents(), domWalker());
            
            if (!$match) {
                if (isRecursive)  return null;

                // for top-level call of this function,
                // search root element as last resort
                domWalker().apply($root);
                return $match;
            }

            return findSanitizedTextInDom(text, $match, true) || $match;
        };

        return function(query) {
            var q = parseQuery(query);
            q.text = sanitizeText(q.text);
            q.$dom = q.tag ? findTextWithinTags(q.text, q.tag) : findSanitizedTextInDom(q.text);
            return q;
        };
    })();
    

    /** User interaction **/

    var highlightText = (function() {

        var findTextNodes = function($node) {
            /** Retrieves all text nodes contained within given DOM node.
                Returns a list of such nodes in depth-first order
                (that is, the order they should appear on page, assuming position:static). */
            var textNodes = [];

            var elemStack = [];
            elemStack.push($node);
            while (elemStack.length > 0) {
                var $this = $(elemStack.pop());
                if ($this.isText()) textNodes.push($this);
                else {
                    $.each($this.contents(), function() {
                        elemStack.push(this);
                    });
                }
            }

            return textNodes.reverse();
        };

        var findMatchingTextNodes = function($elem, text) {
            /** Retrieves the text nodes (within given DOM node) that contain given text.
                The matching is inexact: it will perform some text coercing/sanitizing before attempting a match.
                Note that first and last element of resulting list
                might contain some extra text as prefix and suffix, respectively.
                @return A list of objects with following properties:
                        - node - A text node
                        - offset - Offset inside text node where the matching fragment of text starts
                                   (can be >0 only for first item)
                        - length - Length of matching fragment of text that lies inside the node
                                   (can be <node.textInside().length only for last item) */
            var elemText = $elem.textInside();
            var elemTextNodes = findTextNodes($elem);
            var offset = fuzzyIndexOf(elemText, text);

            var startNodeIdx, endNodeIdx = -1;
            var lenSum = 0;
            var offsetInStartNode;  // will be useful later

            // find the start node
            for (var i = 0; i < elemTextNodes.length; ++i) {
                var nodeText = elemTextNodes[i].textInside();
                lenSum += nodeText.length;
                if (lenSum >= offset) {
                    startNodeIdx = i;
                    offsetInStartNode = offset - (lenSum - nodeText.length);
                    if (lenSum >= offset + text.length)
                        endNodeIdx = i; // text is contained within single text node
                    break;
                }
            }

            // find the end node
            if (endNodeIdx < 0) 
                for (var i = startNodeIdx + 1; i < elemTextNodes.length; ++i) {
                    var nodeText = elemTextNodes[i].textInside();
                    lenSum += nodeText.length;
                    if (lenSum >= offset + text.length) {
                        endNodeIdx = i;
                        break;
                    }
                }

            // construct result
            lenSum = 0; offset = offsetInStartNode;
            var result = [];
            for (var i = startNodeIdx; i <= endNodeIdx; ++i) {
                var textNode = elemTextNodes[i];

                var item = {node: textNode};
                item.offset = i == startNodeIdx ? offset : 0;
                item.length = i == endNodeIdx ? text.length - (lenSum - offset - 1) : textNode.textInside().length;

                result.push(item);
                lenSum += item.length;
            }

            return result;            
        };

        var injectElementAroundText = function($node, start, end, elemName) {
            /** Injects an element inside given text node.
                The new element surrounds given portion of text, while the rest
                of the text inside node will form new text nodes.  */
            elemName = elemName || 'span';
            
            var nodeText = $node.textInside();
            var text = nodeText.substring(start, end);

            var $textBefore = $(document.createTextNode(nodeText.substring(0, start)));
            var $textAfter = $(document.createTextNode(nodeText.substring(end)));
            var $matchedText = $('<' + elemName + '/>').html(text);

            var $elemWrapper = $('<' + elemName + '/>');
            $elemWrapper.append($textBefore).append($matchedText).append($textAfter);
            $node.replaceWith($elemWrapper);

            return $matchedText;
        };

        var performHighlighting = function($elem) {
            /** Adds highlighting to single element. */
            var color = $elem.css('color');
            var bkgColor = $elem.css('background-color');

            if (color && bkgColor) {
                bkgColor = bkgColor == 'transparent' ? 'white' : bkgColor;
                $elem.css('color', bkgColor);
                $elem.css('background-color', color);
            }
            else {
                $elem.css('background-color', '#ffffbb');
            }
        };
    
        /** Actual highlighting function. */
        return function(text, $elem) {
            var elemsToHighlight = [];

            // for every text node in matched element(s),
            // we inject <span>'s that surround the matched text itself
            // so that we can highlight it
            
            var textNodes;
            if ($elem.isText()) {
                var offset = fuzzyIndexOf($elem.textInside(), text);
                var item = {node: $elem, offset: offset, length: text.length};
                textNodes = [item];
            }
            else textNodes = findMatchingTextNodes($elem, text);

            for (var i = 0; i < textNodes.length; ++i) {
                var item = textNodes[i];
                var start = item.offset, end = item.offset + item.length;
                var $highlightElem = injectElementAroundText(item.node, start, end);
                elemsToHighlight.push($highlightElem);
            }

            for (var idx in elemsToHighlight)
                performHighlighting(elemsToHighlight[idx]);

            return elemsToHighlight.length > 0 ? elemsToHighlight[0] : null;
        };
    })();

    /** Utility functions */

    var fuzzyIndexOf = function(haystack, needle) {
        /** Finds one text (needle) inside another one (haystack)
            using inexact ("fuzzy") matching. Both texts are "sanitized"
            before attempting a match. */
        haystack = sanitizeText(haystack);
        needle = sanitizeText(needle);
        return haystack.indexOf(needle);
    };

    var sanitizeText = function(text) {
        /** Removes some distinguishing features from given text,
            including case and excess whitespace. */
        text = text || "";
        text = text.toLowerCase();

        // collapse sequences of whitespace into single space
        var _s = /\s/;
        var res = "";
        for (var i = 0; i < text.length; ++i) {
            if (_s.test(text[i])) {
                res += " ";
                while (i + 1 < text.length && _s.test(text[i + 1]))
                    ++i;
            }
            else
                res += text[i];
        }

        return res;
    };
})( 
    (function() {

        /** Our own little jQuery **/

        // This our own implementation of something that resembles jQuery, but provides only
        // extremely basic functionality. Most notably, $('selector') returns only first match
        // as (almost) normal DOM object, and works only as delegate to getElementById/querySelector.
        // That is, a $('foo') object is **NOT** an array!
        var my$ = (function() {
            var $ = function(arg) {
            
                var queryDom = function(selector) {
                    if (selector[0] == '#') {
                        var elemId = selector.substring(1);
                        var elem = document.getElementById(elemId);
                        if (!elem)  return null;
                        return wrapDomElement(elem);
                    }

                    if (document.querySelector)
                        return wrapDomElement(document.querySelector(selector));

                    return null;
                };
                var createDom = function(desc) {
                    desc = desc.substr(1, desc.length - 2);
                    if (desc[desc.length - 1] == '/')
                        desc = desc.substr(0, desc.length - 1);

                    var elem = document.createElement(desc);
                    return wrapDomElement(elem);
                };

                var wrapDomElement = function(elem) {
                    // add functions from $.fn
                    for (var key in $.fn) {
                        if ($.fn.hasOwnProperty(key) && typeof elem[key] === 'undefined') {
                            var func = $.fn[key];
                            elem[key] = func;
                        }
                    }

                    elem[0] = elem; // for compatiblility with jQuery $() arrays
                    return elem;
                };

                var addReadyHandler = function(func) {
                    if (window.addEventListener)
                        return window.addEventListener('load', func);
                    else {
                        window.onload = func;
                        return true;
                    }
                };

                if (typeof arg === 'string') {
                    arg = arg.trim();
                    if (arg[0] == '<' && arg[arg.length - 1] == '>')
                        return createDom(arg);
                    return queryDom(arg);
                }
                if (typeof arg === 'function') {
                    return addReadyHandler(arg);
                }
                return wrapDomElement(arg);
            };

            $.fn = (function() {
                // additional functions, bound to objects returned by $()

                var cssStyleToCamelCase = function(style) {
                    /** Utility functions used by .css(). */
                    var styleNameParts = style.split('-');
                    for (var i = 0; i < styleNameParts.length; ++i) {
                        var firstLetter = styleNameParts[i].substring(0, 1)
                        firstLetter = firstLetter[i > 0 ? 'toUpperCase' : 'toLowerCase']();
                        styleNameParts[i] = firstLetter + styleNameParts[i].substring(1);
                    }
                    return styleNameParts.join('');
                };
                
                return {
                    on: function(eventName, handler) {
                        eventName = eventName.toLowerCase();
                        if (this.addEventListener)
                            this.addEventListener(eventName, handler);
                        else
                            this['on' + eventName] = handler;
                        return this;
                    },

                    isText: function() { return this.nodeType == 3; },

                    parent: function() { return $(this.parentNode); },
                    contents: function() { return this.childNodes },

                    html: function(arg) {
                        if (typeof arg !== 'undefined') {
                            this.innerHTML = arg;
                            return this;
                        }
                        return this.innerHTML;
                    },

                    textInside: function() { // text() would conflict with body.text
                        if (this.isText())
                            return this.nodeValue;

                        var res = "";
                        var children = this.childNodes;
                        $.each(children, function() {
                            res += $(this).textInside();
                        });
                        return res;
                    },

                    css: function(style, value) {
                        style = cssStyleToCamelCase(style);
                        if (typeof value !== 'undefined') {
                            this.style[style] = value;
                            return this;
                        }
                        
                        var inlineStyle = this.style[style];
                        if (typeof inlineStyle !== 'undefined')
                            return inlineStyle;

                        if (this.currentStyle)
                            return this.currentStyle[style];    // IE
                        else if (window.getComputedStyle) {
                            var elemStyle = document.defaultView.getComputedStyle(this, null);
                            return elemStyle.getPropertyValue(style);
                        }
                    },

                    offset: function() {
                        var left = top = 0;
                        if (obj.offsetParent) {
                            var obj = this;
                            do {
                                left += obj.offsetLeft;
                                top += obj.offsetTop;
                            } while ( (obj = obj.offsetParent) );
                        }
                        return {left: left, top: top};
                    },

                    scrollIntoView: function(how) {
                        /** Adds scrollIntoView() for DOM elements tha don't support it natively,
                            most notably text nodes, */
                        var obj  = this;
                        while (obj && obj.nodeType != 1)    // 1 is HTML <element/>
                            obj = obj.previousSibling;
                        obj = obj || this.parentNode;
                        if (obj)    $(obj).scrollIntoView(how);
                    },

                    append: function(node) {
                        this.appendChild(node);
                        return this;
                    },

                    replaceWith: function(node) {
                        var parent = this.parentNode;
                        parent.insertBefore(node, this);
                        parent.removeChild(this);
                        return this;
                    },
                };
            })();

            $.each = function(seq, func) {
                for (var idx in seq) {
                    if (seq.hasOwnProperty(idx)) {
                        var elem = seq[idx];
                        var shallContinue = func.apply(elem, [idx, elem, seq]);
                        if (shallContinue === false)    // only explicit 'return false' counts as break
                            break;
                    }
                }
            };

            return $;
        })();

        /** Use actual jQuery (if available) or a replacement library **/
        var jQuery = window['jQuery'];
        if (jQuery) {

            // extend original jQuery with some custom features
            // from our replacement
            return (function($) {

                var fnNames = ['isText', 'textInside', 'scrollIntoView'];
                var fn = {};
                for (var i in fnNames) {
                    var fnName = fnNames[i];
                    fn[fnName] = (function(func) {
                        return function() {
                            var $this = this;
                            if ($this.length > 0) {
                                var my$this = my$($this[0]);
                                return my$this[func].apply(my$this, arguments);
                            }
                        };
                    })(fnName);
                }
                
                $.extend($.fn, fn);
                return $;
            })(jQuery);
        }

        return my$; // fallback to replacement
    })()
);
