/**
 * refrag.js
 * Enables linking to arbitrary content on page
 * @author Karol Kuczmarski
 */

// libs: jQuery or jQuip with documentReady


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
            log("Matched element <" + $anchorMatch.get(0).nodeName + ">");
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

                $this.contents().each(domWalker(newDocText));
            };
        };

        $root = $root || $('body');
        $root.contents().each(domWalker());
        
        if (!$match)    return null;
        return searchText(textToFind, $match) || $match;
    };

    // seems to be the same as searchText(), but uses jQuery selector (could be used for testing maybe?)
    var _jqMatchAnchor = function(anchor) {
        var selector = '*:contains(\'' + anchor + '\'):last';
        var $match = $(selector);
        return $match.length > 0 ? $match : null;
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
        var isText = $elem.get(0).nodeName === '#text';
        if (isText) {
            var $span = $('<span/>').text($elem.text());
            $elem.replaceWith($span);
            $elem = $span;
        }
        $elem.css('background-color', 'yellow');
    };

    /** Our own little jQuery **/

    // This our own implementation of something that resembles jQuery,
    // but provides only extremely basic functionality. Most notably,
    // $('selector') returns only first match as normal DOM object,
    // and works only as delegate to getElementsById/querySelector.
    var $ = function(arg) {
        
        var queryDom = function(selector) {
            selector = selector.trim();
            if (selector.length == 0)   return null;

            if (selector[0] == '#') {
                var elemId = selector.substring(1);
                var elems = document.getElementsById(elemId);
                if (!elems || elems.length == 0)    return null;
                return elems[0];
            }
            if (document.querySelector)
                return document.querySelector(selector);

            return null;
        };
        var addReadyHandler = function(func) {
            if (window.addEventListener)
                return window.addEventListener('onload', func);
            else {
                window.onload = func;
                return true;
            }
        };

        if (typeof arg === 'string')    return queryDom(arg);
        if (typeof arg == 'function')   return addReadyHandler(arg);
        return arg;
    };

})(jQuery);
