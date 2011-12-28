(function(a){var b="^",c=b,d=function(a,b){var c,d;typeof b=="undefined"?(c="log",d=a):(c=a,d=b),console[c]("[refrag.js] "+
d)},e="#"+b,f=window.location.hash;if(f.substr(0,e.length)===e){f=f.substr(e.length),d("Anchor `"+f+"` found, will redirect..."
),a(function(){d("Attempting to redirect..."),f=unescape(f);var a=g(f);if(a.$dom){d("Matched '"+a.$dom.nodeName+"' element"
);var b=h(a.text,a.$dom),c=b||a.$dom;c.scrollIntoView()}else d("warn","No element matching anchor: "+f)});var g=function(
){var b=new RegExp("\\"+c+"[^\\"+c+"]","g"),d=function(a){sepIndex=a.search(b);if(sepIndex<0)return{text:a};var c=a.substring
(0,sepIndex),d=a.substring(sepIndex+1);return{tag:c,text:d}},e=function(b,c){var d=document.getElementsByTagName(c);if(!d
)return null;for(var e=0;e<d.length;++e){var g=f(b,a(d[e]));if(g)return g}return null},f=function(b,c,d){var e=null,g=function(
c){c=c||"";return function(){if(e)return!1;var d=a(this),f=j(d.innerText());/\s+$/.test(c)&&/^\s+/.test(f)&&(f=f.replace(/^\s+/
,""));var h=c+f;if(h.indexOf(b)>=0){e=d;return!1}a.each(d.contents(),g(h))}};c=c||a("body"),a.each(c.contents(),g());if(!
e){if(d)return null;g().apply(c);return e}return f(b,e,!0)||e};return function(a){var b=d(a);b.text=j(b.text),b.$dom=b.tag?
e(b.text,b.tag):f(b.text);return b}}(),h=function(){var b=function(b){var c=[],d=[];d.push(b);while(d.length>0){var e=a(d
.pop());e.isText()?c.push(e):a.each(e.contents(),function(){d.push(this)})}return c.reverse()},c=function(a,c){var d=a.innerText
(),e=b(a),f=i(d,c),g,h=-1,j=0,k;for(var l=0;l<e.length;++l){var m=e[l].innerText();j+=m.length;if(j>=f){g=l,k=f-(j-m.length
),j>=f+c.length&&(h=l);break}}if(h<0)for(var l=g+1;l<e.length;++l){var m=e[l].innerText();j+=m.length;if(j>=f+c.length){h=
l;break}}j=0,f=k;var n=[];for(var l=g;l<=h;++l){var o=e[l],p={node:o};p.offset=l==g?f:0,p.length=l==h?c.length-(j-f-1):o.
innerText().length,n.push(p),j+=p.length}return n},d=function(b,c,d,e){e=e||"span";var f=b.innerText(),g=f.substring(c,d)
,h=a(document.createTextNode(f.substring(0,c))),i=a(document.createTextNode(f.substring(d))),j=a("<"+e+"/>").html(g),k=a("<"+
e+"/>");k.append(h).append(j).append(i),b.replaceWith(k);return j},e=function(a){var b=a.css("color"),c=a.css("background-color"
);b&&c?(c=c=="transparent"?"white":c,a.css("color",c),a.css("background-color",b)):a.css("background-color","#ffffbb")};return function(
a,b){var f=[],g;if(b.isText()){var h=i(b.innerText(),a),j={node:b,offset:h,length:a.length};g=[j]}else g=c(b,a);for(var k=0
;k<g.length;++k){var j=g[k],l=j.offset,m=j.offset+j.length,n=d(j.node,l,m);f.push(n)}for(var o in f)e(f[o]);return f.length>0?
f[0]:null}}(),i=function(a,b){a=j(a),b=j(b);return a.indexOf(b)},j=function(a){a=a||"",a=a.toLowerCase();var b=/\s/,c="";
for(var d=0;d<a.length;++d)if(b.test(a[d])){c+=" ";while(d+1<a.length&&b.test(a[d+1]))++d}else c+=a[d];return c}}})(function(
){var a=function(){var a=function(b){var c=function(a){if(a[0]=="#"){var b=a.substring(1),c=document.getElementById(b);return c?
e(c):null}return document.querySelector?e(document.querySelector(a)):null},d=function(a){a=a.substr(1,a.length-2),a[a.length-1
]=="/"&&(a=a.substr(0,a.length-1));var b=document.createElement(a);return e(b)},e=function(b){for(var c in a.fn)if(a.fn.hasOwnProperty
(c)&&typeof b[c]=="undefined"){var d=a.fn[c];b[c]=d}b[0]=b;return b},f=function(a){if(window.addEventListener)return window
.addEventListener("load",a);window.onload=a;return!0};if(typeof b=="string"){b=b.trim();return b[0]=="<"&&b[b.length-1]==">"?
d(b):c(b)}return typeof b=="function"?f(b):e(b)};a.fn=function(){var b=function(a){var b=a.split("-");for(var c=0;c<b.length
;++c){var d=b[c].substring(0,1);d=d[c>0?"toUpperCase":"toLowerCase"](),b[c]=d+b[c].substring(1)}return b.join("")};return{
on:function(a,b){a=a.toLowerCase(),this.addEventListener?this.addEventListener(a,b):this["on"+a]=b;return this},isText:function(
){return this.nodeType==3},parent:function(){return a(this.parentNode)},contents:function(){return this.childNodes},html:
function(a){if(typeof a!="undefined"){this.innerHTML=a;return this}return this.innerHTML},innerText:function(){if(this.isText
())return this.nodeValue;var b="",c=this.childNodes;a.each(c,function(){b+=a(this).innerText()});return b},css:function(a
,c){a=b(a);if(typeof c!="undefined"){this.style[a]=c;return this}var d=this.style[a];if(typeof d!="undefined")return d;if(
this.currentStyle)return this.currentStyle[a];if(window.getComputedStyle){var e=document.defaultView.getComputedStyle(this
,null);return e.getPropertyValue(a)}},offset:function(){var a=top=0;if(b.offsetParent){var b=this;do a+=b.offsetLeft,top+=
b.offsetTop;while(b=b.offsetParent)}return{left:a,top:top}},scrollIntoView:function(b){var c=this;while(c&&c.nodeType!=1)
c=c.previousSibling;c=c||this.parentNode,c&&a(c).scrollIntoView(b)},append:function(a){this.appendChild(a);return this},replaceWith
:function(a){var b=this.parentNode;b.insertBefore(a,this),b.removeChild(this);return this}}}(),a.each=function(a,b){for(var c in 
a)if(a.hasOwnProperty(c)){var d=a[c],e=b.apply(d,[c,d,a]);if(e===!1)break}};return a}(),b=window.jQuery;return b?function(
b){var c=["isText","innerText","scrollIntoView"],d={};for(var e in c){var f=c[e];d[f]=function(b){return function(){var c=
this;if(c.length>0){var d=a(c[0]);return d[b].apply(d,arguments)}}}(f)}b.extend(b.fn,d);return b}(b):a}())