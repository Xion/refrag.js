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
            highlightText(anchor, $anchorMatch);
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
                    var children = $this.contents();
                    for (var idx in children)
                        elemStack.push(children[idx]);
                }
            }

            return textNodes;
        };

        var findMatchingTextNodes = function($elem, text) {
            /** Retrieves the text nodes (within given DOM node)
                that contain given text.
                Note that first and last element of resulting list
                might contain some extra text as prefix and suffix, respectively.
                @return A list of objects with following properties:
                        - node - A text node
                        - offset - Offset inside text node where the matching fragment of text starts
                                   (can be >0 only for first item)
                        - length - Length of matching fragment of text that lies inside the node
                                   (can be <node.text().length only for last item) */
            var elemTextNodes = findTextNodes($elem);
            
            var nodeIdx = 0;
            while (nodeIdx < elemTextNodes.length) {
                // build a potential match
                var maybeMatch = "";
                var i = nodeIdx;
                while (i < elemTextNodes.length && maybeMatch.length < text.length) {
                    maybeMatch += elemTextNodes[i];
                    i++;
                }

                var matchIndex = maybeMatch.indexOf(text);
                if (matchIndex >= 0) {
                    // match found, construct result
                    var result = [];
                    var posInText = 0;
                    for (var k = nodeIdx; k < i; ++k) {
                        var textNode = elemTextNodes[k];

                        var item = {node: textNode};
                        item.offset = k == nodeIdx ? matchIndex : 0;
                        item.length = k + 1 == i ? text.length - posInText : textNode.text().length;

                        result.push(item);
                        posInText += item.length;
                    }
                }
                
                // no match - continue from the last text node we considered
                nodeIdx = i;
            }

            return [];
        };

        var injectElementAroundText = function($node, text, elemName) {
            /** Injects an element inside given text node.
                The new element surrounds given text, while the rest
                of the text inside node will form new text nodes.  */
            elemName = elemName || 'span';
            
            var nodeText = $node.text();
            var start = nodeText.indexOf(text);
            var end = start + text.length;

            var $textBefore = $(document.createTextNode(nodeText.substring(0, start)));
            var $textAfter = $(document.createTextNode(nodeText.substring(end)));
            var $matchedText = $('<' + elemName + '/>').html(text);

            var $elemWrapper = $('<' + elemName + '/>');
            $elemWrapper.append($textBefore).append($matchedText).append($textAfter);
            $node.replaceWith($elemWrapper);

            return $matchedText;
        };
    
        /** Actual highlighting function. */
        return function(text, $elem) {
            var elemsToHighlight = [];

            // for every text node in matched element(s),
            // we inject <span>'s that surround the matched text itself
            // so that we can highlight it
            
            var textNodes;
            if ($elem.isText()) {
                var item = {node: $elem,
                            offset: $elem.text().indexOf(text),
                            length: text.length};
                textNodes = [item];
            }
            else textNodes = findMatchingTextNodes($elem, text);

            for (var idx in textNodes) {
                var item = textNodes[idx];
                var highlightText = item.node.text().substr(item.offset, item.length);
                var $highlightElem = injectElementAroundText(item.node, highlightText);
                elemsToHighlight.push($highlightElem);
            }

            for (var idx in elemsToHighlight)
                elemsToHighlight[idx].css('background-color', 'yellow');
        };
    })();

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
                    style = cssStyleToCamelCase(style);
                    if (typeof value !== 'undefined') {
                        this.style[style] = value;
                        return this;
                    }
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
    })()
);