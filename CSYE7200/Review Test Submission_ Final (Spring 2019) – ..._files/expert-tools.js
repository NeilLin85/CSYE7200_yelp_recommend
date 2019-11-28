eesy.define(['jquery-private', 'sessionInfo', 'utils', 'json!language-cms', 'json!settings-supportcenter'],
    function($, sessionInfo, utils, language, settings) {
  /*
   * Private functions
   */
  function showMenu() {
    $('#contact-menu').css({'opacity' : '1', 'visibility' : 'visible'});
    $('#expert-tool-btn').css({'opacity' : '0', 'visibility' : 'hidden'});
  }
  function hideMenu() {
    $('#contact-menu').css({'opacity' : '0', 'visibility' : 'hidden'});
    $('#expert-tool-btn').css({'opacity' : '1', 'visibility' : 'visible'});
  }
  /*
   * Public functions
   */
  function show() {
	  eesyRequire(['expert-context-definer', 'build_mode'], function(contextDefiner, build_mode) {
		    $.get(var_dashboard_url + "/resources/mustache/cms/expert_tool.html",
		            function(template_expert_tool) {

		          $('body').append(Mustache.to_html(template_expert_tool, {
                      buildModeEnabled: settings.CMS.IN_APP.MENU.BUILD_MODE_ENABLED == true 
                          || settings.CMS.IN_APP.MENU.BUILD_MODE_ENABLED === "TRUE",
                      dashboardurl: sessionInfo.dashboardUrl,
                      LNG: language.LNG
		          }));
		          
		          utils.onClickOrSelectKey('#expert-tool-btn', showMenu);
		          utils.onClickOrSelectKey('#expert-tool-btn-hide', hideMenu);
		          
		          utils.onClickOrSelectKey('#expert-define-context', function() {
		            hideMenu();
		            contextDefiner.show(); 
		          });

		          utils.onClickOrSelectKey('#expert-build-mode', function() {
		              hideMenu();
		              build_mode.start(); 
		          });

		          build_mode.resumeIfActive();
		        });		  
	  });
  
	  

  }
  
  return {
    show: show
  };
});
