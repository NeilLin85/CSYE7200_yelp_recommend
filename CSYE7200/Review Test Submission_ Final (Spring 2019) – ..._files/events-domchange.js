eesy.define(['jquery-private'], function($) {
    var observer;
    var timer = undefined;
    var paused = true;
    
    
    function unpause() {
        setTimeout(function() {
            paused = false;
        }, 3000);
    }
    /*
     * Public functions
     */

    function start() {
        observer = new MutationObserver(function(mutationsList, observer) {
            clearTimeout(timer);
            
            if(!paused) {
                timer = setTimeout(function() {
                    paused = true;
                    $(document).trigger("domchanged");
                    unpause();
                }, 1000);
            }
            
        });
        observer.observe(document.getElementsByTagName("BODY")[0], { childList: true, subtree: true });
        unpause();
    }
  
  return {
    start: start
  };
});