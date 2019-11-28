eesy.define([
      'jquery-private', 'sessionInfo', 'engine-state', 'utils', 'helpitem-loader',
      'context-links', 'mouse','json!settings-supportcenter', 'mustachejs',
      'json!language'
    ],
    function($, sessionInfo,
        engineState, utils, helpitemLoader, contextlinks, mouse, settings, Mustache, language) {

  var hiddenitems = new Object();
  var eesyTimers = [];
  var supportTabAlign = 'right';

  window.addEventListener('previewhelp', function(event) {
      if(event.detail.helpItem.itemtype == "Hint") {
          previewHint(event.detail.helpItem);    
      } else if(event.detail.helpItem.itemtype == "Systray") {
          previewSystray(event.detail.helpItem);    
      } else if(event.detail.helpItem.itemtype == "Message") {
          previewPopup(event.detail.helpItem);    
      } 
      
  }, true);

  window.addEventListener('previewhelphide', function(event) {
      $('#hintcontainer[data-helpitemid="preview"]').remove();
      $('#systraycontainer').remove();
      $('.eesy_dark').remove();
      $('#eesy-dark-screen').remove();
      $('#eesy-standardcontainer').remove();
  
  }, true);

  
  function isHint(elm) {
    return utils.isOrHas(elm, "#hintcontainer");
  }

  function showHintProactive(helpItem, connectTo, user) {
    $("body").after(Mustache.to_html(templates.hintfixed, helpItemModel(helpItem), templates));

    __showHintProactive(helpItem, connectTo, user);
  }

  function __showHintProactive(helpItem, connectTo, user) {
    if (helpItem.id in hiddenitems) {
      $('#systraycontainer_'+helpItem.id).fadeOut('fast');
      $(connectTo).removeClass('eesy-highlighted');
      $('#systraycontainer_'+helpItem.id).remove();
      $('#arrow_'+helpItem.id).remove();
      return;
    }

    $(connectTo).addClass('eesy-highlighted');

    var positions = calcHintPositioning(connectTo, parseInt(helpItem.width), parseInt(helpItem.height));

    // check if space to show the hint
    if (positions.arrowpos == "") {
      $('#arrow_'+helpItem.id).css({'display': 'none'});
      $('#systraycontainer_'+helpItem.id).css({'display': 'none'});
    } else {
      $('#systraycontainer_'+helpItem.id).css({
        'position': 'absolute',
        'height': helpItem.height + 'px',
        'width': helpItem.width + 'px',
        'top': positions.ypos,
        'left': positions.xpos
      });

      $('#arrowInner_'+helpItem.id)
          .removeClass('eesyarrow up down left right')
          .addClass('eesyarrow ' + positions.arrowpos);
  
      $('#arrow_'+helpItem.id).css({
        'position': 'fixed',
        'height': '10px',
        'width': '10px',
        'top': positions.arrowpostop,
        'left': positions.arrowposleft,
        'z-index' : 100002
      });

      if (utils.isTargetVisible(positions.target, connectTo)) {
        $('#arrow_'+helpItem.id).show();
        $('#systraycontainer_'+helpItem.id).show();
        user && user.markHelpitemAsSeenThisSession(helpItem.id, var_key);
      } else {
        $('#arrow_'+helpItem.id).hide();
        $('#systraycontainer_'+helpItem.id).hide();
      }
    }
    
    eesyTimers["TipPresentMode"+helpItem.id] = setTimeout(function() {
      __showHintProactive(helpItem, connectTo, user);
    }, 250);
  }

  function calcHintPositioning(connectTo, hintWidth, hintHeight) {
    var arrowpos = "";

    var target = {
        left: $(connectTo).offset().left,
        top: $(connectTo).offset().top,
        width: $(connectTo).width(),
        height: $(connectTo).height()
    };

    var tt = {
      width: hintWidth,
      height: hintHeight
    };

    var ttCentered = {
      left: target.left + (target.width - tt.width) / 2,
      top: target.top + (target.height - tt.height) / 2
    };

    var space = {
      below: (target.top + target.height + tt.height + 10) < $(window).scrollTop() + $(window).height(),
      above: (target.top - tt.height - 10) > $(window).scrollTop(),
      right: (target.left + target.width + tt.width + 10) < $(window).scrollLeft() + $(window).width(),
      left: (target.left - tt.width - 10) > $(window).scrollLeft()
    };

    var canCenter = {
      x: (ttCentered.left >= 0)
        && ((ttCentered.left + tt.width) < $("body").width())
        && (space.below || space.above),
      y: (ttCentered.top >= 0)
        && ((ttCentered.top + tt.height) < $("body").height())
        && (space.left || space.right)
    };

    var xpos = 0;
    var ypos = 0;

    if (canCenter.x) {
      xpos = ttCentered.left;

      if (space.below) {
        arrowpos = "up";
        ypos = target.top + target.height + 10;
      } else {
        arrowpos = "down";
        ypos = target.top - tt.height - 11;
      }
    } else if (canCenter.y) {
      ypos = ttCentered.top;

      if (space.right) {
        arrowpos = "right";
        xpos = target.left + target.width + 10;
      } else {
        arrowpos = "left";
        xpos = target.left - tt.width - 12;
      }
    } else {
      if (space.below && space.right) {
        arrowpos = "up";
        xpos = target.left < 0 ? 0 : target.left;
        ypos = target.top + target.height + 10;
      } else if (space.below && space.left) {
        arrowpos = "up";
        xpos = (target.left + target.width > $("body").width() ? $("body").width()
            : target.left + target.width) - tt.width;
        ypos = target.top + target.height + 10;
      } else if (space.above && space.right) {
        arrowpos = "down";
        xpos = target.left < 0 ? 0 : target.left;
        ypos = target.top - tt.height - 11;
      } else if (space.above && space.left) {
        arrowpos = "down";
        xpos = (target.left + target.width > $("body").width() ? $("body").width()
            : target.left + target.width) - tt.width;
        ypos = target.top - tt.height - 11;
      }
    }


    // check if space to show the hint
    if (arrowpos == "right") {
      arrowposleft = target.left + target.width + 1;
      arrowpostop = target.top + target.height / 2;
    } else if (arrowpos == "left") {
      arrowposleft = target.left - 11;
      arrowpostop = target.top + target.height / 2;
    } else if (arrowpos == "up") {
      arrowposleft = target.left + target.width / 2 - 10;
      arrowpostop = target.top + target.height;
    } else if (arrowpos == "down") {
      arrowposleft = target.left + target.width / 2 - 10;
      arrowpostop = target.top;
    }

    if (arrowpos != "") {
      arrowpostop -= 10 + $(window).scrollTop();
      arrowposleft -= $(window).scrollLeft();
    }

    return {
      arrowpos: arrowpos,
      arrowpostop: arrowpostop,
      arrowposleft: arrowposleft,
      xpos: xpos,
      ypos: ypos,
      target: target
    }
  }


  function positionSystray(helpItem) {
    if (!($('#systraycontainer').length)) return;
    if ($('#systraycontainer').data("helpitemid") != helpItem.id) return;

    var bottomPos = var_tab_version == 2 ? 88 : 20; // Adjust bottom if tab v2

    if (attemptUnobscure) {
      traypos = {
        left: ($("body").width()-20)-helpItem.width,
        right: $("body").width()-20,
        top: ($(window).height()-20)-helpItem.height,
        bottom: $(window).height()-bottomPos
      };

      do {
        var obscuringStuff = false;

        $('input').each(function() {
          if (utils.intersectRect(traypos, utils.rectangleOf($(this)))) {
            obscuringStuff = true;

            // nudge left
            traypos.left -= 50;
            traypos.right -= 50;
          }
        });
      } while (obscuringStuff && traypos.right > 0);

      $('#systraycontainer').css({
        'position': 'fixed',
        'height': (traypos.bottom-traypos.top)+'px',
        'width': (traypos.right-traypos.left)+'px',
        'top': traypos.top,
        'left': traypos.left
      });
    } else {
      $('#systraycontainer').css({
        'position': 'fixed',
        'height': helpItem.height + 'px',
        'width': helpItem.width + 'px',
        'bottom': bottomPos + 'px',
        'right': '20px'
      });
    }

    eesyTimers["positionSystray" + helpItem.id] = setTimeout(function() {
      positionSystray(helpItem);
    }, 1000);
  }
  
  function positionTab() {
    if (var_tab_version != 1) return;

    try {
      if ($('#eesy-tab-inner').height() > 0) { // dont position if the image is not loaded yet
        if (supportTabAlign == 'right') {
          try {
            var adjustScrollbar = false;

            adjustScrollbar = adjustScrollbar ||
                ($("#globalNavPageContentArea").get(0).scrollHeight > $("#globalNavPageContentArea").height());

            if (adjustScrollbar) {
              $('#eesy-tab-inner').css('right', scrollbarRightAdjust);
            } else {
              $('#eesy-tab-inner').css('right','0px');
            }

          } catch(e) {
            $('#eesy-tab-inner').css('right','0px');
          }
        }

        $('#eesy-tab-inner').css('margin-top', '-' + ($('#eesy-tab-inner').height() / 2) + 'px');
        $("#eesy-tab-inner").css("display", "inline-block");
      }
    } finally {
      setTimeout(function() {
        positionTab();
      }, 500);
    }
  }

  function updateTabLocker(drawMinimized) {
    var flip = supportTabAlign == 'left';

    var minimizedCode = flip ? 8676 : 8677;
    var maximizedCode = flip ? 8677 : 8676;

    var characterCode = drawMinimized ? minimizedCode : maximizedCode;

    $('#tab-locker').css('background-image',
        'url(//' + $('#eesy-tab-inner').data('host') + '/generateIcon.jsp'
            + '?color=' + encodeURIComponent($('#eesy-tab-inner').data('fg-color'))
            + '&size='+$('#eesy-tab-inner-img').width()
            + '&char='+characterCode+')');
  }

  function RemovePresentationMode(helpitemId){
    for (var ii = 0; ii < contextlinks.length; ii++ ) {
      if (contextlinks[ii].helpitemid == helpitemId) {
        contextlinks[ii].mode = "none";
      }
    }
  }

  function updateHelpitemVote(hid, answer) {
    helpitemLoader.loadHelpItem(hid, function(hi) {
      hi.voting.votedUp = answer;
      hi.voting.votedDown = !answer;
    });
  } 

  function hideHelpitem(hid) {
    if (confirm(language.LNG.PROACTIVE.CONFIRM_HIDE_MESSAGE)) {
      var_eesy_hiddenHelpItems[hid] = true;

      var url = sessionInfo.dashboardUrl() + "/Scripts/HelpitemHide.jsp?helpitemid=" + hid
              + "&key=" + sessionInfo.sessionKey() + "&callback=jsonHideHelpitem";

      $.ajax({
        type: 'GET',
        url: url,
        async: true,
        jsonpCallback: 'jsonHideHelpitem',
        contentType: "application/json",
        dataType: 'jsonp',
        success: function(json) {
          helpitemLoader.loadHelpItem(hid, function(hi) {
            hi.visible = "false";
          });
        }
      });
    }
  }

  function hideAndFade(selector, element) {
    hideHelpitem($(selector).data("helpitemid"));
    $(element).parents(".eesy_container").fadeOut('fast');
    $(element).parents(".eesy_container").remove();
  }
      
  function stopEesyTimers() {
    for (var eesyTimer in eesyTimers) {
      clearTimeout(eesyTimers[eesyTimer]);
    }
    
    eesyTimers = [];
  }

  function helpItemModel(helpItem) {
    return {
        LNG: language.LNG,
        var_dashboard_url: var_dashboard_url,
        var_proactive_lms: var_proactive_lms,
        helpItem: helpItem,
        isLoggedIn: !!var_key
    };
  }

  function showHint(helpItem, user) {
    $("body").append(Mustache.to_html(templates.hint, helpItemModel(helpItem), templates));

    var xpos = mouse.x + 20;
    if ((xpos + parseInt(helpItem.width)) > $("body").width()) {
        xpos = mouse.x - 20 - helpItem.width;
    }

    var ypos = mouse.y + 20;
    if ((ypos + parseInt(helpItem.height)) > $("body").height()) {
        ypos = mouse.y - 20 - helpItem.height;
    }

    $('#hintcontainer[data-helpitemid="' + helpItem.id + '"]').css({
      'position': 'absolute',
      'height': helpItem.height+'px',
      'width': helpItem.width+'px',
      'top': ypos,
      'left': xpos
    }).fadeIn('fast');

    user && user.markHelpitemAsSeenThisSession(helpItem.id, var_key)
  }

  function previewHint(helpItem) {
      $('#hintcontainer[data-helpitemid="preview"]').remove();
      $("body").append(Mustache.to_html(templates.hint, helpItemModel(helpItem), templates));

      $('#hintcontainer[data-helpitemid="preview"]').css({
        'position': 'fixed',
        'height': helpItem.height+'px',
        'width': helpItem.width+'px',
        'top': '100px',
        'right': '440px'
      }).show();
  }
  
  function previewSystray(helpItem) {
      $('#systraycontainer').remove();

      $("body").append(Mustache.to_html(templates.systray, helpItemModel(helpItem), templates));

      $('#systraycontainer').css({
          'position': 'fixed',
          'height': helpItem.height + 'px',
          'width': helpItem.width + 'px',
          'bottom': '22px',
          'right': '440px'
      });

      $("#systraycontainer").show();
  }

  function previewPopup(helpItem) {
      $('.eesy_dark').remove();
    
      $("body").append(Mustache.to_html(templates.standard, helpItemModel(helpItem), templates));
      $('#eesy-dark-screen').show();
      $('#eesy-standardcontainer').show();
  }

  
  
  function hideHint(){
    $("#hintcontainer").remove();
  }
  
  function showPopup(helpItem, user) {
    $('.eesy_dark').remove();

    if (settings.SUPPORTCENTER.USEFORMESSAGES && var_proactive_version < 3) {
      launchSupportTab(helpItem.id);
    } else {
      $("body").append(Mustache.to_html(templates.standard, helpItemModel(helpItem), templates));
      $('#eesy-dark-screen').fadeIn('fast');
      $('#eesy-standardcontainer').fadeIn('fast');
    }
    
    user && user.markHelpitemAsSeenThisSession(helpItem.id, var_key);
  }

  function showSystray(helpItem, user) {
    if ($('#systraycontainer').length) {
      if ($('#systraycontainer').data("helpitemid") == helpItem.id) {
        return;
      } else {
        $('#systraycontainer').remove();
      }
    }

    if (utils.cookieExists("eesysystrayhidden_" + helpItem.id + "_" + var_key)) return;

    $("body").append(Mustache.to_html(templates.systray, helpItemModel(helpItem), templates));

    positionSystray(helpItem);

    $("#systraycontainer").fadeIn('slow');
    
    user && user.markHelpitemAsSeenThisSession(helpItem.id, var_key);
  }

  function showSupportTab() {	   
    $("body").append({ 
      1: templates.dashboardlinker, 
      2: Mustache.to_html(templates.dashboardlinker2, language)
    }[var_tab_version]);
    
    helpAvailableNotify();
    positionTab();

    //scrollbar adjustment ZD
    if ( $('.patient-bar-container__content').length ) {
      function scrollAdjust() {
        var adjustScrollbarZd =
           ($(".patient-bar-container__content").get(0).scrollHeight > $(".patient-bar-container__content").height());

        $('.eesy-tab2-container').css('right', adjustScrollbarZd ? scrollbarRightAdjust : '0px');
            window.setTimeout(scrollAdjust, 1000);
      }

      scrollAdjust();
    }
    //End of scrollbar adjustment ZD
	
    if (var_moveable_tab === true) {
      if (supportTabPosition !== null) {
        $('#eesy-tab-inner').css({ 'top' : supportTabPosition + 'px' });

        if (!utils.isInViewport($('#eesy-tab-inner'))) {
          $('#eesy-tab-inner').css({'top' : ''});
        }
      }

      $('.eesy-tab2-btn-handle').removeClass('eesyHidden');

      function startMove(e) {
        $('#eesy-tab-inner').addClass('eesy_draggable').parents()
          .on('mousemove touchmove', dragButton)
          .on('mouseup touchcancel touchend', stopMove);
      }

      function dragButton(e) {
        var minY = supportTabMoveLimit; // the top limit
        if (e.type == 'touchmove') {
          var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
          var posY = touch.pageY;
        } else {
          var posY = e.pageY;
        }
        var maxY = posY - supportTabMoveLimit; // the bottom limit

        $('.eesy_draggable').offset({
            top: Math.max(Math.min(posY - $('.eesy_draggable').outerHeight() / 2, maxY), minY)
        });
        e.preventDefault();
      }

      function stopMove() {
        var currentTabPosition = $('#eesy-tab-inner').position();

        $('.eesy_draggable').removeClass('eesy_draggable');
        $.get(var_dashboard_url + "/restapi/service.jsp?u=sessionkey&p=" + var_key
            + "&userUpdate=setPosition&top=" + currentTabPosition.top);
      }

      $('body')
        .on('mousedown', '.eesy-tab2-btn-handle', startMove)
        .on('touchstart', '#eesy-tab-inner', startMove);
    }
  }

  function helpAvailableNotify() {
    if (!($('#eesy-tab-inner').length)) return;

    var numHelpItems = 0;

    if (engineState.foundhelpitems.get().getFoundItemsString() != "") {
      numHelpItems = engineState.foundhelpitems.get().getFoundItemsString().split(",").length;
    }

    var tabData = function(key) { return $('#eesy-tab-inner').data(key) };

    if (var_tab_version == 1) {
      var host = tabData('host');
      var backBorder = parseInt(tabData('bottom-width')) > 0;
      var borderRadius = tabData('border-radius').substring(0, 1);
      var fgColor = encodeURIComponent(tabData('fg-color'));
      var bgColor = encodeURIComponent(tabData('bg-color'));
      supportTabAlign = tabData('align');

      var align = supportTabAlign.toUpperCase();
  
      var borderColor = tabData('border-style') == 'none'
          ? bgColor
          : encodeURIComponent(tabData('border-color'));

      var imageUrl = "//" + host + "/support_tab_image.jsp?"
          + "backBorder=" + backBorder
          + "&borderRadius=" + borderRadius
          + "&borderColor=" + borderColor
          + "&fgColor=" + fgColor
          + "&bgColor=" + bgColor
          + "&align=" + supportTabAlign.toUpperCase()
          + "&numItems=" + numHelpItems
          + "&language=" + var_language
          + "&extraHeightTop=" + ($('#eesy-tab-inner').data('hideable') ? 20 : 0)
          + "&styleChecksum=" + var_eesy_style_checksum;

      $('#eesy-tab-inner-img').one("load", function() {
          var width = $(this).width();
          var height = $(this).height();

          var maximizedWidth = eesy_maximizedTabWidth || (width + "px");

          $('#eesy-tab-inner')
              .css('width', "" + (supportTabMinimized ? eesy_minimizedTabWidth : maximizedWidth))
              .css('height', "" + height + "px")
              .css('background-position', supportTabAlign == 'left' ? 'right' : 'left');

          if ($('#eesy-tab-inner').data('hideable')) {
              $('#tab-locker')
                  .css('display', 'block')
                  .css('height', width + 'px');

              updateTabLocker(supportTabMinimized);
          }
      });

      $('#eesy-tab-inner').css('background-image', 'url(' + imageUrl + ')');
      $('#eesy-tab-inner-img').attr('src', imageUrl);
      $("#eesy-tab-inner").css(supportTabAlign, "0px");
    }
  }
  
  // install global launch listener
  window.addEventListener('eesy_launchSupportTab', function() {
    launchSupportTab();
  }, true);
  
  function launchSupportTab(hid) {
    dashu = "";

    eesyRequire( 
        ['supportCenter'], 
        function(supportCenter) {          

      var cid = "&cid=-1";
      if (!(typeof eesy_course_id === 'undefined')) {
          cid = "&cid=" + eesy_course_id;
      }
    
    
      if (engineState.foundhelpitems.get().getFoundItemsString() == "") {
          dashu = var_dashboard_url + "/index.jsp?u=sessionkey&p=" + var_key + cid;
      } else {
          dashu = var_dashboard_url + "/index.jsp?u=sessionkey&p=" 
              + var_key + "&page=helpitems&method=CSI&input=" 
              + engineState.foundhelpitems.get().getFoundItemsString() 
              + cid;
      }
    
      var url = var_dashboard_url + "/restapi/service.jsp";
  
      function reportSupportTabClick(async) {
    	if (hid == undefined) {  
          $.ajax(url, {
            async: async,
            data: {
              u: 'sessionkey',
              p: var_key,
              userUpdate: 'addSessionEvent',
              event_name: 'SUPPORT_TAB_TRIGGERED',
              event_data: JSON.stringify({ url: document.location.href, coursePk1: window.eesy_course_id })
            }
          });
    	}
      }
    
      if (var_open_dashboard_in_new_window) {
        reportSupportTabClick(false);
        window.open(dashu,"","width=1280,height=800,scrollbars=yes,resizable=yes,menubar=no");
      } else {
        reportSupportTabClick(true);
        
        dashu = var_dashboard_url + "/index.jsp?u=sessionkey&p=" 
            + var_key + "&page=style_v2/index&method=CSI&input=" 
            + engineState.foundhelpitems.get().getFoundItemsString() 
            + cid;    
        
        supportCenter.show(
            engineState.foundhelpitems.get().getFoundItemsString(), 
            engineState.foundNodes.get().getFoundItemsString(), 
            hid);
      }
    });
  }

  
  /*
   * event listeners
   */
  $(document).ready(function() {

    utils.onClickOrSelectKey('.eesy_hint_close', function(e, localThis, element) {
      var helpitemId = $(localThis).closest(".eesy_container").data("helpitemid");
      if (var_proactive_version > 2 && $('#hintcontainer[data-helpitemid="' + helpitemId + '"] .eesy_hide_switch input').is(':checked')) {
        hideAndFade($(localThis).parents('#hintcontainer'), element);  
      }
      document.cookie = "eesyhinthidden_" + $('#hintcontainer').data("helpitemid") + "_" + var_key + "=true; path=/;";
      $(localThis).parents(".eesy_container").fadeOut('fast');
      $(localThis).parents(".eesy_container").remove();
    });


    utils.onClickOrSelectKey('.eesy_close', function(e, localThis, element) {
      var helpitemId = $(localThis).closest(".eesy_container").data("helpitemid");
      if (var_proactive_version > 2 && $('#eesy-standardcontainer[data-helpitemid="' + helpitemId + '"] .eesy_hide_switch input').is(':checked')) {
        hideAndFade($(localThis).parents('#eesy-standardcontainer'), element);  
      }
      RemovePresentationMode($('#eesy-standardcontainer').data("helpitemid"));
      $(localThis).parents(".eesy_container").fadeOut('fast');
      $('.eesy_dark').fadeOut('fast');
      $(localThis).parents(".eesy_container").remove();
      $('.eesy_dark').remove();
      $('body').removeClass('eesy_modal_open');
      $(document).trigger("presentation.hide.item");
      popupHandled = false;
    });
    
    utils.onClickOrSelectKey('.eesy_systray_close', function(e, localThis) {
      var mode = $(localThis).closest(".eesy_container").data("mode");
      var helpitemId = $(localThis).closest(".eesy_container").data("helpitemid");
      
      if (var_proactive_version > 2 && $('.eesy_container[data-helpitemid="' + helpitemId + '"] .eesy_hide_switch input').is(':checked')) {
        hiddenitems[helpitemId] = 1;
        hideHelpitem(helpitemId);
      }

      if (mode == "present") {
        hiddenitems[helpitemId] = 1;
      } else {
        RemovePresentationMode(helpitemId);
        $('#systraycontainer').fadeOut('fast');
        $('#systraycontainer').remove();
      }
    });
    
    utils.onClickOrSelectKey('#hintcontainer .eesy_hint_hide', function(e, element) {
      hideAndFade('#hintcontainer', element);      
    });
    
    utils.onClickOrSelectKey('.eesy_systray_hide', function(e, element) {
      hideAndFade('#systraycontainer', element)
    });
    
    utils.onClickOrSelectKey('.eesy_standard_hide', function(e, element) {
      hideAndFade('#eesy-standardcontainer', element);
      
      $('.eesy_dark').fadeOut('fast');
      $('.eesy_dark').remove();
      $(document).trigger("presentation.hide.item");
    });
    
    utils.onClickOrSelectKey('.eesy_hintfixed_dontshowanymore', function(e, localThis) {
      hiddenitems[$(localThis).parents(".eesy_container").data("helpitemid")] = 1;
      hideHelpitem($(localThis).parents(".eesy_container").data("helpitemid"));
    });
    
    utils.onClickOrSelectKey('.quick-survey__answer_Sup', function(e, element) {
      var button = element;
      var answer = $(button).data('answer');
      var hid;
      $(button).addClass("isSelected").siblings('.quick-survey__answer_Sup').removeClass("isSelected");
      if (!answer) {
    	$(".layout__main .thanks").addClass("hideThanks");
    	$(".layout__main .__explain-downvoting").removeClass("hideQuestion");   	
      	hid = $(button).data('helpitemId');
      	$('.form__submit_Sup').data("hid", hid);	
      }
      else {
    	$(".layout__main .__explain-downvoting").addClass("hideQuestion");    
      	hid = $(button).data('helpitemId');
      	timeStamp = utils.createStamp();
        var data = {sessionkey: var_key, isUp: answer, timeStamp: timeStamp, reason: ""}; 
        $.post(var_dashboard_url + "/rest/helpitems/" + hid + "/votes?sessionkey=" + var_key, data, function() {            
          updateHelpitemVote(hid, answer);             
        });
      }
    }); 
    
    utils.onClickOrSelectKey('.form__submit_Sup', function(e, element) {
      timeStamp = utils.createStamp();
      tempReason = $(".layout__main .__explain-downvoting .quick-survey__textarea").val();
      var data = {sessionKey: var_key, isUp: false, timeStamp: timeStamp, reason: tempReason};  
      tempHid = $('.form__submit_Sup').data("hid");
      button = element;
      $(".layout__main .__explain-downvoting").addClass("hideQuestion");
      $(".layout__main .thanks").removeClass("hideThanks");       
      $.post(var_dashboard_url + "/rest/helpitems/" + tempHid + "/votes?sessionkey=" + var_key, data, function() {            
        updateHelpitemVote(tempHid, false);             
      });     	
    });
    
    utils.onClickOrSelectKey('.__explain-downvoting .form__submit', function(e, element) {
      timeStamp = utils.createStamp();
      tempReason = $(element).parent().find(".quick-survey__textarea").val();
      var data = {sessionKey: var_key, isUp: false, timeStamp: timeStamp, reason: tempReason};  
      tempHid = $('.form__submit').data("hid");
    
      $(element).closest(".quick-survey-section").children(".thanks").removeClass("hideThanks");
      $(element).parent().addClass("hideQuestion"); 
      $.post(var_dashboard_url + "/rest/helpitems/" + tempHid + "/votes?sessionkey=" + var_key, data, function() {            
        updateHelpitemVote(tempHid, false);             
      });     	
    });
    
    // click on one of the voting up/down buttons
    utils.onClickOrSelectKey('.quick-survey__answer', function(e, element) { 
      var button = element;
      var answer = $(button).data('answer');
      var hid;
      $(button).addClass("isSelected").siblings('.quick-survey__answer').removeClass("isSelected");
      if (!answer) {
    	$(button).closest(".quick-survey-section").children(".__explain-downvoting").removeClass("hideQuestion");
    	$(button).closest(".quick-survey-section").children(".thanks").addClass("hideThanks");
    	hid = $(button).data('helpitemId');
    	$('.form__submit').data("hid", hid);
      }
      else {
    	$(button).closest(".quick-survey-section").children(".__explain-downvoting").addClass("hideQuestion");
    	$(button).closest(".quick-survey-section").children(".thanks").removeClass("hideThanks");
    	hid = $(button).data('helpitemId');
    	timeStamp = utils.createStamp();
        var data = {sessionkey: var_key, isUp: answer, timeStamp: timeStamp, reason: ""}; 
        $.post(var_dashboard_url + "/rest/helpitems/" + hid + "/votes?sessionkey=" + var_key, data, function() {            
          updateHelpitemVote(hid, answer);             
        });
      }
    });    
     
    $(document).on('click', '#eesy-tab-inner', function(e) {
      if (!$('#eesy-tab-inner').hasClass('eesy_draggable')){
      	launchSupportTab();
      	utils.focusElement("#supportCenterMainHeading", 500);
    	}
    });
    
    $(document).on('keypress', '#eesy-tab-inner', function(e) {
        var code = e.keyCode || e.which;
        if (code === 13) {
          launchSupportTab();  
          utils.focusElement("#supportCenterMainHeading", 500);
        }
      });
    
    // TODO can we replace these handlers entirely with css pseudo class selectors? (":hover" etc)
    $(document).on("mouseenter focus", "#eesy-tab-inner", function(e) {
      $('#eesy-tab-inner').addClass("___TabIsFocused");
    });
    
    $(document).on("mouseleave blur", "#eesy-tab-inner", function(e) {
      $('#eesy-tab-inner').removeClass("___TabIsFocused");
    });
    
    $(document).on('mouseenter', '#tab-locker', function(e) {
      updateTabLocker(!supportTabMinimized);
    });
    
    $(document).on('mouseleave', '#tab-locker', function(e) {
      updateTabLocker(supportTabMinimized);
    });
    
    $(document).on('click', '#tab-locker', function(e) {
      if ($('#eesy-tab-inner').data('hideable')) {
        supportTabMinimized = !supportTabMinimized;
        updateTabLocker(supportTabMinimized);
        
        var maximizedWidth = eesy_maximizedTabWidth || ($('#eesy-tab-inner-img').width() + "px");
        
        $('#eesy-tab-inner').animate({'width': "" + (supportTabMinimized ? eesy_minimizedTabWidth : maximizedWidth)});
        $.get(var_dashboard_url + "/restapi/service.jsp?u=sessionkey&p=" + var_key
            + "&userUpdate=setMinimized&minimized=" + (supportTabMinimized ? 1 : 0));
        
        return false;
      }
    });
  });
  
  return {
    stopEesyTimers: stopEesyTimers,
    showHint: showHint,
    showHintProactive: showHintProactive,
    showPopup: showPopup,
    showSystray: showSystray,
    showSupportTab: showSupportTab,
    helpAvailableNotify: helpAvailableNotify,
    hideHint: hideHint,
    isHint: isHint
  };
});

