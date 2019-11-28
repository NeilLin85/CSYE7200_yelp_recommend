eesy.define(['jquery-private', 'sessionInfo', 'engine-state', 'presentation', 'helpitem-loader',
        'json!hipa', 'utils'], function($, sessionInfo, engineState, presentation, helpitemLoader, hipa, utils) {

    var contextLinkQueue = [];

    $(document).on('helpitemHandle', function(e, opts) {
        handleHelpItem(e.originalEvent.detail, 0);
    });

    return {
        queueContextLink: queueContextLink,
        hasAccessToHelpitem: hasAccessToHelpitem,
        handleQueuedContextLinks: handleQueuedContextLinks
    };



    /*
     * Public functions
     */
    function markHelpitemAsSeen(helpItemId) {
        $.ajax({
            url: sessionInfo.dashboardUrl() + "/rest/public/helpitems/" + helpItemId + "/viewed?sessionkey=" + sessionInfo.sessionKey(),
            type: 'PUT',
            success: function(data){}
        });
    }

    function queueContextLink(cl, mode, triggedby, src) {
        contextLinkQueue.push({
            cl: cl,
            mode: mode,
            triggedby: triggedby,
            src: src
        });
    }

    function handleQueuedContextLinks() {
        var handlingState = {
            hoverHintHandled: false
        };

        $.each(contextLinkQueue, function(i, item) {
           handleContextLink(item.cl, item.mode, item.triggedby, item.src, handlingState);
        });
        contextLinkQueue = [];
    }


    function handleContextLink(cl, mode, triggedby, src, handlingState) {

        var user = (function() {
            return {
                hasHiddenHelpitem: function(helpItemId) {
                    return var_eesy_hiddenHelpItems[helpItemId];
                },
                hasSeenHelpitemThisSession: function(helpItemId, sessionKey) {
                    return var_eesy_helpitemsSeen[helpItemId] === sessionKey;
                },
                hasSeenHelpitemBefore: function(helpItemId) {
                    return var_eesy_helpitemsSeen[helpItemId] !== undefined;
                },
                markHelpitemAsSeenThisSession: function(helpItemId, sessionKey) {
                    if (var_eesy_helpitemsSeen[helpItemId] !== sessionKey) {
                        var_eesy_helpitemsSeen[helpItemId] = sessionKey;
                        markHelpitemAsSeen(helpItemId, sessionKey);
                    }
                }
            };
        } ());

        if (!hasAccessToHelpitem(cl.helpitemid)) {
            return; // no access
        }

        if (user.hasHiddenHelpitem(cl.helpitemid)) {
            return; // user has hidden it
        }

        if (utils.cookieExists("eesyhinthidden_" + cl.helpitemid + "_" + var_key)) {
            return;
        }

        if ($('.eesy_dark').length) {
            return; // some modal is showing
        }

        if (cl.mode === "hint" && mode === 0 && !handlingState.hoverHintHandled) {
            handleHelpItem(cl.helpitemid, mode, triggedby, user);
            handlingState.hoverHintHandled = true;
        } else if (cl.mode === "hint" && mode === 1) {
            handleHelpItem(cl.helpitemid, mode, triggedby, user);
        } else if (cl.mode === "Normal") {
            engineState.foundhelpitems.get().addFoundItem(cl.helpitemid, src);
        } else if (cl.mode === "systray" && !systrayHandled) {
            systrayHandled = true;
            handleHelpItem(cl.helpitemid, mode, triggedby, user);
        } else if (cl.mode === "Proactive" && !popupHandled) {
            if (!user.hasSeenHelpitemThisSession(cl.helpitemid, sessionInfo.sessionKey())) {
                popupHandled = true;
                handleHelpItem(cl.helpitemid, mode, triggedby, user);
            }
        } else if (cl.mode === "Proactive Once" && !popupHandled) {
            if (!user.hasSeenHelpitemBefore(cl.helpitemid)) {
                popupHandled = true;
                handleHelpItem(cl.helpitemid, mode, triggedby, user);
            }
        }
    }

    function hasAccessToHelpitem(helpItemId) {
        var h = hipa['' + helpItemId] || [];
        var s = var_eesy_sac;

        for (var i=0; i<h.length; i++) {
            if (s[h[i]]) {
                if(s[h[i]].enabled) {
                    return true;
                }
            }
        }
        return false;
    }



    /*
     * Private functions
     */
    function handleHelpItem(hid, mode, triggedby, user) {
        helpitemLoader.loadHelpItem(hid, function(hi) {
            hi.embed = fixEesyLinks(hi.embed);

            if (hi.itemtype === "Hint") {
                if (mode === 0) { // Context rule mode 0: By mouse move (normal)
                    if (hi.visible === "true") {
                        presentation.showHint(hi, user);
                    }
                } else if (mode === 1) { // Context rule mode 1: By presence
                    presentation.showHintProactive(hi, triggedby, user);
                }
            } else if (hi.itemtype === "Message") {
                presentation.showPopup(wrapContentBox(hi), user);
            } else if (hi.itemtype === "HtmlCode" || hi.itemtype === "File" || hi.itemtype === "Link" || hi.itemtype === "Recording") {
                presentation.showPopup(hi, user);
            } else if (hi.itemtype === "Systray") {
                presentation.showSystray(hi, user);
            }
        });
    }


    function wrapContentBox(helpItem) {
        return $.extend({}, helpItem, {
            embed: "<div class='eesy-proactive-content-box'>" + helpItem.embed + "</div>"
        });
    }

    function fixEesyLinks(intip) {
        var tip = intip;
        var numchars = "0123456789";

        var idx = tip.indexOf("loadfile:");

        while (idx > -1) {
            var hiid = "";
            if (numchars.indexOf("" + tip.charAt(idx + 9)) > -1) hiid += tip.charAt(idx + 9);
            if (numchars.indexOf("" + tip.charAt(idx + 10)) > -1) hiid += tip.charAt(idx + 10);
            if (numchars.indexOf("" + tip.charAt(idx + 11)) > -1) hiid += tip.charAt(idx + 11);
            if (numchars.indexOf("" + tip.charAt(idx + 12)) > -1) hiid += tip.charAt(idx + 12);
            var opencall = var_loadfile + "?fileid=" + hiid;
            tip = tip.replace("loadfile:" + hiid, opencall);
            idx = tip.indexOf("loadfile:");
        }

        return tip;
    }
});