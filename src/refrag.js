/**
 * refrag.js
 * Enables linking to arbitrary page fragments
 * @author Karol Kuczmarski
 */

// libs: jQuery or jQuip with documentReady


(function($) {
    
    var PREFIX = '^';
    
    var anchor = window.location.hash;
    if (anchor.substr(1, PREFIX.length) != PREFIX)   return;    // no refrag anchor
    anchor = anchor.substr(1 + PREFIX.length);
 
    console.log("[refrag.js] Anchor " + anchor + " found, will redirect...");
    
    $(function() {
        console.log("[refrag.js] Attempting to redirect...");
        anchor = unescape(anchor);

        var $anchorMatch = (function() {
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
        })();

        if ($anchorMatch) {
            console.log("[refrag.js] Matched element <" + $anchorMatch.prop('nodeName') + ">");
            $(document).scrollTop($anchorMatch.scrollTop());
            $anchorMatch.css('color', 'red'); // temporary, of course
        }
        else {
            console.log("[refrag.js] No element matching anchor: " + anchor);
        }

    });
        
})(jQuery);
