define([
	"jquery"
],

function() {
	var CSSHelpers = {};

	CSSHelpers.center = function(element,zoom) {
	    element.css("position","absolute");

	    var top = (($(window).height()/zoom) / 2) - (element.outerHeight() / 2),
	    	left = (($(window).width()/zoom) / 2) - (element.outerWidth() / 2);

	    if (top < 0) top = 0;
	    if (left < 0) left = 0;

	    element.css("top", top);
	    element.css("left", left);
	};

	CSSHelpers.setZoom = function(element,zoom) {
	  	element.css("zoom", zoom);
	};

	return CSSHelpers;
});