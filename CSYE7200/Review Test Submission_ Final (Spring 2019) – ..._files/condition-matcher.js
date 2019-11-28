eesy.define(['jquery'], function($) {

    function conditionMatches(url, element, condition) {
        if (condition.type === 'element_tag') {
            return $(element).prop("tagName").toUpperCase() === condition.value.toUpperCase();
        }

        if (condition.type === 'url_contains') {
            return url.indexOf(condition.value) !== -1;
        }

        if (condition.type === 'is') {
            return $(element).is(condition.value);
        }

        if (condition.type === 'has_parent') {
            return $(element).parents(condition.value).length > 0;
        }

        if (condition.type === 'contains_child') {
            return $(element).find(condition.value).length > 0;
        }

        if (condition.type === 'body_contains_child') {
            return $("body").find(condition.value).length > 0;
        }

        if (condition.type === 'text_contains') {
            return $(element).html().indexOf(condition.value.trim())
        }

        if (condition.type === 'text_equals') {
            return $(element).html().trim() === condition.value.trim()
        }

        if (window.console) console.log('Unimplemented condition type: "' + condition.type + '"');
        return false;
    }

    return {
        conditionMatches: conditionMatches
    }
});
