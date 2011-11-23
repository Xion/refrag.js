/**
 * refrag.js
 * Enables linking to arbitrary page fragments
 * @author Karol Kuczmarski
 */

// libs: jQuip with documentReady


(function($) {
    
    var PREFIX = '^';
    
    var anchor = window.location.hash;
    if (anchor.substr(1, PREFIX.length) != PREFIX)   return;    // no refrag anchor
    anchor = anchor.substr(1 + PREFIX.length);
 
    console.log("[refrag.js] Anchor " + anchor + " found, will redirect...");
    
    $.ready(function() {
        console.log("[refrag.js] Redirecting...");
        anchor = unescape(anchor);
        
        var docElems = [];
        var docText = "";
        $(document).contents().each(function() {
            var $this = $(this);
            console.log($this.name);
        });
    });
    
})(jQuery);