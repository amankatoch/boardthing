/*
 * JavaScript Load Image iOS scaling fixes 1.0.3
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * iOS image scaling fixes based on
 * https://github.com/stomita/ios-imagefile-megapixel
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, bitwise: true */
/*global define, window, document */
(function(e){"use strict";if(typeof define==="function"&&define.amd){define(["loadimage"],e)}else{e(window.loadImage)}})(function(e){"use strict";if(!window.navigator||!window.navigator.platform||!/iP(hone|od|ad)/.test(window.navigator.platform)){return}var t=e.renderImageToCanvas;e.detectSubsampling=function(e){var t,n;if(e.width*e.height>1024*1024){t=document.createElement("canvas");t.width=t.height=1;n=t.getContext("2d");n.drawImage(e,-e.width+1,0);return n.getImageData(0,0,1,1).data[3]===0}return false};e.detectVerticalSquash=function(e,t){var n=e.naturalHeight||e.height,r=document.createElement("canvas"),i=r.getContext("2d"),s,o,u,a,f;if(t){n/=2}r.width=1;r.height=n;i.drawImage(e,0,0);s=i.getImageData(0,0,1,n).data;o=0;u=n;a=n;while(a>o){f=s[(a-1)*4+3];if(f===0){u=a}else{o=a}a=u+o>>1}return a/n||1};e.renderImageToCanvas=function(n,r,i,s,o,u,a,f,l,c){if(r._type==="image/jpeg"){var h=n.getContext("2d"),p=document.createElement("canvas"),d=1024,v=p.getContext("2d"),m,g,y,b;p.width=d;p.height=d;h.save();m=e.detectSubsampling(r);if(m){i/=2;s/=2;o/=2;u/=2}g=e.detectVerticalSquash(r,m);if(m||g!==1){s*=g;l=Math.ceil(d*l/o);c=Math.ceil(d*c/u/g);f=0;b=0;while(b<u){a=0;y=0;while(y<o){v.clearRect(0,0,d,d);v.drawImage(r,i,s,o,u,-y,-b,o,u);h.drawImage(p,0,0,d,d,a,f,l,c);y+=d;a+=l}b+=d;f+=c}h.restore();return n}}return t(n,r,i,s,o,u,a,f,l,c)}})