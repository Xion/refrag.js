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
            scrollToElement($anchorMatch);
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
        return searchText(textToFind, $match) || $match;
    };

    /** User interaction **/

    var scrollToElement = function($elem) {
        // correcting for cases where $elem.offset().top returns 0
        //even though it shouldn't (e.g.: text DOM nodes)
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
        if (isText) {
            var $span = $('<span/>').html($elem.text());
            $elem.replaceWith($span);   // this is probably complex to implement...
            $elem = $span;
        }
        $elem.css('background-color', 'yellow');
    };

})(

    /** Our own little jQuery **/

    // This our own implementation of something that resembles jQuery, but provides only
    // extremely basic functionality. Most notably, $('selector') returns only first match
    // as (almost) normal DOM object, and works only as delegate to getElementsById/querySelector.
    // That is, a $('foo') object is **NOT** an array!
    (function() {
        var $ = function(arg) {
        
            var queryDom = function(selector) {
                if (selector[0] == '#') {
                    var elemId = selector.substring(1);
                    var elems = document.getElementsById(elemId);
                    if (!elems || elems.length == 0)    return null;
                    return wrapDomElement(elems[0]);
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
                    if ($.fn.hasOwnProperty(key) && !elem[key]) {
                        var func = $.fn[key];
                        elem[key] = func;
                    }
                }
            };

            var addReadyHandler = function(func) {
                if (window.addEventListener)
                    return window.addEventListener('onload', func);
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
            if (typeof arg == 'function') {
                return addReadyHandler(arg);
            }
            return wrapDomElement(arg);
        };

        $.fn = (function() {
            // additional functions, bound to objects returned by $()
            
            return {
                html: function(arg) {
                    if (typeof arg !== 'undefined')
                        this.innerHTML = arg;
                    return this.innerHTML;
                },

                text: function() {
                    var res = "";
                    var children = 
                    $.each(this.childNodes, function() {
                        var isText = this.nodeName === '#text';
                        res += isText ? this.nodeText : $(this).text();
                    });
                    return res;
                },

                contents: function() { return this.childNodes },

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

                css: function(style, value) {
                    if (typeof value !== 'undefined')
                        this.style[style] = value;
                    return this.style[style];
                },
            };
        })();

        $.each = function(seq, func) {
            for (var idx in seq) {
                if (seq.hasOwnProperty(idx)) {
                    var elem = seq[idx];
                    var shallContinue = func.apply(elem, [idx, elem, seq]);
                    if (!shallContinue) break;
                }
            }
        };

        return $;
    })()
);