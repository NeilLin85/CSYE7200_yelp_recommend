eesy.define(['jquery-private', 'context-probe', 'context-handling', 'monitor-handling', 
        'events-urlchange', 'events-domchange','events-iframe', 'engine-state', 'keep-alive', 'presentation', 
        'found-items-handler', 'mouse', 'expert-tools'],
    function($, ctxProbe, ctxHandling, monitorHandling, 
        eventsUrlChange, eventsDOMChange, eventsIframe, engineState, keepAlive, presentation,
        foundItemsHandler, mouse, expertTools) {
                
  return {
    start: start
  };
  
  function inBuildMode() {
      return window.sessionStorage.build_mode && window.sessionStorage.build_mode == "true"; 
  }
          
  function start() {
    engineState.foundNodes.set(foundItemsHandler.create());
    engineState.foundhelpitems.set(foundItemsHandler.create());

    var lookuptimer;

    $(document).ready(function() {
      if (var_show_tab) {
        presentation.showSupportTab();
      }

      if (var_isExpert) {
        expertTools.show();
      }

      if(!inBuildMode()) {
          ProbeForHelp(getDocumentLocation(document.location.href),$('body'));
          ProbeForNodes(getDocumentLocation(document.location.href),$('body'));
      }

      $(document).mousemove(function(e) {
          if(inBuildMode())
              return true;
          handleMouseMove(getDocumentLocation(document.location.href), e);
          return true;
      });

      monitorHandling.checkMonitorCookies();
      
      if(!inBuildMode())
        ctxProbe.probeForMonitor(getDocumentLocation(document.location.href),$('body'));

      $(document).mouseup(function(e) {
          if(inBuildMode())
              return true;
          
          ctxProbe.probeForMonitor(getDocumentLocation(document.location.href), e.target);
          return true;
      });

      var inUrl = getDocumentLocation(document.location.href);
      
      if(!inBuildMode()) {
          ctxProbe.probeForPresentContexts(inUrl, 
                  ctxHandling.withUrl(inUrl).handlePresentContext);

              ctxHandling.handleQueuedContextLinks();
      }
          

      //
      //  listening for iframe events
      //
      $(document).on("iframe.mousemove", function(e, href) {
        if(inBuildMode())
            return true;
          
        handleMouseMove(href, e);
        return true;
      });

      $(document).on("iframe.mouseup", function(e, href) {
        if(inBuildMode())
            return true;
  
        ctxProbe.probeForMonitor(href, e.target);
        return true;
      });
      $(document).on("iframe.focus", function(e, ifrm) {
        if(inBuildMode())
            return true;
  
        ctxProbe.probeForMonitor(getDocumentLocation(document.location.href), ifrm);
        return true;
      });

      $(document).on("iframe.added", function(e, ifrm) {
        if(inBuildMode())
             return true;
  
        ProbeForHelp(ifrm.location.href, $(ifrm).find('body'));
        ProbeForNodes(ifrm.location.href, $(ifrm).find('body'));
        ctxProbe.probeForMonitor(ifrm.location.href, $(ifrm).find('body'));
        return true;
      });
      $(document).on("iframe.srcremoved", function(e, href) {
        if(inBuildMode())
            return true;
  
        engineState.foundhelpitems.get().removeFoundItemsWithSource(href);
        engineState.foundNodes.get().removeFoundItemsWithSource(href);
        presentation.helpAvailableNotify();
        monitorHandling.clearTokens();
        return true;
      });
      
      //
      // Listening for presentation events
      //
      $(document).on("presentation.hide.item", function(e) {
        if(inBuildMode())
            return true;
  
        ProbeForHelp(getDocumentLocation(document.location.href), $('body'));            
      });

      eventsIframe.start();


      //
      // listening for url changes
      //
      $(window).on('urlchanged', eesy_reloadContext);
//      $(window).on('domchanged', eesy_reloadContext);

      eventsUrlChange.start();
      eventsDOMChange.start();
      

      keepAlive.start();
    });
    
    
    function timedLookup() {
      if(!mouse.hintmode) {
        presentation.hideHint();
          ProbeForHelp(mouse.lasturl, mouse.lastelement);
      }
    }

    function handleMouseMove(inurl, e) {
      mouse.x = e.pageX;
      mouse.y = e.pageY;

      if (e.target != mouse.lastelement) {
        clearTimeout(lookuptimer);
        mouse.lastelement = e.target;
        mouse.lasturl = inurl;

        mouse.hintmode = presentation.isHint(e.target);
        if (!mouse.hintmode) {
          if ($("#hintcontainer").length > 0) {
            lookuptimer = setTimeout(timedLookup, 1000);
          } else {
            lookuptimer = setTimeout(timedLookup, 10);
          }
        }
      }
    }
    
    function getDocumentLocation(defurl) {
      if (defurl.toUpperCase().indexOf("LAUNCHLINK") > -1) {
        if ($("#eesy_realurl").length) {
          return decodeURIComponent($("#eesy_realurl").html());
        }
      }
      return defurl;
    }
    
    function ProbeForHelp(inurl, element) {
      systrayHandled = false;
    
      ctxProbe.eesy_traversePathForMatchingContexts(inurl, element, 0, function(contextRule) {
        ctxHandling.withUrl(inurl).handleContextLinks(contextRule, element, 0);
      });

      ctxHandling.handleQueuedContextLinks();
    }
    
    function ProbeForNodes(inurl, element) {
      ctxProbe.eesy_traversePathForMatchingContexts(inurl, element, 0, function(contextRule) {      
        $.each(ctxProbe.connectedContextNodeLinks(contextRule), function(i, nodeLink) {
          engineState.foundNodes.get().addFoundItem(nodeLink.nodeId, inurl);
        });
      });
    }
    
    function eesy_reloadContext() {
      if($(".eesy__modal-scope").length > 0)
          return;
        
      presentation.stopEesyTimers();
      $('.eesy_container').remove();
      $('.eesy-highlighted').removeClass('eesy-highlighted');
  
      // TODO remove visible help items (popups etc)
      engineState.foundhelpitems.get().clearFoundItems();
      engineState.foundNodes.get().clearFoundItems();
  
      ProbeForHelp(getDocumentLocation(document.location.href), $('body'));
      ProbeForNodes(getDocumentLocation(document.location.href), $('body'));
      ctxProbe.probeForMonitor(getDocumentLocation(document.location.href),$('body'));    
  
      var inUrl = getDocumentLocation(document.location.href);
    
      ctxProbe.probeForPresentContexts(inUrl, 
          ctxHandling.withUrl(inUrl).handlePresentContext);

      ctxHandling.handleQueuedContextLinks();
    };
  } //main end
});
