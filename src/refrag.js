/**
 * refrag.js
 * Enables linking to arbitrary page fragments
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

        var $anchorMatch = matchAnchor(anchor);
        if ($anchorMatch) {
            log("Matched element <" + $anchorMatch.prop('nodeName') + ">");
            $(document).scrollTop($anchorMatch.scrollTop());
            $anchorMatch.css('color', 'red'); // temporary, of course
        }
        else {
            log('warn', "No element matching anchor: " + anchor);
        }
    });

    /** Utility functions **/

    var matchAnchor = function(anchor) {
        /** Matches the anchor text, returning
            the innermost DOM element that contains it. */
        var $match = null;
        var domWalker = function(currentDocText) {
            currentDocText = currentDocText || "";
            return function() {
                if ($match) return false;

                var $this = $(this);
                var text = $this.text();
                var docText = currentDocText + text;

                if (docText.indexOf(anchor) >= 0) {
                    $match = $this;
                    return false;
                }

                $this.contents().each(domWalker(docText));
            };
         };

         $('body').contents().each(domWalker());
         return $match;
    };
        
})(jQuery);
