eesy.define(['jquery-private', 'condition-matcher', 'json!context-rule-data', ], function($, conditionMatcher, contextRuleData) {
  var contextrules = [];

  $.each(contextRuleData, function(i, contextRule) {
	try {
		var rule = new ContextRule(contextRule.id, contextRule.pattern, contextRule.mode);
	    contextrules.push(rule);
	} catch(err) {
	   console.log("error parsing rule: " + JSON.stringify(contextRule));
	}
  });
  
  return contextrules;
  
  
  function RemoveCP(s){
    return s.replace("CP_","");
  }
  
  function getTailSelector(s) {
    return /.*?>([^ ].*)/.exec(s)[1].trim().replace(/\s+/g, ' ');
  }
  
  function Tag(name, val, mt) {
    this.tagName = name.toUpperCase();
    this.tagValue = this.tagName == "CHILDSELECTOR" ? getTailSelector(removeLineFeeds(val)) : RemoveCP(val.toUpperCase());
    this.tagMatchType = mt.toUpperCase();
  }
  
  function Tags (s) {
    this.FTags = new Array();
  
    var w = s.split("{;}");
    for (var spi = 0; spi < w.length; spi++ ) {
      var w2 = w[spi].split("{MT}");
     
      if (w2.length == 1) {
        var t = w2[0].split("{-}");
        this.FTags[this.FTags.length] = new Tag(t[0],t[1],'C');
      } else {
        var t2 = w2[1].split("{-}");
        this.FTags[this.FTags.length] = new Tag(t2[0],t2[1],w2[0]);
      }
    }
    
    this.compareToElement = function(element) {
      for (var cti = 0; cti < this.FTags.length; cti++ ) {
        var rulePart = this.FTags[cti];
      
        if (rulePart.tagName == "CHILDSELECTOR") {
          var l = $(element).find(rulePart.tagValue).length;
        
          if (l == 0) return false;
        } else {
          var val;
          
          if (rulePart.tagName == "TAG") { // ("tagName" is more like "rule type")
            val = $(element).prop('tagName');
          } else if (rulePart.tagName == "INNERHTML" && $(element).children().length == 0) {
            val = $(element).html();
          } else {
            val = $(element).attr(rulePart.tagName);
          }
        
          if (("a" + val + "b") == "aundefinedb") return false;
          
          val = RemoveCP(val.toUpperCase());
          
          if (rulePart.tagMatchType == "C" && val.indexOf(rulePart.tagValue) == -1) return false;
          if (rulePart.tagMatchType == "E" && rulePart.tagValue != val) return false;
        }
      }
    
      return true;
    }
  }
  
  function removeLineFeeds(s) {
    return s.replace(/[\r\n]/gm,"");  
  }
  
  function pageConditionMismatch(condition, iurl) {
    if (condition.type === "url_contains") {
      return iurl.toUpperCase().indexOf(condition.value.toUpperCase()) === -1;
    }
    
    if (condition.type === "body_contains_child") {
      return $('body').find(condition.value).length === 0;
    }
    
    return false;
  }
  
  function ContextRule (id,rec,mode) {
    rec = decodeURIComponent(rec);
  
    this.id = id;
    this.recognition = rec;
    this.mode = mode;
    
    this.possibleMatchingElements = function() {
      if (this.json) {
        var result = $('*');
        
        this.json.conditions.forEach(function(condition) {
          if (condition.type === 'is' || condition.type === 'element_tag') {
            result = result.filter(condition.value);
          }
        });
        
        return result;
      } else {
        return $(this.tags.FTags[0].tagValue);
      }
    }
    
    if (rec.charAt(0) === '{') {

      /*
       * The following chunk is for implementing the JSON contexts, detected by a starting '{'
       */

      this.json = JSON.parse(rec);
      this.tags = {"json": this.json};

      this.tags.compareToElement = function(element) {
        return !this.json.conditions.find(function(condition) {
          if (condition.type === 'url_contains') {
            return false; // handled elsewhere
          }

          return !conditionMatcher.conditionMatches(undefined, element, condition);
        });
      };

      this.compareUrl = function(iurl) {
        return !this.json.conditions.find(function(condition) {
          return pageConditionMismatch(condition, iurl);
        });
      };

      this.isGlobal = function() {
        return !!this.json.conditions.find(function(condition) {
          return condition.type === "url_contains";
        });
      };
    } else {

      /*
       * Below is the 'classic' context parsing
       */

      var parts = rec.split("{urlend}");
      var urlparts = parts[0].split("{url}");


      this.urlMatchType = urlparts[0];
      if (this.urlMatchType == "M") {
          this.url = urlparts[1].split("{-}");
          for (var cti = 0; cti < this.url.length; cti++) {
              this.url[cti] = RemoveCP(this.url[cti].toUpperCase());
          }
      } else {
          this.url = urlparts[1];
          this.url = RemoveCP(this.url.toUpperCase());
      }

      this.tags = new Tags(parts[1]);

      this.isGlobal = function() {
       return this.urlMatchType == "N";
      };

      this.compareUrl = function(iurl) {
        var res = false;
        if(this.urlMatchType == "M") {
          res = true;
          for (var cti = 0; cti < this.url.length; cti++ ) {
            if(RemoveCP(iurl.toUpperCase()).indexOf(this.url[cti]) == -1) {
              res = false;
            }
          }
        }
        else if(this.urlMatchType == "C") {
          if(RemoveCP(iurl.toUpperCase()).indexOf(this.url) >= 0) {
            res = true;
          }
        }
        else if(this.urlMatchType == "E") {
          if(this.url == RemoveCP(iurl.toUpperCase()) ) {
            res = true;
          }
        }
        else if(this.urlMatchType == "N") {
          res = true;
        }
        return res;
      };

    }

  }
  
});