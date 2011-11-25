/**
 * refrag.js
 * Enables linking to arbitrary content on page
 * @author Karol Kuczmarski
 */


(function($) {
    
    var PREFIX = '^';

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

        var $anchorMatch = searchText(anchor);
        if ($anchorMatch) {
            log("Matched element <" + $anchorMatch.nodeName + ">");
            $anchorMatch.scrollIntoView();
            highlightElement($anchorMatch);
        }
        else {
            log('warn', "No element matching anchor: " + anchor);
        }
    });

    /** Searching for text within HTML document **/

    var searchText = function(text, $root) {
        /** Matches the given text, returning
            the innermost DOM element that contains it. */
        var $match = null;
        var domWalker = function(docText) {
            docText = docText || "";
            return function() {
                if ($match) return false;

                var $this = $(this);
                var elemText = $this.text();
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
        
        if (!$match)    return null;
        return searchText(text, $match) || $match;
    };

    /** User interaction **/

    var scrollToElement = function($elem) {
        // correcting for cases where $elem.offset().top returns 0
        // even though it shouldn't (e.g.: text DOM nodes)
        var top = $elem.offset().top, parentTop;
        $elem = $elem.parent();
        while ((parentTop = $elem.offset().top) >= top) {
            top = parentTop;
            $elem = $elem.parent();
        }

        $(window).scrollTop(top);
    };

    var highlightElement = function($elem) {
        var isText = $elem.nodeName === '#text';
        // if (isText) {
        //     var $span = $('<span/>').html($elem.text());
        //     $elem.replaceWith($span);   // this is probably complex to implement...
        //     $elem = $span;
        // }
        $elem.css('background-color', 'yellow');
    };

})(

    /** Our own little jQuery **/

    // This our own implementation of something that resembles jQuery, but provides only
    // extremely basic functionality. Most notably, $('selector') returns only first match
    // as (almost) normal DOM object, and works only as delegate to getElementById/querySelector.
    // That is, a $('foo') object is **NOT** an array!
    (function() {
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
                desc = desc.substring(1, desc.length - 2);
                if (desc[desc.length - 1] == '/')
                    desc = desc.substring(0, desc.length - 1);

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
            
            return {
                isText: function() { return this.nodeType == 3; },
                contents: function() { return this.childNodes },

                html: function(arg) {
                    if (typeof arg !== 'undefined')
                        this.innerHTML = arg;
                    return this.innerHTML;
                },

                text: function() {
                    if (this.isText())  return this.nodeValue;

                    var res = "";
                    var children = this.childNodes;
                    $.each(children, function() {
                        res += $(this).text();
                    });
                    return res;
                },

                css: function(style, value) {
                    if (typeof value !== 'undefined')
                        this.style[style] = value;
                    return this.style[style];
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
    })()
);