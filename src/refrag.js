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
        console.log("[refrag.js] Redirecting...");
        anchor = unescape(anchor);
        
        // TODO: the recursive call could be done better
        var docText = "";
        var found = false;
        var domWalker = function() {
            if (found)  return false;
            var $this = $(this);
            
            var prevDocText = docText;
            var text = $this.text();
            docText += text;
            
            if (docText.indexOf(anchor) >= 0) {
                console.log("[refrag.js] Matched element found: <" +
                            ($this.get(0).nodeName || "(text)") + ">");
                found = true;
                
                $this.css('color', 'red');  // temporary, of course
                $(document).scrollTop($this.scrollTop());
                return false;
            }
            
            docText += text;
            $this.contents().each(domWalker);
            docText = prevDocText;
        };
        
        $('body').contents().each(domWalker);
    });
    
})(jQuery);