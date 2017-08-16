(function () {
window.WebComponents = window.WebComponents || { flags: {} };
var file = 'webcomponents-lite.js';
var script = document.querySelector('script[src*="' + file + '"]');
var flags = {};
if (!flags.noOpts) {
location.search.slice(1).split('&').forEach(function (option) {
var parts = option.split('=');
var match;
if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
flags[match[1]] = parts[1] || true;
}
});
if (script) {
for (var i = 0, a; a = script.attributes[i]; i++) {
if (a.name !== 'src') {
flags[a.name] = a.value || true;
}
}
}
if (flags.log && flags.log.split) {
var parts = flags.log.split(',');
flags.log = {};
parts.forEach(function (f) {
flags.log[f] = true;
});
} else {
flags.log = {};
}
}
if (flags.register) {
window.CustomElements = window.CustomElements || { flags: {} };
window.CustomElements.flags.register = flags.register;
}
WebComponents.flags = flags;
}());
(function (scope) {
'use strict';
var hasWorkingUrl = false;
if (!scope.forceJURL) {
try {
var u = new URL('b', 'http://a');
u.pathname = 'c%20d';
hasWorkingUrl = u.href === 'http://a/c%20d';
} catch (e) {
}
}
if (hasWorkingUrl)
return;
var relative = Object.create(null);
relative['ftp'] = 21;
relative['file'] = 0;
relative['gopher'] = 70;
relative['http'] = 80;
relative['https'] = 443;
relative['ws'] = 80;
relative['wss'] = 443;
var relativePathDotMapping = Object.create(null);
relativePathDotMapping['%2e'] = '.';
relativePathDotMapping['.%2e'] = '..';
relativePathDotMapping['%2e.'] = '..';
relativePathDotMapping['%2e%2e'] = '..';
function isRelativeScheme(scheme) {
return relative[scheme] !== undefined;
}
function invalid() {
clear.call(this);
this._isInvalid = true;
}
function IDNAToASCII(h) {
if ('' == h) {
invalid.call(this);
}
return h.toLowerCase();
}
function percentEscape(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
63,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
function percentEscapeQuery(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
function parse(input, stateOverride, base) {
function err(message) {
errors.push(message);
}
var state = stateOverride || 'scheme start', cursor = 0, buffer = '', seenAt = false, seenBracket = false, errors = [];
loop:
while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
var c = input[cursor];
switch (state) {
case 'scheme start':
if (c && ALPHA.test(c)) {
buffer += c.toLowerCase();
state = 'scheme';
} else if (!stateOverride) {
buffer = '';
state = 'no scheme';
continue;
} else {
err('Invalid scheme.');
break loop;
}
break;
case 'scheme':
if (c && ALPHANUMERIC.test(c)) {
buffer += c.toLowerCase();
} else if (':' == c) {
this._scheme = buffer;
buffer = '';
if (stateOverride) {
break loop;
}
if (isRelativeScheme(this._scheme)) {
this._isRelative = true;
}
if ('file' == this._scheme) {
state = 'relative';
} else if (this._isRelative && base && base._scheme == this._scheme) {
state = 'relative or authority';
} else if (this._isRelative) {
state = 'authority first slash';
} else {
state = 'scheme data';
}
} else if (!stateOverride) {
buffer = '';
cursor = 0;
state = 'no scheme';
continue;
} else if (EOF == c) {
break loop;
} else {
err('Code point not allowed in scheme: ' + c);
break loop;
}
break;
case 'scheme data':
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
} else {
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._schemeData += percentEscape(c);
}
}
break;
case 'no scheme':
if (!base || !isRelativeScheme(base._scheme)) {
err('Missing scheme.');
invalid.call(this);
} else {
state = 'relative';
continue;
}
break;
case 'relative or authority':
if ('/' == c && '/' == input[cursor + 1]) {
state = 'authority ignore slashes';
} else {
err('Expected /, got: ' + c);
state = 'relative';
continue;
}
break;
case 'relative':
this._isRelative = true;
if ('file' != this._scheme)
this._scheme = base._scheme;
if (EOF == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._username = base._username;
this._password = base._password;
break loop;
} else if ('/' == c || '\\' == c) {
if ('\\' == c)
err('\\ is an invalid code point.');
state = 'relative slash';
} else if ('?' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = '?';
this._username = base._username;
this._password = base._password;
state = 'query';
} else if ('#' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._fragment = '#';
this._username = base._username;
this._password = base._password;
state = 'fragment';
} else {
var nextC = input[cursor + 1];
var nextNextC = input[cursor + 2];
if ('file' != this._scheme || !ALPHA.test(c) || nextC != ':' && nextC != '|' || EOF != nextNextC && '/' != nextNextC && '\\' != nextNextC && '?' != nextNextC && '#' != nextNextC) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
this._path = base._path.slice();
this._path.pop();
}
state = 'relative path';
continue;
}
break;
case 'relative slash':
if ('/' == c || '\\' == c) {
if ('\\' == c) {
err('\\ is an invalid code point.');
}
if ('file' == this._scheme) {
state = 'file host';
} else {
state = 'authority ignore slashes';
}
} else {
if ('file' != this._scheme) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
}
state = 'relative path';
continue;
}
break;
case 'authority first slash':
if ('/' == c) {
state = 'authority second slash';
} else {
err('Expected \'/\', got: ' + c);
state = 'authority ignore slashes';
continue;
}
break;
case 'authority second slash':
state = 'authority ignore slashes';
if ('/' != c) {
err('Expected \'/\', got: ' + c);
continue;
}
break;
case 'authority ignore slashes':
if ('/' != c && '\\' != c) {
state = 'authority';
continue;
} else {
err('Expected authority, got: ' + c);
}
break;
case 'authority':
if ('@' == c) {
if (seenAt) {
err('@ already seen.');
buffer += '%40';
}
seenAt = true;
for (var i = 0; i < buffer.length; i++) {
var cp = buffer[i];
if ('\t' == cp || '\n' == cp || '\r' == cp) {
err('Invalid whitespace in authority.');
continue;
}
if (':' == cp && null === this._password) {
this._password = '';
continue;
}
var tempC = percentEscape(cp);
null !== this._password ? this._password += tempC : this._username += tempC;
}
buffer = '';
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
cursor -= buffer.length;
buffer = '';
state = 'host';
continue;
} else {
buffer += c;
}
break;
case 'file host':
if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ':' || buffer[1] == '|')) {
state = 'relative path';
} else if (buffer.length == 0) {
state = 'relative path start';
} else {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
}
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid whitespace in file host.');
} else {
buffer += c;
}
break;
case 'host':
case 'hostname':
if (':' == c && !seenBracket) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'port';
if ('hostname' == stateOverride) {
break loop;
}
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
if (stateOverride) {
break loop;
}
continue;
} else if ('\t' != c && '\n' != c && '\r' != c) {
if ('[' == c) {
seenBracket = true;
} else if (']' == c) {
seenBracket = false;
}
buffer += c;
} else {
err('Invalid code point in host/hostname: ' + c);
}
break;
case 'port':
if (/[0-9]/.test(c)) {
buffer += c;
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c || stateOverride) {
if ('' != buffer) {
var temp = parseInt(buffer, 10);
if (temp != relative[this._scheme]) {
this._port = temp + '';
}
buffer = '';
}
if (stateOverride) {
break loop;
}
state = 'relative path start';
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid code point in port: ' + c);
} else {
invalid.call(this);
}
break;
case 'relative path start':
if ('\\' == c)
err('\'\\\' not allowed in path.');
state = 'relative path';
if ('/' != c && '\\' != c) {
continue;
}
break;
case 'relative path':
if (EOF == c || '/' == c || '\\' == c || !stateOverride && ('?' == c || '#' == c)) {
if ('\\' == c) {
err('\\ not allowed in relative path.');
}
var tmp;
if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
buffer = tmp;
}
if ('..' == buffer) {
this._path.pop();
if ('/' != c && '\\' != c) {
this._path.push('');
}
} else if ('.' == buffer && '/' != c && '\\' != c) {
this._path.push('');
} else if ('.' != buffer) {
if ('file' == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == '|') {
buffer = buffer[0] + ':';
}
this._path.push(buffer);
}
buffer = '';
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
}
} else if ('\t' != c && '\n' != c && '\r' != c) {
buffer += percentEscape(c);
}
break;
case 'query':
if (!stateOverride && '#' == c) {
this._fragment = '#';
state = 'fragment';
} else if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._query += percentEscapeQuery(c);
}
break;
case 'fragment':
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._fragment += c;
}
break;
}
cursor++;
}
}
function clear() {
this._scheme = '';
this._schemeData = '';
this._username = '';
this._password = null;
this._host = '';
this._port = '';
this._path = [];
this._query = '';
this._fragment = '';
this._isInvalid = false;
this._isRelative = false;
}
function jURL(url, base) {
if (base !== undefined && !(base instanceof jURL))
base = new jURL(String(base));
this._url = url;
clear.call(this);
var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
parse.call(this, input, null, base);
}
jURL.prototype = {
toString: function () {
return this.href;
},
get href() {
if (this._isInvalid)
return this._url;
var authority = '';
if ('' != this._username || null != this._password) {
authority = this._username + (null != this._password ? ':' + this._password : '') + '@';
}
return this.protocol + (this._isRelative ? '//' + authority + this.host : '') + this.pathname + this._query + this._fragment;
},
set href(href) {
clear.call(this);
parse.call(this, href);
},
get protocol() {
return this._scheme + ':';
},
set protocol(protocol) {
if (this._isInvalid)
return;
parse.call(this, protocol + ':', 'scheme start');
},
get host() {
return this._isInvalid ? '' : this._port ? this._host + ':' + this._port : this._host;
},
set host(host) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, host, 'host');
},
get hostname() {
return this._host;
},
set hostname(hostname) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, hostname, 'hostname');
},
get port() {
return this._port;
},
set port(port) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, port, 'port');
},
get pathname() {
return this._isInvalid ? '' : this._isRelative ? '/' + this._path.join('/') : this._schemeData;
},
set pathname(pathname) {
if (this._isInvalid || !this._isRelative)
return;
this._path = [];
parse.call(this, pathname, 'relative path start');
},
get search() {
return this._isInvalid || !this._query || '?' == this._query ? '' : this._query;
},
set search(search) {
if (this._isInvalid || !this._isRelative)
return;
this._query = '?';
if ('?' == search[0])
search = search.slice(1);
parse.call(this, search, 'query');
},
get hash() {
return this._isInvalid || !this._fragment || '#' == this._fragment ? '' : this._fragment;
},
set hash(hash) {
if (this._isInvalid)
return;
this._fragment = '#';
if ('#' == hash[0])
hash = hash.slice(1);
parse.call(this, hash, 'fragment');
},
get origin() {
var host;
if (this._isInvalid || !this._scheme) {
return '';
}
switch (this._scheme) {
case 'data':
case 'file':
case 'javascript':
case 'mailto':
return 'null';
}
host = this.host;
if (!host) {
return '';
}
return this._scheme + '://' + host;
}
};
var OriginalURL = scope.URL;
if (OriginalURL) {
jURL.createObjectURL = function (blob) {
return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
};
jURL.revokeObjectURL = function (url) {
OriginalURL.revokeObjectURL(url);
};
}
scope.URL = jURL;
}(self));
if (typeof WeakMap === 'undefined') {
(function () {
var defineProperty = Object.defineProperty;
var counter = Date.now() % 1000000000;
var WeakMap = function () {
this.name = '__st' + (Math.random() * 1000000000 >>> 0) + (counter++ + '__');
};
WeakMap.prototype = {
set: function (key, value) {
var entry = key[this.name];
if (entry && entry[0] === key)
entry[1] = value;
else
defineProperty(key, this.name, {
value: [
key,
value
],
writable: true
});
return this;
},
get: function (key) {
var entry;
return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
},
'delete': function (key) {
var entry = key[this.name];
if (!entry || entry[0] !== key)
return false;
entry[0] = entry[1] = undefined;
return true;
},
has: function (key) {
var entry = key[this.name];
if (!entry)
return false;
return entry[0] === key;
}
};
window.WeakMap = WeakMap;
}());
}
(function (global) {
if (global.JsMutationObserver) {
return;
}
var registrationsTable = new WeakMap();
var setImmediate;
if (/Trident|Edge/.test(navigator.userAgent)) {
setImmediate = setTimeout;
} else if (window.setImmediate) {
setImmediate = window.setImmediate;
} else {
var setImmediateQueue = [];
var sentinel = String(Math.random());
window.addEventListener('message', function (e) {
if (e.data === sentinel) {
var queue = setImmediateQueue;
setImmediateQueue = [];
queue.forEach(function (func) {
func();
});
}
});
setImmediate = function (func) {
setImmediateQueue.push(func);
window.postMessage(sentinel, '*');
};
}
var isScheduled = false;
var scheduledObservers = [];
function scheduleCallback(observer) {
scheduledObservers.push(observer);
if (!isScheduled) {
isScheduled = true;
setImmediate(dispatchCallbacks);
}
}
function wrapIfNeeded(node) {
return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
}
function dispatchCallbacks() {
isScheduled = false;
var observers = scheduledObservers;
scheduledObservers = [];
observers.sort(function (o1, o2) {
return o1.uid_ - o2.uid_;
});
var anyNonEmpty = false;
observers.forEach(function (observer) {
var queue = observer.takeRecords();
removeTransientObserversFor(observer);
if (queue.length) {
observer.callback_(queue, observer);
anyNonEmpty = true;
}
});
if (anyNonEmpty)
dispatchCallbacks();
}
function removeTransientObserversFor(observer) {
observer.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
if (!registrations)
return;
registrations.forEach(function (registration) {
if (registration.observer === observer)
registration.removeTransientObservers();
});
});
}
function forEachAncestorAndObserverEnqueueRecord(target, callback) {
for (var node = target; node; node = node.parentNode) {
var registrations = registrationsTable.get(node);
if (registrations) {
for (var j = 0; j < registrations.length; j++) {
var registration = registrations[j];
var options = registration.options;
if (node !== target && !options.subtree)
continue;
var record = callback(options);
if (record)
registration.enqueue(record);
}
}
}
}
var uidCounter = 0;
function JsMutationObserver(callback) {
this.callback_ = callback;
this.nodes_ = [];
this.records_ = [];
this.uid_ = ++uidCounter;
}
JsMutationObserver.prototype = {
observe: function (target, options) {
target = wrapIfNeeded(target);
if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
throw new SyntaxError();
}
var registrations = registrationsTable.get(target);
if (!registrations)
registrationsTable.set(target, registrations = []);
var registration;
for (var i = 0; i < registrations.length; i++) {
if (registrations[i].observer === this) {
registration = registrations[i];
registration.removeListeners();
registration.options = options;
break;
}
}
if (!registration) {
registration = new Registration(this, target, options);
registrations.push(registration);
this.nodes_.push(target);
}
registration.addListeners();
},
disconnect: function () {
this.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
var registration = registrations[i];
if (registration.observer === this) {
registration.removeListeners();
registrations.splice(i, 1);
break;
}
}
}, this);
this.records_ = [];
},
takeRecords: function () {
var copyOfRecords = this.records_;
this.records_ = [];
return copyOfRecords;
}
};
function MutationRecord(type, target) {
this.type = type;
this.target = target;
this.addedNodes = [];
this.removedNodes = [];
this.previousSibling = null;
this.nextSibling = null;
this.attributeName = null;
this.attributeNamespace = null;
this.oldValue = null;
}
function copyMutationRecord(original) {
var record = new MutationRecord(original.type, original.target);
record.addedNodes = original.addedNodes.slice();
record.removedNodes = original.removedNodes.slice();
record.previousSibling = original.previousSibling;
record.nextSibling = original.nextSibling;
record.attributeName = original.attributeName;
record.attributeNamespace = original.attributeNamespace;
record.oldValue = original.oldValue;
return record;
}
var currentRecord, recordWithOldValue;
function getRecord(type, target) {
return currentRecord = new MutationRecord(type, target);
}
function getRecordWithOldValue(oldValue) {
if (recordWithOldValue)
return recordWithOldValue;
recordWithOldValue = copyMutationRecord(currentRecord);
recordWithOldValue.oldValue = oldValue;
return recordWithOldValue;
}
function clearRecords() {
currentRecord = recordWithOldValue = undefined;
}
function recordRepresentsCurrentMutation(record) {
return record === recordWithOldValue || record === currentRecord;
}
function selectRecord(lastRecord, newRecord) {
if (lastRecord === newRecord)
return lastRecord;
if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
return recordWithOldValue;
return null;
}
function Registration(observer, target, options) {
this.observer = observer;
this.target = target;
this.options = options;
this.transientObservedNodes = [];
}
Registration.prototype = {
enqueue: function (record) {
var records = this.observer.records_;
var length = records.length;
if (records.length > 0) {
var lastRecord = records[length - 1];
var recordToReplaceLast = selectRecord(lastRecord, record);
if (recordToReplaceLast) {
records[length - 1] = recordToReplaceLast;
return;
}
} else {
scheduleCallback(this.observer);
}
records[length] = record;
},
addListeners: function () {
this.addListeners_(this.target);
},
addListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.addEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.addEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.addEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.addEventListener('DOMNodeRemoved', this, true);
},
removeListeners: function () {
this.removeListeners_(this.target);
},
removeListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.removeEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.removeEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.removeEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.removeEventListener('DOMNodeRemoved', this, true);
},
addTransientObserver: function (node) {
if (node === this.target)
return;
this.addListeners_(node);
this.transientObservedNodes.push(node);
var registrations = registrationsTable.get(node);
if (!registrations)
registrationsTable.set(node, registrations = []);
registrations.push(this);
},
removeTransientObservers: function () {
var transientObservedNodes = this.transientObservedNodes;
this.transientObservedNodes = [];
transientObservedNodes.forEach(function (node) {
this.removeListeners_(node);
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
if (registrations[i] === this) {
registrations.splice(i, 1);
break;
}
}
}, this);
},
handleEvent: function (e) {
e.stopImmediatePropagation();
switch (e.type) {
case 'DOMAttrModified':
var name = e.attrName;
var namespace = e.relatedNode.namespaceURI;
var target = e.target;
var record = new getRecord('attributes', target);
record.attributeName = name;
record.attributeNamespace = namespace;
var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.attributes)
return;
if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
return;
}
if (options.attributeOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMCharacterDataModified':
var target = e.target;
var record = getRecord('characterData', target);
var oldValue = e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.characterData)
return;
if (options.characterDataOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMNodeRemoved':
this.addTransientObserver(e.target);
case 'DOMNodeInserted':
var changedNode = e.target;
var addedNodes, removedNodes;
if (e.type === 'DOMNodeInserted') {
addedNodes = [changedNode];
removedNodes = [];
} else {
addedNodes = [];
removedNodes = [changedNode];
}
var previousSibling = changedNode.previousSibling;
var nextSibling = changedNode.nextSibling;
var record = getRecord('childList', e.target.parentNode);
record.addedNodes = addedNodes;
record.removedNodes = removedNodes;
record.previousSibling = previousSibling;
record.nextSibling = nextSibling;
forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function (options) {
if (!options.childList)
return;
return record;
});
}
clearRecords();
}
};
global.JsMutationObserver = JsMutationObserver;
if (!global.MutationObserver) {
global.MutationObserver = JsMutationObserver;
JsMutationObserver._isPolyfilled = true;
}
}(self));
(function () {
var needsTemplate = typeof HTMLTemplateElement === 'undefined';
if (/Trident/.test(navigator.userAgent)) {
(function () {
var importNode = document.importNode;
document.importNode = function () {
var n = importNode.apply(document, arguments);
if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
var f = document.createDocumentFragment();
f.appendChild(n);
return f;
} else {
return n;
}
};
}());
}
var needsCloning = function () {
if (!needsTemplate) {
var t = document.createElement('template');
var t2 = document.createElement('template');
t2.content.appendChild(document.createElement('div'));
t.content.appendChild(t2);
var clone = t.cloneNode(true);
return clone.content.childNodes.length === 0 || clone.content.firstChild.content.childNodes.length === 0;
}
}();
var TEMPLATE_TAG = 'template';
var TemplateImpl = function () {
};
if (needsTemplate) {
var contentDoc = document.implementation.createHTMLDocument('template');
var canDecorate = true;
var templateStyle = document.createElement('style');
templateStyle.textContent = TEMPLATE_TAG + '{display:none;}';
var head = document.head;
head.insertBefore(templateStyle, head.firstElementChild);
TemplateImpl.prototype = Object.create(HTMLElement.prototype);
TemplateImpl.decorate = function (template) {
if (template.content) {
return;
}
template.content = contentDoc.createDocumentFragment();
var child;
while (child = template.firstChild) {
template.content.appendChild(child);
}
template.cloneNode = function (deep) {
return TemplateImpl.cloneNode(this, deep);
};
if (canDecorate) {
try {
Object.defineProperty(template, 'innerHTML', {
get: function () {
var o = '';
for (var e = this.content.firstChild; e; e = e.nextSibling) {
o += e.outerHTML || escapeData(e.data);
}
return o;
},
set: function (text) {
contentDoc.body.innerHTML = text;
TemplateImpl.bootstrap(contentDoc);
while (this.content.firstChild) {
this.content.removeChild(this.content.firstChild);
}
while (contentDoc.body.firstChild) {
this.content.appendChild(contentDoc.body.firstChild);
}
},
configurable: true
});
} catch (err) {
canDecorate = false;
}
}
TemplateImpl.bootstrap(template.content);
};
TemplateImpl.bootstrap = function (doc) {
var templates = doc.querySelectorAll(TEMPLATE_TAG);
for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
TemplateImpl.decorate(t);
}
};
document.addEventListener('DOMContentLoaded', function () {
TemplateImpl.bootstrap(document);
});
var createElement = document.createElement;
document.createElement = function () {
'use strict';
var el = createElement.apply(document, arguments);
if (el.localName === 'template') {
TemplateImpl.decorate(el);
}
return el;
};
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '\xA0':
return '&nbsp;';
}
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
}
if (needsTemplate || needsCloning) {
var nativeCloneNode = Node.prototype.cloneNode;
TemplateImpl.cloneNode = function (template, deep) {
var clone = nativeCloneNode.call(template, false);
if (this.decorate) {
this.decorate(clone);
}
if (deep) {
clone.content.appendChild(nativeCloneNode.call(template.content, true));
this.fixClonedDom(clone.content, template.content);
}
return clone;
};
TemplateImpl.fixClonedDom = function (clone, source) {
if (!source.querySelectorAll)
return;
var s$ = source.querySelectorAll(TEMPLATE_TAG);
var t$ = clone.querySelectorAll(TEMPLATE_TAG);
for (var i = 0, l = t$.length, t, s; i < l; i++) {
s = s$[i];
t = t$[i];
if (this.decorate) {
this.decorate(s);
}
t.parentNode.replaceChild(s.cloneNode(true), t);
}
};
var originalImportNode = document.importNode;
Node.prototype.cloneNode = function (deep) {
var dom = nativeCloneNode.call(this, deep);
if (deep) {
TemplateImpl.fixClonedDom(dom, this);
}
return dom;
};
document.importNode = function (element, deep) {
if (element.localName === TEMPLATE_TAG) {
return TemplateImpl.cloneNode(element, deep);
} else {
var dom = originalImportNode.call(document, element, deep);
if (deep) {
TemplateImpl.fixClonedDom(dom, element);
}
return dom;
}
};
if (needsCloning) {
HTMLTemplateElement.prototype.cloneNode = function (deep) {
return TemplateImpl.cloneNode(this, deep);
};
}
}
if (needsTemplate) {
window.HTMLTemplateElement = TemplateImpl;
}
}());
(function (scope) {
'use strict';
if (!(window.performance && window.performance.now)) {
var start = Date.now();
window.performance = {
now: function () {
return Date.now() - start;
}
};
}
if (!window.requestAnimationFrame) {
window.requestAnimationFrame = function () {
var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
return nativeRaf ? function (callback) {
return nativeRaf(function () {
callback(performance.now());
});
} : function (callback) {
return window.setTimeout(callback, 1000 / 60);
};
}();
}
if (!window.cancelAnimationFrame) {
window.cancelAnimationFrame = function () {
return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function (id) {
clearTimeout(id);
};
}();
}
var workingDefaultPrevented = function () {
var e = document.createEvent('Event');
e.initEvent('foo', true, true);
e.preventDefault();
return e.defaultPrevented;
}();
if (!workingDefaultPrevented) {
var origPreventDefault = Event.prototype.preventDefault;
Event.prototype.preventDefault = function () {
if (!this.cancelable) {
return;
}
origPreventDefault.call(this);
Object.defineProperty(this, 'defaultPrevented', {
get: function () {
return true;
},
configurable: true
});
};
}
var isIE = /Trident/.test(navigator.userAgent);
if (!window.CustomEvent || isIE && typeof window.CustomEvent !== 'function') {
window.CustomEvent = function (inType, params) {
params = params || {};
var e = document.createEvent('CustomEvent');
e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
return e;
};
window.CustomEvent.prototype = window.Event.prototype;
}
if (!window.Event || isIE && typeof window.Event !== 'function') {
var origEvent = window.Event;
window.Event = function (inType, params) {
params = params || {};
var e = document.createEvent('Event');
e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
return e;
};
window.Event.prototype = origEvent.prototype;
}
}(window.WebComponents));
window.HTMLImports = window.HTMLImports || { flags: {} };
(function (scope) {
var IMPORT_LINK_TYPE = 'import';
var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement('link'));
var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
var wrap = function (node) {
return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
};
var rootDocument = wrap(document);
var currentScriptDescriptor = {
get: function () {
var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== 'complete' ? document.scripts[document.scripts.length - 1] : null);
return wrap(script);
},
configurable: true
};
Object.defineProperty(document, '_currentScript', currentScriptDescriptor);
Object.defineProperty(rootDocument, '_currentScript', currentScriptDescriptor);
var isIE = /Trident/.test(navigator.userAgent);
function whenReady(callback, doc) {
doc = doc || rootDocument;
whenDocumentReady(function () {
watchImportsLoad(callback, doc);
}, doc);
}
var requiredReadyState = isIE ? 'complete' : 'interactive';
var READY_EVENT = 'readystatechange';
function isDocumentReady(doc) {
return doc.readyState === 'complete' || doc.readyState === requiredReadyState;
}
function whenDocumentReady(callback, doc) {
if (!isDocumentReady(doc)) {
var checkReady = function () {
if (doc.readyState === 'complete' || doc.readyState === requiredReadyState) {
doc.removeEventListener(READY_EVENT, checkReady);
whenDocumentReady(callback, doc);
}
};
doc.addEventListener(READY_EVENT, checkReady);
} else if (callback) {
callback();
}
}
function markTargetLoaded(event) {
event.target.__loaded = true;
}
function watchImportsLoad(callback, doc) {
var imports = doc.querySelectorAll('link[rel=import]');
var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
function checkDone() {
if (parsedCount == importCount && callback) {
callback({
allImports: imports,
loadedImports: newImports,
errorImports: errorImports
});
}
}
function loadedImport(e) {
markTargetLoaded(e);
newImports.push(this);
parsedCount++;
checkDone();
}
function errorLoadingImport(e) {
errorImports.push(this);
parsedCount++;
checkDone();
}
if (importCount) {
for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
if (isImportLoaded(imp)) {
newImports.push(this);
parsedCount++;
checkDone();
} else {
imp.addEventListener('load', loadedImport);
imp.addEventListener('error', errorLoadingImport);
}
}
} else {
checkDone();
}
}
function isImportLoaded(link) {
return useNative ? link.__loaded || link.import && link.import.readyState !== 'loading' : link.__importParsed;
}
if (useNative) {
new MutationObserver(function (mxns) {
for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
if (m.addedNodes) {
handleImports(m.addedNodes);
}
}
}).observe(document.head, { childList: true });
function handleImports(nodes) {
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (isImport(n)) {
handleImport(n);
}
}
}
function isImport(element) {
return element.localName === 'link' && element.rel === 'import';
}
function handleImport(element) {
var loaded = element.import;
if (loaded) {
markTargetLoaded({ target: element });
} else {
element.addEventListener('load', markTargetLoaded);
element.addEventListener('error', markTargetLoaded);
}
}
(function () {
if (document.readyState === 'loading') {
var imports = document.querySelectorAll('link[rel=import]');
for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
handleImport(imp);
}
}
}());
}
whenReady(function (detail) {
window.HTMLImports.ready = true;
window.HTMLImports.readyTime = new Date().getTime();
var evt = rootDocument.createEvent('CustomEvent');
evt.initCustomEvent('HTMLImportsLoaded', true, true, detail);
rootDocument.dispatchEvent(evt);
});
scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
scope.useNative = useNative;
scope.rootDocument = rootDocument;
scope.whenReady = whenReady;
scope.isIE = isIE;
}(window.HTMLImports));
(function (scope) {
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
}(window.HTMLImports));
window.HTMLImports.addModule(function (scope) {
var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
var path = {
resolveUrlsInStyle: function (style, linkUrl) {
var doc = style.ownerDocument;
var resolver = doc.createElement('a');
style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
return style;
},
resolveUrlsInCssText: function (cssText, linkUrl, urlObj) {
var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
return r;
},
replaceUrls: function (text, urlObj, linkUrl, regexp) {
return text.replace(regexp, function (m, pre, url, post) {
var urlPath = url.replace(/["']/g, '');
if (linkUrl) {
urlPath = new URL(urlPath, linkUrl).href;
}
urlObj.href = urlPath;
urlPath = urlObj.href;
return pre + '\'' + urlPath + '\'' + post;
});
}
};
scope.path = path;
});
window.HTMLImports.addModule(function (scope) {
var xhr = {
async: true,
ok: function (request) {
return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
},
load: function (url, next, nextContext) {
var request = new XMLHttpRequest();
if (scope.flags.debug || scope.flags.bust) {
url += '?' + Math.random();
}
request.open('GET', url, xhr.async);
request.addEventListener('readystatechange', function (e) {
if (request.readyState === 4) {
var redirectedUrl = null;
try {
var locationHeader = request.getResponseHeader('Location');
if (locationHeader) {
redirectedUrl = locationHeader.substr(0, 1) === '/' ? location.origin + locationHeader : locationHeader;
}
} catch (e) {
console.error(e.message);
}
next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
}
});
request.send();
return request;
},
loadDocument: function (url, next, nextContext) {
this.load(url, next, nextContext).responseType = 'document';
}
};
scope.xhr = xhr;
});
window.HTMLImports.addModule(function (scope) {
var xhr = scope.xhr;
var flags = scope.flags;
var Loader = function (onLoad, onComplete) {
this.cache = {};
this.onload = onLoad;
this.oncomplete = onComplete;
this.inflight = 0;
this.pending = {};
};
Loader.prototype = {
addNodes: function (nodes) {
this.inflight += nodes.length;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
this.require(n);
}
this.checkDone();
},
addNode: function (node) {
this.inflight++;
this.require(node);
this.checkDone();
},
require: function (elt) {
var url = elt.src || elt.href;
elt.__nodeUrl = url;
if (!this.dedupe(url, elt)) {
this.fetch(url, elt);
}
},
dedupe: function (url, elt) {
if (this.pending[url]) {
this.pending[url].push(elt);
return true;
}
var resource;
if (this.cache[url]) {
this.onload(url, elt, this.cache[url]);
this.tail();
return true;
}
this.pending[url] = [elt];
return false;
},
fetch: function (url, elt) {
flags.load && console.log('fetch', url, elt);
if (!url) {
setTimeout(function () {
this.receive(url, elt, { error: 'href must be specified' }, null);
}.bind(this), 0);
} else if (url.match(/^data:/)) {
var pieces = url.split(',');
var header = pieces[0];
var body = pieces[1];
if (header.indexOf(';base64') > -1) {
body = atob(body);
} else {
body = decodeURIComponent(body);
}
setTimeout(function () {
this.receive(url, elt, null, body);
}.bind(this), 0);
} else {
var receiveXhr = function (err, resource, redirectedUrl) {
this.receive(url, elt, err, resource, redirectedUrl);
}.bind(this);
xhr.load(url, receiveXhr);
}
},
receive: function (url, elt, err, resource, redirectedUrl) {
this.cache[url] = resource;
var $p = this.pending[url];
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
this.onload(url, p, resource, err, redirectedUrl);
this.tail();
}
this.pending[url] = null;
},
tail: function () {
--this.inflight;
this.checkDone();
},
checkDone: function () {
if (!this.inflight) {
this.oncomplete();
}
}
};
scope.Loader = Loader;
});
window.HTMLImports.addModule(function (scope) {
var Observer = function (addCallback) {
this.addCallback = addCallback;
this.mo = new MutationObserver(this.handler.bind(this));
};
Observer.prototype = {
handler: function (mutations) {
for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
if (m.type === 'childList' && m.addedNodes.length) {
this.addedNodes(m.addedNodes);
}
}
},
addedNodes: function (nodes) {
if (this.addCallback) {
this.addCallback(nodes);
}
for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
if (n.children && n.children.length) {
this.addedNodes(n.children);
}
}
},
observe: function (root) {
this.mo.observe(root, {
childList: true,
subtree: true
});
}
};
scope.Observer = Observer;
});
window.HTMLImports.addModule(function (scope) {
var path = scope.path;
var rootDocument = scope.rootDocument;
var flags = scope.flags;
var isIE = scope.isIE;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = 'link[rel=' + IMPORT_LINK_TYPE + ']';
var importParser = {
documentSelectors: IMPORT_SELECTOR,
importsSelectors: [
IMPORT_SELECTOR,
'link[rel=stylesheet]:not([type])',
'style:not([type])',
'script:not([type])',
'script[type="application/javascript"]',
'script[type="text/javascript"]'
].join(','),
map: {
link: 'parseLink',
script: 'parseScript',
style: 'parseStyle'
},
dynamicElements: [],
parseNext: function () {
var next = this.nextToParse();
if (next) {
this.parse(next);
}
},
parse: function (elt) {
if (this.isParsed(elt)) {
flags.parse && console.log('[%s] is already parsed', elt.localName);
return;
}
var fn = this[this.map[elt.localName]];
if (fn) {
this.markParsing(elt);
fn.call(this, elt);
}
},
parseDynamic: function (elt, quiet) {
this.dynamicElements.push(elt);
if (!quiet) {
this.parseNext();
}
},
markParsing: function (elt) {
flags.parse && console.log('parsing', elt);
this.parsingElement = elt;
},
markParsingComplete: function (elt) {
elt.__importParsed = true;
this.markDynamicParsingComplete(elt);
if (elt.__importElement) {
elt.__importElement.__importParsed = true;
this.markDynamicParsingComplete(elt.__importElement);
}
this.parsingElement = null;
flags.parse && console.log('completed', elt);
},
markDynamicParsingComplete: function (elt) {
var i = this.dynamicElements.indexOf(elt);
if (i >= 0) {
this.dynamicElements.splice(i, 1);
}
},
parseImport: function (elt) {
elt.import = elt.__doc;
if (window.HTMLImports.__importsParsingHook) {
window.HTMLImports.__importsParsingHook(elt);
}
if (elt.import) {
elt.import.__importParsed = true;
}
this.markParsingComplete(elt);
if (elt.__resource && !elt.__error) {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
} else {
elt.dispatchEvent(new CustomEvent('error', { bubbles: false }));
}
if (elt.__pending) {
var fn;
while (elt.__pending.length) {
fn = elt.__pending.shift();
if (fn) {
fn({ target: elt });
}
}
}
this.parseNext();
},
parseLink: function (linkElt) {
if (nodeIsImport(linkElt)) {
this.parseImport(linkElt);
} else {
linkElt.href = linkElt.href;
this.parseGeneric(linkElt);
}
},
parseStyle: function (elt) {
var src = elt;
elt = cloneStyle(elt);
src.__appliedElement = elt;
elt.__importElement = src;
this.parseGeneric(elt);
},
parseGeneric: function (elt) {
this.trackElement(elt);
this.addElementToDocument(elt);
},
rootImportForElement: function (elt) {
var n = elt;
while (n.ownerDocument.__importLink) {
n = n.ownerDocument.__importLink;
}
return n;
},
addElementToDocument: function (elt) {
var port = this.rootImportForElement(elt.__importElement || elt);
port.parentNode.insertBefore(elt, port);
},
trackElement: function (elt, callback) {
var self = this;
var done = function (e) {
elt.removeEventListener('load', done);
elt.removeEventListener('error', done);
if (callback) {
callback(e);
}
self.markParsingComplete(elt);
self.parseNext();
};
elt.addEventListener('load', done);
elt.addEventListener('error', done);
if (isIE && elt.localName === 'style') {
var fakeLoad = false;
if (elt.textContent.indexOf('@import') == -1) {
fakeLoad = true;
} else if (elt.sheet) {
fakeLoad = true;
var csr = elt.sheet.cssRules;
var len = csr ? csr.length : 0;
for (var i = 0, r; i < len && (r = csr[i]); i++) {
if (r.type === CSSRule.IMPORT_RULE) {
fakeLoad = fakeLoad && Boolean(r.styleSheet);
}
}
}
if (fakeLoad) {
setTimeout(function () {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
});
}
}
},
parseScript: function (scriptElt) {
var script = document.createElement('script');
script.__importElement = scriptElt;
script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
scope.currentScript = scriptElt;
this.trackElement(script, function (e) {
if (script.parentNode) {
script.parentNode.removeChild(script);
}
scope.currentScript = null;
});
this.addElementToDocument(script);
},
nextToParse: function () {
this._mayParse = [];
return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
},
nextToParseInDoc: function (doc, link) {
if (doc && this._mayParse.indexOf(doc) < 0) {
this._mayParse.push(doc);
var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (!this.isParsed(n)) {
if (this.hasResource(n)) {
return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
} else {
return;
}
}
}
}
return link;
},
nextToParseDynamic: function () {
return this.dynamicElements[0];
},
parseSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
},
isParsed: function (node) {
return node.__importParsed;
},
needsDynamicParsing: function (elt) {
return this.dynamicElements.indexOf(elt) >= 0;
},
hasResource: function (node) {
if (nodeIsImport(node) && node.__doc === undefined) {
return false;
}
return true;
}
};
function nodeIsImport(elt) {
return elt.localName === 'link' && elt.rel === IMPORT_LINK_TYPE;
}
function generateScriptDataUrl(script) {
var scriptContent = generateScriptContent(script);
return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(scriptContent);
}
function generateScriptContent(script) {
return script.textContent + generateSourceMapHint(script);
}
function generateSourceMapHint(script) {
var owner = script.ownerDocument;
owner.__importedScripts = owner.__importedScripts || 0;
var moniker = script.ownerDocument.baseURI;
var num = owner.__importedScripts ? '-' + owner.__importedScripts : '';
owner.__importedScripts++;
return '\n//# sourceURL=' + moniker + num + '.js\n';
}
function cloneStyle(style) {
var clone = style.ownerDocument.createElement('style');
clone.textContent = style.textContent;
path.resolveUrlsInStyle(clone);
return clone;
}
scope.parser = importParser;
scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});
window.HTMLImports.addModule(function (scope) {
var flags = scope.flags;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
var rootDocument = scope.rootDocument;
var Loader = scope.Loader;
var Observer = scope.Observer;
var parser = scope.parser;
var importer = {
documents: {},
documentPreloadSelectors: IMPORT_SELECTOR,
importsPreloadSelectors: [IMPORT_SELECTOR].join(','),
loadNode: function (node) {
importLoader.addNode(node);
},
loadSubtree: function (parent) {
var nodes = this.marshalNodes(parent);
importLoader.addNodes(nodes);
},
marshalNodes: function (parent) {
return parent.querySelectorAll(this.loadSelectorsForNode(parent));
},
loadSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
},
loaded: function (url, elt, resource, err, redirectedUrl) {
flags.load && console.log('loaded', url, elt);
elt.__resource = resource;
elt.__error = err;
if (isImportLink(elt)) {
var doc = this.documents[url];
if (doc === undefined) {
doc = err ? null : makeDocument(resource, redirectedUrl || url);
if (doc) {
doc.__importLink = elt;
this.bootDocument(doc);
}
this.documents[url] = doc;
}
elt.__doc = doc;
}
parser.parseNext();
},
bootDocument: function (doc) {
this.loadSubtree(doc);
this.observer.observe(doc);
parser.parseNext();
},
loadedAll: function () {
parser.parseNext();
}
};
var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
importer.observer = new Observer();
function isImportLink(elt) {
return isLinkRel(elt, IMPORT_LINK_TYPE);
}
function isLinkRel(elt, rel) {
return elt.localName === 'link' && elt.getAttribute('rel') === rel;
}
function hasBaseURIAccessor(doc) {
return !!Object.getOwnPropertyDescriptor(doc, 'baseURI');
}
function makeDocument(resource, url) {
var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
doc._URL = url;
var base = doc.createElement('base');
base.setAttribute('href', url);
if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
Object.defineProperty(doc, 'baseURI', { value: url });
}
var meta = doc.createElement('meta');
meta.setAttribute('charset', 'utf-8');
doc.head.appendChild(meta);
doc.head.appendChild(base);
doc.body.innerHTML = resource;
if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
HTMLTemplateElement.bootstrap(doc);
}
return doc;
}
if (!document.baseURI) {
var baseURIDescriptor = {
get: function () {
var base = document.querySelector('base');
return base ? base.href : window.location.href;
},
configurable: true
};
Object.defineProperty(document, 'baseURI', baseURIDescriptor);
Object.defineProperty(rootDocument, 'baseURI', baseURIDescriptor);
}
scope.importer = importer;
scope.importLoader = importLoader;
});
window.HTMLImports.addModule(function (scope) {
var parser = scope.parser;
var importer = scope.importer;
var dynamic = {
added: function (nodes) {
var owner, parsed, loading;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (!owner) {
owner = n.ownerDocument;
parsed = parser.isParsed(owner);
}
loading = this.shouldLoadNode(n);
if (loading) {
importer.loadNode(n);
}
if (this.shouldParseNode(n) && parsed) {
parser.parseDynamic(n, loading);
}
}
},
shouldLoadNode: function (node) {
return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
},
shouldParseNode: function (node) {
return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
}
};
importer.observer.addCallback = dynamic.added.bind(dynamic);
var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});
(function (scope) {
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (scope.useNative) {
return;
}
initializeModules();
var rootDocument = scope.rootDocument;
function bootstrap() {
window.HTMLImports.importer.bootDocument(rootDocument);
}
if (document.readyState === 'complete' || document.readyState === 'interactive' && !window.attachEvent) {
bootstrap();
} else {
document.addEventListener('DOMContentLoaded', bootstrap);
}
}(window.HTMLImports));
window.CustomElements = window.CustomElements || { flags: {} };
(function (scope) {
var flags = scope.flags;
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
scope.hasNative = Boolean(document.registerElement);
scope.isIE = /Trident/.test(navigator.userAgent);
scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
}(window.CustomElements));
window.CustomElements.addModule(function (scope) {
var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : 'none';
function forSubtree(node, cb) {
findAllElements(node, function (e) {
if (cb(e)) {
return true;
}
forRoots(e, cb);
});
forRoots(node, cb);
}
function findAllElements(node, find, data) {
var e = node.firstElementChild;
if (!e) {
e = node.firstChild;
while (e && e.nodeType !== Node.ELEMENT_NODE) {
e = e.nextSibling;
}
}
while (e) {
if (find(e, data) !== true) {
findAllElements(e, find, data);
}
e = e.nextElementSibling;
}
return null;
}
function forRoots(node, cb) {
var root = node.shadowRoot;
while (root) {
forSubtree(root, cb);
root = root.olderShadowRoot;
}
}
function forDocumentTree(doc, cb) {
_forDocumentTree(doc, cb, []);
}
function _forDocumentTree(doc, cb, processingDocuments) {
doc = window.wrap(doc);
if (processingDocuments.indexOf(doc) >= 0) {
return;
}
processingDocuments.push(doc);
var imports = doc.querySelectorAll('link[rel=' + IMPORT_LINK_TYPE + ']');
for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
if (n.import) {
_forDocumentTree(n.import, cb, processingDocuments);
}
}
cb(doc);
}
scope.forDocumentTree = forDocumentTree;
scope.forSubtree = forSubtree;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
var forSubtree = scope.forSubtree;
var forDocumentTree = scope.forDocumentTree;
function addedNode(node, isAttached) {
return added(node, isAttached) || addedSubtree(node, isAttached);
}
function added(node, isAttached) {
if (scope.upgrade(node, isAttached)) {
return true;
}
if (isAttached) {
attached(node);
}
}
function addedSubtree(node, isAttached) {
forSubtree(node, function (e) {
if (added(e, isAttached)) {
return true;
}
});
}
var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags['throttle-attached'];
scope.hasPolyfillMutations = hasThrottledAttached;
scope.hasThrottledAttached = hasThrottledAttached;
var isPendingMutations = false;
var pendingMutations = [];
function deferMutation(fn) {
pendingMutations.push(fn);
if (!isPendingMutations) {
isPendingMutations = true;
setTimeout(takeMutations);
}
}
function takeMutations() {
isPendingMutations = false;
var $p = pendingMutations;
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
p();
}
pendingMutations = [];
}
function attached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_attached(element);
});
} else {
_attached(element);
}
}
function _attached(element) {
if (element.__upgraded__ && !element.__attached) {
element.__attached = true;
if (element.attachedCallback) {
element.attachedCallback();
}
}
}
function detachedNode(node) {
detached(node);
forSubtree(node, function (e) {
detached(e);
});
}
function detached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_detached(element);
});
} else {
_detached(element);
}
}
function _detached(element) {
if (element.__upgraded__ && element.__attached) {
element.__attached = false;
if (element.detachedCallback) {
element.detachedCallback();
}
}
}
function inDocument(element) {
var p = element;
var doc = window.wrap(document);
while (p) {
if (p == doc) {
return true;
}
p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
}
}
function watchShadow(node) {
if (node.shadowRoot && !node.shadowRoot.__watched) {
flags.dom && console.log('watching shadow-root for: ', node.localName);
var root = node.shadowRoot;
while (root) {
observe(root);
root = root.olderShadowRoot;
}
}
}
function handler(root, mutations) {
if (flags.dom) {
var mx = mutations[0];
if (mx && mx.type === 'childList' && mx.addedNodes) {
if (mx.addedNodes) {
var d = mx.addedNodes[0];
while (d && d !== document && !d.host) {
d = d.parentNode;
}
var u = d && (d.URL || d._URL || d.host && d.host.localName) || '';
u = u.split('/?').shift().split('/').pop();
}
}
console.group('mutations (%d) [%s]', mutations.length, u || '');
}
var isAttached = inDocument(root);
mutations.forEach(function (mx) {
if (mx.type === 'childList') {
forEach(mx.addedNodes, function (n) {
if (!n.localName) {
return;
}
addedNode(n, isAttached);
});
forEach(mx.removedNodes, function (n) {
if (!n.localName) {
return;
}
detachedNode(n);
});
}
});
flags.dom && console.groupEnd();
}
function takeRecords(node) {
node = window.wrap(node);
if (!node) {
node = window.wrap(document);
}
while (node.parentNode) {
node = node.parentNode;
}
var observer = node.__observer;
if (observer) {
handler(node, observer.takeRecords());
takeMutations();
}
}
var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
function observe(inRoot) {
if (inRoot.__observer) {
return;
}
var observer = new MutationObserver(handler.bind(this, inRoot));
observer.observe(inRoot, {
childList: true,
subtree: true
});
inRoot.__observer = observer;
}
function upgradeDocument(doc) {
doc = window.wrap(doc);
flags.dom && console.group('upgradeDocument: ', doc.baseURI.split('/').pop());
var isMainDocument = doc === window.wrap(document);
addedNode(doc, isMainDocument);
observe(doc);
flags.dom && console.groupEnd();
}
function upgradeDocumentTree(doc) {
forDocumentTree(doc, upgradeDocument);
}
var originalCreateShadowRoot = Element.prototype.createShadowRoot;
if (originalCreateShadowRoot) {
Element.prototype.createShadowRoot = function () {
var root = originalCreateShadowRoot.call(this);
window.CustomElements.watchShadow(this);
return root;
};
}
scope.watchShadow = watchShadow;
scope.upgradeDocumentTree = upgradeDocumentTree;
scope.upgradeDocument = upgradeDocument;
scope.upgradeSubtree = addedSubtree;
scope.upgradeAll = addedNode;
scope.attached = attached;
scope.takeRecords = takeRecords;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
function upgrade(node, isAttached) {
if (node.localName === 'template') {
if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(node);
}
}
if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
var is = node.getAttribute('is');
var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
if (definition) {
if (is && definition.tag == node.localName || !is && !definition.extends) {
return upgradeWithDefinition(node, definition, isAttached);
}
}
}
}
function upgradeWithDefinition(element, definition, isAttached) {
flags.upgrade && console.group('upgrade:', element.localName);
if (definition.is) {
element.setAttribute('is', definition.is);
}
implementPrototype(element, definition);
element.__upgraded__ = true;
created(element);
if (isAttached) {
scope.attached(element);
}
scope.upgradeSubtree(element, isAttached);
flags.upgrade && console.groupEnd();
return element;
}
function implementPrototype(element, definition) {
if (Object.__proto__) {
element.__proto__ = definition.prototype;
} else {
customMixin(element, definition.prototype, definition.native);
element.__proto__ = definition.prototype;
}
}
function customMixin(inTarget, inSrc, inNative) {
var used = {};
var p = inSrc;
while (p !== inNative && p !== HTMLElement.prototype) {
var keys = Object.getOwnPropertyNames(p);
for (var i = 0, k; k = keys[i]; i++) {
if (!used[k]) {
Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
used[k] = 1;
}
}
p = Object.getPrototypeOf(p);
}
}
function created(element) {
if (element.createdCallback) {
element.createdCallback();
}
}
scope.upgrade = upgrade;
scope.upgradeWithDefinition = upgradeWithDefinition;
scope.implementPrototype = implementPrototype;
});
window.CustomElements.addModule(function (scope) {
var isIE = scope.isIE;
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeAll = scope.upgradeAll;
var upgradeWithDefinition = scope.upgradeWithDefinition;
var implementPrototype = scope.implementPrototype;
var useNative = scope.useNative;
function register(name, options) {
var definition = options || {};
if (!name) {
throw new Error('document.registerElement: first argument `name` must not be empty');
}
if (name.indexOf('-') < 0) {
throw new Error('document.registerElement: first argument (\'name\') must contain a dash (\'-\'). Argument provided was \'' + String(name) + '\'.');
}
if (isReservedTag(name)) {
throw new Error('Failed to execute \'registerElement\' on \'Document\': Registration failed for type \'' + String(name) + '\'. The type name is invalid.');
}
if (getRegisteredDefinition(name)) {
throw new Error('DuplicateDefinitionError: a type with name \'' + String(name) + '\' is already registered');
}
if (!definition.prototype) {
definition.prototype = Object.create(HTMLElement.prototype);
}
definition.__name = name.toLowerCase();
if (definition.extends) {
definition.extends = definition.extends.toLowerCase();
}
definition.lifecycle = definition.lifecycle || {};
definition.ancestry = ancestry(definition.extends);
resolveTagName(definition);
resolvePrototypeChain(definition);
overrideAttributeApi(definition.prototype);
registerDefinition(definition.__name, definition);
definition.ctor = generateConstructor(definition);
definition.ctor.prototype = definition.prototype;
definition.prototype.constructor = definition.ctor;
if (scope.ready) {
upgradeDocumentTree(document);
}
return definition.ctor;
}
function overrideAttributeApi(prototype) {
if (prototype.setAttribute._polyfilled) {
return;
}
var setAttribute = prototype.setAttribute;
prototype.setAttribute = function (name, value) {
changeAttribute.call(this, name, value, setAttribute);
};
var removeAttribute = prototype.removeAttribute;
prototype.removeAttribute = function (name) {
changeAttribute.call(this, name, null, removeAttribute);
};
prototype.setAttribute._polyfilled = true;
}
function changeAttribute(name, value, operation) {
name = name.toLowerCase();
var oldValue = this.getAttribute(name);
operation.apply(this, arguments);
var newValue = this.getAttribute(name);
if (this.attributeChangedCallback && newValue !== oldValue) {
this.attributeChangedCallback(name, oldValue, newValue);
}
}
function isReservedTag(name) {
for (var i = 0; i < reservedTagList.length; i++) {
if (name === reservedTagList[i]) {
return true;
}
}
}
var reservedTagList = [
'annotation-xml',
'color-profile',
'font-face',
'font-face-src',
'font-face-uri',
'font-face-format',
'font-face-name',
'missing-glyph'
];
function ancestry(extnds) {
var extendee = getRegisteredDefinition(extnds);
if (extendee) {
return ancestry(extendee.extends).concat([extendee]);
}
return [];
}
function resolveTagName(definition) {
var baseTag = definition.extends;
for (var i = 0, a; a = definition.ancestry[i]; i++) {
baseTag = a.is && a.tag;
}
definition.tag = baseTag || definition.__name;
if (baseTag) {
definition.is = definition.__name;
}
}
function resolvePrototypeChain(definition) {
if (!Object.__proto__) {
var nativePrototype = HTMLElement.prototype;
if (definition.is) {
var inst = document.createElement(definition.tag);
nativePrototype = Object.getPrototypeOf(inst);
}
var proto = definition.prototype, ancestor;
var foundPrototype = false;
while (proto) {
if (proto == nativePrototype) {
foundPrototype = true;
}
ancestor = Object.getPrototypeOf(proto);
if (ancestor) {
proto.__proto__ = ancestor;
}
proto = ancestor;
}
if (!foundPrototype) {
console.warn(definition.tag + ' prototype not found in prototype chain for ' + definition.is);
}
definition.native = nativePrototype;
}
}
function instantiate(definition) {
return upgradeWithDefinition(domCreateElement(definition.tag), definition);
}
var registry = {};
function getRegisteredDefinition(name) {
if (name) {
return registry[name.toLowerCase()];
}
}
function registerDefinition(name, definition) {
registry[name] = definition;
}
function generateConstructor(definition) {
return function () {
return instantiate(definition);
};
}
var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
function createElementNS(namespace, tag, typeExtension) {
if (namespace === HTML_NAMESPACE) {
return createElement(tag, typeExtension);
} else {
return domCreateElementNS(namespace, tag);
}
}
function createElement(tag, typeExtension) {
if (tag) {
tag = tag.toLowerCase();
}
if (typeExtension) {
typeExtension = typeExtension.toLowerCase();
}
var definition = getRegisteredDefinition(typeExtension || tag);
if (definition) {
if (tag == definition.tag && typeExtension == definition.is) {
return new definition.ctor();
}
if (!typeExtension && !definition.is) {
return new definition.ctor();
}
}
var element;
if (typeExtension) {
element = createElement(tag);
element.setAttribute('is', typeExtension);
return element;
}
element = domCreateElement(tag);
if (tag.indexOf('-') >= 0) {
implementPrototype(element, HTMLElement);
}
return element;
}
var domCreateElement = document.createElement.bind(document);
var domCreateElementNS = document.createElementNS.bind(document);
var isInstance;
if (!Object.__proto__ && !useNative) {
isInstance = function (obj, ctor) {
if (obj instanceof ctor) {
return true;
}
var p = obj;
while (p) {
if (p === ctor.prototype) {
return true;
}
p = p.__proto__;
}
return false;
};
} else {
isInstance = function (obj, base) {
return obj instanceof base;
};
}
function wrapDomMethodToForceUpgrade(obj, methodName) {
var orig = obj[methodName];
obj[methodName] = function () {
var n = orig.apply(this, arguments);
upgradeAll(n);
return n;
};
}
wrapDomMethodToForceUpgrade(Node.prototype, 'cloneNode');
wrapDomMethodToForceUpgrade(document, 'importNode');
document.registerElement = register;
document.createElement = createElement;
document.createElementNS = createElementNS;
scope.registry = registry;
scope.instanceof = isInstance;
scope.reservedTagList = reservedTagList;
scope.getRegisteredDefinition = getRegisteredDefinition;
document.register = document.registerElement;
});
(function (scope) {
var useNative = scope.useNative;
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (useNative) {
var nop = function () {
};
scope.watchShadow = nop;
scope.upgrade = nop;
scope.upgradeAll = nop;
scope.upgradeDocumentTree = nop;
scope.upgradeSubtree = nop;
scope.takeRecords = nop;
scope.instanceof = function (obj, base) {
return obj instanceof base;
};
} else {
initializeModules();
}
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeDocument = scope.upgradeDocument;
if (!window.wrap) {
if (window.ShadowDOMPolyfill) {
window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
} else {
window.wrap = window.unwrap = function (node) {
return node;
};
}
}
if (window.HTMLImports) {
window.HTMLImports.__importsParsingHook = function (elt) {
if (elt.import) {
upgradeDocument(wrap(elt.import));
}
};
}
function bootstrap() {
upgradeDocumentTree(window.wrap(document));
window.CustomElements.ready = true;
var requestAnimationFrame = window.requestAnimationFrame || function (f) {
setTimeout(f, 16);
};
requestAnimationFrame(function () {
setTimeout(function () {
window.CustomElements.readyTime = Date.now();
if (window.HTMLImports) {
window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
}
document.dispatchEvent(new CustomEvent('WebComponentsReady', { bubbles: true }));
});
});
}
if (document.readyState === 'complete' || scope.flags.eager) {
bootstrap();
} else if (document.readyState === 'interactive' && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
bootstrap();
} else {
var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? 'HTMLImportsLoaded' : 'DOMContentLoaded';
window.addEventListener(loadEvent, bootstrap);
}
}(window.CustomElements));
(function (scope) {
var style = document.createElement('style');
style.textContent = '' + 'body {' + 'transition: opacity ease-in 0.2s;' + ' } \n' + 'body[unresolved] {' + 'opacity: 0; display: block; overflow: hidden; position: relative;' + ' } \n';
var head = document.querySelector('head');
head.insertBefore(style, head.firstChild);
}(window.WebComponents));
(function () {
function resolve() {
document.body.removeAttribute('unresolved');
}
if (window.WebComponents) {
addEventListener('WebComponentsReady', resolve);
} else {
if (document.readyState === 'interactive' || document.readyState === 'complete') {
resolve();
} else {
addEventListener('DOMContentLoaded', resolve);
}
}
}());
window.Polymer = {
Settings: function () {
var settings = window.Polymer || {};
if (!settings.noUrlSettings) {
var parts = location.search.slice(1).split('&');
for (var i = 0, o; i < parts.length && (o = parts[i]); i++) {
o = o.split('=');
o[0] && (settings[o[0]] = o[1] || true);
}
}
settings.wantShadow = settings.dom === 'shadow';
settings.hasShadow = Boolean(Element.prototype.createShadowRoot);
settings.nativeShadow = settings.hasShadow && !window.ShadowDOMPolyfill;
settings.useShadow = settings.wantShadow && settings.hasShadow;
settings.hasNativeImports = Boolean('import' in document.createElement('link'));
settings.useNativeImports = settings.hasNativeImports;
settings.useNativeCustomElements = !window.CustomElements || window.CustomElements.useNative;
settings.useNativeShadow = settings.useShadow && settings.nativeShadow;
settings.usePolyfillProto = !settings.useNativeCustomElements && !Object.__proto__;
settings.hasNativeCSSProperties = !navigator.userAgent.match('AppleWebKit/601') && window.CSS && CSS.supports && CSS.supports('box-shadow', '0 0 0 var(--foo)');
settings.useNativeCSSProperties = settings.hasNativeCSSProperties && settings.lazyRegister && settings.useNativeCSSProperties;
settings.isIE = navigator.userAgent.match('Trident');
return settings;
}()
};
(function () {
var userPolymer = window.Polymer;
window.Polymer = function (prototype) {
if (typeof prototype === 'function') {
prototype = prototype.prototype;
}
if (!prototype) {
prototype = {};
}
prototype = desugar(prototype);
var customCtor = prototype === prototype.constructor.prototype ? prototype.constructor : null;
var options = { prototype: prototype };
if (prototype.extends) {
options.extends = prototype.extends;
}
Polymer.telemetry._registrate(prototype);
var ctor = document.registerElement(prototype.is, options);
return customCtor || ctor;
};
var desugar = function (prototype) {
var base = Polymer.Base;
if (prototype.extends) {
base = Polymer.Base._getExtendedPrototype(prototype.extends);
}
prototype = Polymer.Base.chainObject(prototype, base);
prototype.registerCallback();
return prototype;
};
if (userPolymer) {
for (var i in userPolymer) {
Polymer[i] = userPolymer[i];
}
}
Polymer.Class = function (prototype) {
if (!prototype.factoryImpl) {
prototype.factoryImpl = function () {
};
}
return desugar(prototype).constructor;
};
}());
Polymer.telemetry = {
registrations: [],
_regLog: function (prototype) {
console.log('[' + prototype.is + ']: registered');
},
_registrate: function (prototype) {
this.registrations.push(prototype);
Polymer.log && this._regLog(prototype);
},
dumpRegistrations: function () {
this.registrations.forEach(this._regLog);
}
};
Object.defineProperty(window, 'currentImport', {
enumerable: true,
configurable: true,
get: function () {
return (document._currentScript || document.currentScript || {}).ownerDocument;
}
});
Polymer.RenderStatus = {
_ready: false,
_callbacks: [],
whenReady: function (cb) {
if (this._ready) {
cb();
} else {
this._callbacks.push(cb);
}
},
_makeReady: function () {
this._ready = true;
for (var i = 0; i < this._callbacks.length; i++) {
this._callbacks[i]();
}
this._callbacks = [];
},
_catchFirstRender: function () {
requestAnimationFrame(function () {
Polymer.RenderStatus._makeReady();
});
},
_afterNextRenderQueue: [],
_waitingNextRender: false,
afterNextRender: function (element, fn, args) {
this._watchNextRender();
this._afterNextRenderQueue.push([
element,
fn,
args
]);
},
hasRendered: function () {
return this._ready;
},
_watchNextRender: function () {
if (!this._waitingNextRender) {
this._waitingNextRender = true;
var fn = function () {
Polymer.RenderStatus._flushNextRender();
};
if (!this._ready) {
this.whenReady(fn);
} else {
requestAnimationFrame(fn);
}
}
},
_flushNextRender: function () {
var self = this;
setTimeout(function () {
self._flushRenderCallbacks(self._afterNextRenderQueue);
self._afterNextRenderQueue = [];
self._waitingNextRender = false;
});
},
_flushRenderCallbacks: function (callbacks) {
for (var i = 0, h; i < callbacks.length; i++) {
h = callbacks[i];
h[1].apply(h[0], h[2] || Polymer.nar);
}
}
};
if (window.HTMLImports) {
HTMLImports.whenReady(function () {
Polymer.RenderStatus._catchFirstRender();
});
} else {
Polymer.RenderStatus._catchFirstRender();
}
Polymer.ImportStatus = Polymer.RenderStatus;
Polymer.ImportStatus.whenLoaded = Polymer.ImportStatus.whenReady;
(function () {
'use strict';
var settings = Polymer.Settings;
Polymer.Base = {
__isPolymerInstance__: true,
_addFeature: function (feature) {
this.mixin(this, feature);
},
registerCallback: function () {
if (settings.lazyRegister === 'max') {
if (this.beforeRegister) {
this.beforeRegister();
}
} else {
this._desugarBehaviors();
for (var i = 0, b; i < this.behaviors.length; i++) {
b = this.behaviors[i];
if (b.beforeRegister) {
b.beforeRegister.call(this);
}
}
if (this.beforeRegister) {
this.beforeRegister();
}
}
this._registerFeatures();
if (!settings.lazyRegister) {
this.ensureRegisterFinished();
}
},
createdCallback: function () {
if (settings.disableUpgradeEnabled) {
if (this.hasAttribute('disable-upgrade')) {
this._propertySetter = disableUpgradePropertySetter;
this._configValue = null;
this.__data__ = {};
return;
} else {
this.__hasInitialized = true;
}
}
this.__initialize();
},
__initialize: function () {
if (!this.__hasRegisterFinished) {
this._ensureRegisterFinished(this.__proto__);
}
Polymer.telemetry.instanceCount++;
this.root = this;
for (var i = 0, b; i < this.behaviors.length; i++) {
b = this.behaviors[i];
if (b.created) {
b.created.call(this);
}
}
if (this.created) {
this.created();
}
this._initFeatures();
},
ensureRegisterFinished: function () {
this._ensureRegisterFinished(this);
},
_ensureRegisterFinished: function (proto) {
if (proto.__hasRegisterFinished !== proto.is || !proto.is) {
if (settings.lazyRegister === 'max') {
proto._desugarBehaviors();
for (var i = 0, b; i < proto.behaviors.length; i++) {
b = proto.behaviors[i];
if (b.beforeRegister) {
b.beforeRegister.call(proto);
}
}
}
proto.__hasRegisterFinished = proto.is;
if (proto._finishRegisterFeatures) {
proto._finishRegisterFeatures();
}
for (var j = 0, pb; j < proto.behaviors.length; j++) {
pb = proto.behaviors[j];
if (pb.registered) {
pb.registered.call(proto);
}
}
if (proto.registered) {
proto.registered();
}
if (settings.usePolyfillProto && proto !== this) {
proto.extend(this, proto);
}
}
},
attachedCallback: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self.isAttached = true;
for (var i = 0, b; i < self.behaviors.length; i++) {
b = self.behaviors[i];
if (b.attached) {
b.attached.call(self);
}
}
if (self.attached) {
self.attached();
}
});
},
detachedCallback: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self.isAttached = false;
for (var i = 0, b; i < self.behaviors.length; i++) {
b = self.behaviors[i];
if (b.detached) {
b.detached.call(self);
}
}
if (self.detached) {
self.detached();
}
});
},
attributeChangedCallback: function (name, oldValue, newValue) {
this._attributeChangedImpl(name);
for (var i = 0, b; i < this.behaviors.length; i++) {
b = this.behaviors[i];
if (b.attributeChanged) {
b.attributeChanged.call(this, name, oldValue, newValue);
}
}
if (this.attributeChanged) {
this.attributeChanged(name, oldValue, newValue);
}
},
_attributeChangedImpl: function (name) {
this._setAttributeToProperty(this, name);
},
extend: function (target, source) {
if (target && source) {
var n$ = Object.getOwnPropertyNames(source);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
this.copyOwnProperty(n, source, target);
}
}
return target || source;
},
mixin: function (target, source) {
for (var i in source) {
target[i] = source[i];
}
return target;
},
copyOwnProperty: function (name, source, target) {
var pd = Object.getOwnPropertyDescriptor(source, name);
if (pd) {
Object.defineProperty(target, name, pd);
}
},
_logger: function (level, args) {
if (args.length === 1 && Array.isArray(args[0])) {
args = args[0];
}
switch (level) {
case 'log':
case 'warn':
case 'error':
console[level].apply(console, args);
break;
}
},
_log: function () {
var args = Array.prototype.slice.call(arguments, 0);
this._logger('log', args);
},
_warn: function () {
var args = Array.prototype.slice.call(arguments, 0);
this._logger('warn', args);
},
_error: function () {
var args = Array.prototype.slice.call(arguments, 0);
this._logger('error', args);
},
_logf: function () {
return this._logPrefix.concat(this.is).concat(Array.prototype.slice.call(arguments, 0));
}
};
Polymer.Base._logPrefix = function () {
var color = window.chrome && !/edge/i.test(navigator.userAgent) || /firefox/i.test(navigator.userAgent);
return color ? [
'%c[%s::%s]:',
'font-weight: bold; background-color:#EEEE00;'
] : ['[%s::%s]:'];
}();
Polymer.Base.chainObject = function (object, inherited) {
if (object && inherited && object !== inherited) {
if (!Object.__proto__) {
object = Polymer.Base.extend(Object.create(inherited), object);
}
object.__proto__ = inherited;
}
return object;
};
Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);
Polymer.BaseDescriptors = {};
var disableUpgradePropertySetter;
if (settings.disableUpgradeEnabled) {
disableUpgradePropertySetter = function (property, value) {
this.__data__[property] = value;
};
var origAttributeChangedCallback = Polymer.Base.attributeChangedCallback;
Polymer.Base.attributeChangedCallback = function (name, oldValue, newValue) {
if (!this.__hasInitialized && name === 'disable-upgrade') {
this.__hasInitialized = true;
this._propertySetter = Polymer.Bind._modelApi._propertySetter;
this._configValue = Polymer.Base._configValue;
this.__initialize();
}
origAttributeChangedCallback.call(this, name, oldValue, newValue);
};
}
if (window.CustomElements) {
Polymer.instanceof = CustomElements.instanceof;
} else {
Polymer.instanceof = function (obj, ctor) {
return obj instanceof ctor;
};
}
Polymer.isInstance = function (obj) {
return Boolean(obj && obj.__isPolymerInstance__);
};
Polymer.telemetry.instanceCount = 0;
}());
(function () {
var modules = {};
var lcModules = {};
var findModule = function (id) {
return modules[id] || lcModules[id.toLowerCase()];
};
var DomModule = function () {
return document.createElement('dom-module');
};
DomModule.prototype = Object.create(HTMLElement.prototype);
Polymer.Base.mixin(DomModule.prototype, {
createdCallback: function () {
this.register();
},
register: function (id) {
id = id || this.id || this.getAttribute('name') || this.getAttribute('is');
if (id) {
this.id = id;
modules[id] = this;
lcModules[id.toLowerCase()] = this;
}
},
import: function (id, selector) {
if (id) {
var m = findModule(id);
if (!m) {
forceDomModulesUpgrade();
m = findModule(id);
}
if (m && selector) {
m = m.querySelector(selector);
}
return m;
}
}
});
Object.defineProperty(DomModule.prototype, 'constructor', {
value: DomModule,
configurable: true,
writable: true
});
var cePolyfill = window.CustomElements && !CustomElements.useNative;
document.registerElement('dom-module', DomModule);
function forceDomModulesUpgrade() {
if (cePolyfill) {
var script = document._currentScript || document.currentScript;
var doc = script && script.ownerDocument || document;
var modules = doc.querySelectorAll('dom-module');
for (var i = modules.length - 1, m; i >= 0 && (m = modules[i]); i--) {
if (m.__upgraded__) {
return;
} else {
CustomElements.upgrade(m);
}
}
}
}
}());
Polymer.Base._addFeature({
_prepIs: function () {
if (!this.is) {
var module = (document._currentScript || document.currentScript).parentNode;
if (module.localName === 'dom-module') {
var id = module.id || module.getAttribute('name') || module.getAttribute('is');
this.is = id;
}
}
if (this.is) {
this.is = this.is.toLowerCase();
}
}
});
Polymer.Base._addFeature({
behaviors: [],
_desugarBehaviors: function () {
if (this.behaviors.length) {
this.behaviors = this._desugarSomeBehaviors(this.behaviors);
}
},
_desugarSomeBehaviors: function (behaviors) {
var behaviorSet = [];
behaviors = this._flattenBehaviorsList(behaviors);
for (var i = behaviors.length - 1; i >= 0; i--) {
var b = behaviors[i];
if (behaviorSet.indexOf(b) === -1) {
this._mixinBehavior(b);
behaviorSet.unshift(b);
}
}
return behaviorSet;
},
_flattenBehaviorsList: function (behaviors) {
var flat = [];
for (var i = 0; i < behaviors.length; i++) {
var b = behaviors[i];
if (b instanceof Array) {
flat = flat.concat(this._flattenBehaviorsList(b));
} else if (b) {
flat.push(b);
} else {
this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
}
}
return flat;
},
_mixinBehavior: function (b) {
var n$ = Object.getOwnPropertyNames(b);
var useAssignment = b._noAccessors;
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
if (!Polymer.Base._behaviorProperties[n] && !this.hasOwnProperty(n)) {
if (useAssignment) {
this[n] = b[n];
} else {
this.copyOwnProperty(n, b, this);
}
}
}
},
_prepBehaviors: function () {
this._prepFlattenedBehaviors(this.behaviors);
},
_prepFlattenedBehaviors: function (behaviors) {
for (var i = 0, l = behaviors.length; i < l; i++) {
this._prepBehavior(behaviors[i]);
}
this._prepBehavior(this);
},
_marshalBehaviors: function () {
for (var i = 0; i < this.behaviors.length; i++) {
this._marshalBehavior(this.behaviors[i]);
}
this._marshalBehavior(this);
}
});
Polymer.Base._behaviorProperties = {
hostAttributes: true,
beforeRegister: true,
registered: true,
properties: true,
observers: true,
listeners: true,
created: true,
attached: true,
detached: true,
attributeChanged: true,
ready: true,
_noAccessors: true
};
Polymer.Base._addFeature({
_getExtendedPrototype: function (tag) {
return this._getExtendedNativePrototype(tag);
},
_nativePrototypes: {},
_getExtendedNativePrototype: function (tag) {
var p = this._nativePrototypes[tag];
if (!p) {
p = Object.create(this.getNativePrototype(tag));
var p$ = Object.getOwnPropertyNames(Polymer.Base);
for (var i = 0, n; i < p$.length && (n = p$[i]); i++) {
if (!Polymer.BaseDescriptors[n]) {
p[n] = Polymer.Base[n];
}
}
Object.defineProperties(p, Polymer.BaseDescriptors);
this._nativePrototypes[tag] = p;
}
return p;
},
getNativePrototype: function (tag) {
return Object.getPrototypeOf(document.createElement(tag));
}
});
Polymer.Base._addFeature({
_prepConstructor: function () {
this._factoryArgs = this.extends ? [
this.extends,
this.is
] : [this.is];
var ctor = function () {
return this._factory(arguments);
};
if (this.hasOwnProperty('extends')) {
ctor.extends = this.extends;
}
Object.defineProperty(this, 'constructor', {
value: ctor,
writable: true,
configurable: true
});
ctor.prototype = this;
},
_factory: function (args) {
var elt = document.createElement.apply(document, this._factoryArgs);
if (this.factoryImpl) {
this.factoryImpl.apply(elt, args);
}
return elt;
}
});
Polymer.nob = Object.create(null);
Polymer.Base._addFeature({
getPropertyInfo: function (property) {
var info = this._getPropertyInfo(property, this.properties);
if (!info) {
for (var i = 0; i < this.behaviors.length; i++) {
info = this._getPropertyInfo(property, this.behaviors[i].properties);
if (info) {
return info;
}
}
}
return info || Polymer.nob;
},
_getPropertyInfo: function (property, properties) {
var p = properties && properties[property];
if (typeof p === 'function') {
p = properties[property] = { type: p };
}
if (p) {
p.defined = true;
}
return p;
},
_prepPropertyInfo: function () {
this._propertyInfo = {};
for (var i = 0; i < this.behaviors.length; i++) {
this._addPropertyInfo(this._propertyInfo, this.behaviors[i].properties);
}
this._addPropertyInfo(this._propertyInfo, this.properties);
this._addPropertyInfo(this._propertyInfo, this._propertyEffects);
},
_addPropertyInfo: function (target, source) {
if (source) {
var t, s;
for (var i in source) {
t = target[i];
s = source[i];
if (i[0] === '_' && !s.readOnly) {
continue;
}
if (!target[i]) {
target[i] = {
type: typeof s === 'function' ? s : s.type,
readOnly: s.readOnly,
attribute: Polymer.CaseMap.camelToDashCase(i)
};
} else {
if (!t.type) {
t.type = s.type;
}
if (!t.readOnly) {
t.readOnly = s.readOnly;
}
}
}
}
}
});
(function () {
var propertiesDesc = {
configurable: true,
writable: true,
enumerable: true,
value: {}
};
Polymer.BaseDescriptors.properties = propertiesDesc;
Object.defineProperty(Polymer.Base, 'properties', propertiesDesc);
}());
Polymer.CaseMap = {
_caseMap: {},
_rx: {
dashToCamel: /-[a-z]/g,
camelToDash: /([A-Z])/g
},
dashToCamelCase: function (dash) {
return this._caseMap[dash] || (this._caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(this._rx.dashToCamel, function (m) {
return m[1].toUpperCase();
}));
},
camelToDashCase: function (camel) {
return this._caseMap[camel] || (this._caseMap[camel] = camel.replace(this._rx.camelToDash, '-$1').toLowerCase());
}
};
Polymer.Base._addFeature({
_addHostAttributes: function (attributes) {
if (!this._aggregatedAttributes) {
this._aggregatedAttributes = {};
}
if (attributes) {
this.mixin(this._aggregatedAttributes, attributes);
}
},
_marshalHostAttributes: function () {
if (this._aggregatedAttributes) {
this._applyAttributes(this, this._aggregatedAttributes);
}
},
_applyAttributes: function (node, attr$) {
for (var n in attr$) {
if (!this.hasAttribute(n) && n !== 'class') {
var v = attr$[n];
this.serializeValueToAttribute(v, n, this);
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this);
},
_takeAttributesToModel: function (model) {
if (this.hasAttributes()) {
for (var i in this._propertyInfo) {
var info = this._propertyInfo[i];
if (this.hasAttribute(info.attribute)) {
this._setAttributeToProperty(model, info.attribute, i, info);
}
}
}
},
_setAttributeToProperty: function (model, attribute, property, info) {
if (!this._serializing) {
property = property || Polymer.CaseMap.dashToCamelCase(attribute);
info = info || this._propertyInfo && this._propertyInfo[property];
if (info && !info.readOnly) {
var v = this.getAttribute(attribute);
model[property] = this.deserialize(v, info.type);
}
}
},
_serializing: false,
reflectPropertyToAttribute: function (property, attribute, value) {
this._serializing = true;
value = value === undefined ? this[property] : value;
this.serializeValueToAttribute(value, attribute || Polymer.CaseMap.camelToDashCase(property));
this._serializing = false;
},
serializeValueToAttribute: function (value, attribute, node) {
var str = this.serialize(value);
node = node || this;
if (str === undefined) {
node.removeAttribute(attribute);
} else {
node.setAttribute(attribute, str);
}
},
deserialize: function (value, type) {
switch (type) {
case Number:
value = Number(value);
break;
case Boolean:
value = value != null;
break;
case Object:
try {
value = JSON.parse(value);
} catch (x) {
}
break;
case Array:
try {
value = JSON.parse(value);
} catch (x) {
value = null;
console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
}
break;
case Date:
value = new Date(value);
break;
case String:
default:
break;
}
return value;
},
serialize: function (value) {
switch (typeof value) {
case 'boolean':
return value ? '' : undefined;
case 'object':
if (value instanceof Date) {
return value.toString();
} else if (value) {
try {
return JSON.stringify(value);
} catch (x) {
return '';
}
}
default:
return value != null ? value : undefined;
}
}
});
Polymer.version = '1.9.3';
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_marshalBehavior: function (b) {
},
_initFeatures: function () {
this._marshalHostAttributes();
this._marshalBehaviors();
}
});
(function () {
function resolveCss(cssText, ownerDocument) {
return cssText.replace(CSS_URL_RX, function (m, pre, url, post) {
return pre + '\'' + resolve(url.replace(/["']/g, ''), ownerDocument) + '\'' + post;
});
}
function resolveAttrs(element, ownerDocument) {
for (var name in URL_ATTRS) {
var a$ = URL_ATTRS[name];
for (var i = 0, l = a$.length, a, at, v; i < l && (a = a$[i]); i++) {
if (name === '*' || element.localName === name) {
at = element.attributes[a];
v = at && at.value;
if (v && v.search(BINDING_RX) < 0) {
at.value = a === 'style' ? resolveCss(v, ownerDocument) : resolve(v, ownerDocument);
}
}
}
}
}
function resolve(url, ownerDocument) {
if (url && ABS_URL.test(url)) {
return url;
}
var resolver = getUrlResolver(ownerDocument);
resolver.href = url;
return resolver.href || url;
}
var tempDoc;
var tempDocBase;
function resolveUrl(url, baseUri) {
if (!tempDoc) {
tempDoc = document.implementation.createHTMLDocument('temp');
tempDocBase = tempDoc.createElement('base');
tempDoc.head.appendChild(tempDocBase);
}
tempDocBase.href = baseUri;
return resolve(url, tempDoc);
}
function getUrlResolver(ownerDocument) {
return ownerDocument.body.__urlResolver || (ownerDocument.body.__urlResolver = ownerDocument.createElement('a'));
}
function pathFromUrl(url) {
return url.substring(0, url.lastIndexOf('/') + 1);
}
var CSS_URL_RX = /(url\()([^)]*)(\))/g;
var URL_ATTRS = {
'*': [
'href',
'src',
'style',
'url'
],
form: ['action']
};
var ABS_URL = /(^\/)|(^#)|(^[\w-\d]*:)/;
var BINDING_RX = /\{\{|\[\[/;
Polymer.ResolveUrl = {
resolveCss: resolveCss,
resolveAttrs: resolveAttrs,
resolveUrl: resolveUrl,
pathFromUrl: pathFromUrl
};
Polymer.rootPath = Polymer.Settings.rootPath || pathFromUrl(document.baseURI || window.location.href);
}());
Polymer.Base._addFeature({
_prepTemplate: function () {
var module;
if (this._template === undefined) {
module = Polymer.DomModule.import(this.is);
this._template = module && module.querySelector('template');
}
if (module) {
var assetPath = module.getAttribute('assetpath') || '';
var importURL = Polymer.ResolveUrl.resolveUrl(assetPath, module.ownerDocument.baseURI);
this._importPath = Polymer.ResolveUrl.pathFromUrl(importURL);
} else {
this._importPath = '';
}
if (this._template && this._template.hasAttribute('is')) {
this._warn(this._logf('_prepTemplate', 'top-level Polymer template ' + 'must not be a type-extension, found', this._template, 'Move inside simple <template>.'));
}
if (this._template && !this._template.content && window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(this._template);
}
},
_stampTemplate: function () {
if (this._template) {
this.root = this.instanceTemplate(this._template);
}
},
instanceTemplate: function (template) {
var dom = document.importNode(template._content || template.content, true);
return dom;
}
});
(function () {
var baseAttachedCallback = Polymer.Base.attachedCallback;
var baseDetachedCallback = Polymer.Base.detachedCallback;
Polymer.Base._addFeature({
_hostStack: [],
ready: function () {
},
_registerHost: function (host) {
this.dataHost = host = host || Polymer.Base._hostStack[Polymer.Base._hostStack.length - 1];
if (host && host._clients) {
host._clients.push(this);
}
this._clients = null;
this._clientsReadied = false;
},
_beginHosting: function () {
Polymer.Base._hostStack.push(this);
if (!this._clients) {
this._clients = [];
}
},
_endHosting: function () {
Polymer.Base._hostStack.pop();
},
_tryReady: function () {
this._readied = false;
if (this._canReady()) {
this._ready();
}
},
_canReady: function () {
return !this.dataHost || this.dataHost._clientsReadied;
},
_ready: function () {
this._beforeClientsReady();
if (this._template) {
this._setupRoot();
this._readyClients();
}
this._clientsReadied = true;
this._clients = null;
this._afterClientsReady();
this._readySelf();
},
_readyClients: function () {
this._beginDistribute();
var c$ = this._clients;
if (c$) {
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._ready();
}
}
this._finishDistribute();
},
_readySelf: function () {
for (var i = 0, b; i < this.behaviors.length; i++) {
b = this.behaviors[i];
if (b.ready) {
b.ready.call(this);
}
}
if (this.ready) {
this.ready();
}
this._readied = true;
if (this._attachedPending) {
this._attachedPending = false;
this.attachedCallback();
}
},
_beforeClientsReady: function () {
},
_afterClientsReady: function () {
},
_beforeAttached: function () {
},
attachedCallback: function () {
if (this._readied) {
this._beforeAttached();
baseAttachedCallback.call(this);
} else {
this._attachedPending = true;
}
},
detachedCallback: function () {
if (this._readied) {
baseDetachedCallback.call(this);
} else {
this._attachedPending = false;
}
}
});
}());
Polymer.ArraySplice = function () {
function newSplice(index, removed, addedCount) {
return {
index: index,
removed: removed,
addedCount: addedCount
};
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function ArraySplice() {
}
ArraySplice.prototype = {
calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var rowCount = oldEnd - oldStart + 1;
var columnCount = currentEnd - currentStart + 1;
var distances = new Array(rowCount);
for (var i = 0; i < rowCount; i++) {
distances[i] = new Array(columnCount);
distances[i][0] = i;
}
for (var j = 0; j < columnCount; j++)
distances[0][j] = j;
for (i = 1; i < rowCount; i++) {
for (j = 1; j < columnCount; j++) {
if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
distances[i][j] = distances[i - 1][j - 1];
else {
var north = distances[i - 1][j] + 1;
var west = distances[i][j - 1] + 1;
distances[i][j] = north < west ? north : west;
}
}
}
return distances;
},
spliceOperationsFromEditDistances: function (distances) {
var i = distances.length - 1;
var j = distances[0].length - 1;
var current = distances[i][j];
var edits = [];
while (i > 0 || j > 0) {
if (i == 0) {
edits.push(EDIT_ADD);
j--;
continue;
}
if (j == 0) {
edits.push(EDIT_DELETE);
i--;
continue;
}
var northWest = distances[i - 1][j - 1];
var west = distances[i - 1][j];
var north = distances[i][j - 1];
var min;
if (west < north)
min = west < northWest ? west : northWest;
else
min = north < northWest ? north : northWest;
if (min == northWest) {
if (northWest == current) {
edits.push(EDIT_LEAVE);
} else {
edits.push(EDIT_UPDATE);
current = northWest;
}
i--;
j--;
} else if (min == west) {
edits.push(EDIT_DELETE);
i--;
current = west;
} else {
edits.push(EDIT_ADD);
j--;
current = north;
}
}
edits.reverse();
return edits;
},
calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var prefixCount = 0;
var suffixCount = 0;
var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
if (currentStart == 0 && oldStart == 0)
prefixCount = this.sharedPrefix(current, old, minLength);
if (currentEnd == current.length && oldEnd == old.length)
suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
currentStart += prefixCount;
oldStart += prefixCount;
currentEnd -= suffixCount;
oldEnd -= suffixCount;
if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
return [];
if (currentStart == currentEnd) {
var splice = newSplice(currentStart, [], 0);
while (oldStart < oldEnd)
splice.removed.push(old[oldStart++]);
return [splice];
} else if (oldStart == oldEnd)
return [newSplice(currentStart, [], currentEnd - currentStart)];
var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
splice = undefined;
var splices = [];
var index = currentStart;
var oldIndex = oldStart;
for (var i = 0; i < ops.length; i++) {
switch (ops[i]) {
case EDIT_LEAVE:
if (splice) {
splices.push(splice);
splice = undefined;
}
index++;
oldIndex++;
break;
case EDIT_UPDATE:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
case EDIT_ADD:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
break;
case EDIT_DELETE:
if (!splice)
splice = newSplice(index, [], 0);
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
}
}
if (splice) {
splices.push(splice);
}
return splices;
},
sharedPrefix: function (current, old, searchLength) {
for (var i = 0; i < searchLength; i++)
if (!this.equals(current[i], old[i]))
return i;
return searchLength;
},
sharedSuffix: function (current, old, searchLength) {
var index1 = current.length;
var index2 = old.length;
var count = 0;
while (count < searchLength && this.equals(current[--index1], old[--index2]))
count++;
return count;
},
calculateSplices: function (current, previous) {
return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
},
equals: function (currentValue, previousValue) {
return currentValue === previousValue;
}
};
return new ArraySplice();
}();
Polymer.domInnerHTML = function () {
var escapeAttrRegExp = /[&\u00A0"]/g;
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '"':
return '&quot;';
case '\xA0':
return '&nbsp;';
}
}
function escapeAttr(s) {
return s.replace(escapeAttrRegExp, escapeReplace);
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
function makeSet(arr) {
var set = {};
for (var i = 0; i < arr.length; i++) {
set[arr[i]] = true;
}
return set;
}
var voidElements = makeSet([
'area',
'base',
'br',
'col',
'command',
'embed',
'hr',
'img',
'input',
'keygen',
'link',
'meta',
'param',
'source',
'track',
'wbr'
]);
var plaintextParents = makeSet([
'style',
'script',
'xmp',
'iframe',
'noembed',
'noframes',
'plaintext',
'noscript'
]);
function getOuterHTML(node, parentNode, composed) {
switch (node.nodeType) {
case Node.ELEMENT_NODE:
var tagName = node.localName;
var s = '<' + tagName;
var attrs = node.attributes;
for (var i = 0, attr; attr = attrs[i]; i++) {
s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
}
s += '>';
if (voidElements[tagName]) {
return s;
}
return s + getInnerHTML(node, composed) + '</' + tagName + '>';
case Node.TEXT_NODE:
var data = node.data;
if (parentNode && plaintextParents[parentNode.localName]) {
return data;
}
return escapeData(data);
case Node.COMMENT_NODE:
return '<!--' + node.data + '-->';
default:
console.error(node);
throw new Error('not implemented');
}
}
function getInnerHTML(node, composed) {
if (node instanceof HTMLTemplateElement)
node = node.content;
var s = '';
var c$ = Polymer.dom(node).childNodes;
for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
s += getOuterHTML(child, node, composed);
}
return s;
}
return { getInnerHTML: getInnerHTML };
}();
(function () {
'use strict';
var nativeInsertBefore = Element.prototype.insertBefore;
var nativeAppendChild = Element.prototype.appendChild;
var nativeRemoveChild = Element.prototype.removeChild;
Polymer.TreeApi = {
arrayCopyChildNodes: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstChild; n; n = n.nextSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopyChildren: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstElementChild; n; n = n.nextElementSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopy: function (a$) {
var l = a$.length;
var copy = new Array(l);
for (var i = 0; i < l; i++) {
copy[i] = a$[i];
}
return copy;
}
};
Polymer.TreeApi.Logical = {
hasParentNode: function (node) {
return Boolean(node.__dom && node.__dom.parentNode);
},
hasChildNodes: function (node) {
return Boolean(node.__dom && node.__dom.childNodes !== undefined);
},
getChildNodes: function (node) {
return this.hasChildNodes(node) ? this._getChildNodes(node) : node.childNodes;
},
_getChildNodes: function (node) {
if (!node.__dom.childNodes) {
node.__dom.childNodes = [];
for (var n = node.__dom.firstChild; n; n = n.__dom.nextSibling) {
node.__dom.childNodes.push(n);
}
}
return node.__dom.childNodes;
},
getParentNode: function (node) {
return node.__dom && node.__dom.parentNode !== undefined ? node.__dom.parentNode : node.parentNode;
},
getFirstChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? node.__dom.firstChild : node.firstChild;
},
getLastChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? node.__dom.lastChild : node.lastChild;
},
getNextSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? node.__dom.nextSibling : node.nextSibling;
},
getPreviousSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? node.__dom.previousSibling : node.previousSibling;
},
getFirstElementChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? this._getFirstElementChild(node) : node.firstElementChild;
},
_getFirstElementChild: function (node) {
var n = node.__dom.firstChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getLastElementChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? this._getLastElementChild(node) : node.lastElementChild;
},
_getLastElementChild: function (node) {
var n = node.__dom.lastChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
getNextElementSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? this._getNextElementSibling(node) : node.nextElementSibling;
},
_getNextElementSibling: function (node) {
var n = node.__dom.nextSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getPreviousElementSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? this._getPreviousElementSibling(node) : node.previousElementSibling;
},
_getPreviousElementSibling: function (node) {
var n = node.__dom.previousSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
saveChildNodes: function (node) {
if (!this.hasChildNodes(node)) {
node.__dom = node.__dom || {};
node.__dom.firstChild = node.firstChild;
node.__dom.lastChild = node.lastChild;
node.__dom.childNodes = [];
for (var n = node.firstChild; n; n = n.nextSibling) {
n.__dom = n.__dom || {};
n.__dom.parentNode = node;
node.__dom.childNodes.push(n);
n.__dom.nextSibling = n.nextSibling;
n.__dom.previousSibling = n.previousSibling;
}
}
},
recordInsertBefore: function (node, container, ref_node) {
container.__dom.childNodes = null;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
for (var n = node.firstChild; n; n = n.nextSibling) {
this._linkNode(n, container, ref_node);
}
} else {
this._linkNode(node, container, ref_node);
}
},
_linkNode: function (node, container, ref_node) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (ref_node) {
ref_node.__dom = ref_node.__dom || {};
}
node.__dom.previousSibling = ref_node ? ref_node.__dom.previousSibling : container.__dom.lastChild;
if (node.__dom.previousSibling) {
node.__dom.previousSibling.__dom.nextSibling = node;
}
node.__dom.nextSibling = ref_node || null;
if (node.__dom.nextSibling) {
node.__dom.nextSibling.__dom.previousSibling = node;
}
node.__dom.parentNode = container;
if (ref_node) {
if (ref_node === container.__dom.firstChild) {
container.__dom.firstChild = node;
}
} else {
container.__dom.lastChild = node;
if (!container.__dom.firstChild) {
container.__dom.firstChild = node;
}
}
container.__dom.childNodes = null;
},
recordRemoveChild: function (node, container) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (node === container.__dom.firstChild) {
container.__dom.firstChild = node.__dom.nextSibling;
}
if (node === container.__dom.lastChild) {
container.__dom.lastChild = node.__dom.previousSibling;
}
var p = node.__dom.previousSibling;
var n = node.__dom.nextSibling;
if (p) {
p.__dom.nextSibling = n;
}
if (n) {
n.__dom.previousSibling = p;
}
node.__dom.parentNode = node.__dom.previousSibling = node.__dom.nextSibling = undefined;
container.__dom.childNodes = null;
}
};
Polymer.TreeApi.Composed = {
getChildNodes: function (node) {
return Polymer.TreeApi.arrayCopyChildNodes(node);
},
getParentNode: function (node) {
return node.parentNode;
},
clearChildNodes: function (node) {
node.textContent = '';
},
insertBefore: function (parentNode, newChild, refChild) {
return nativeInsertBefore.call(parentNode, newChild, refChild || null);
},
appendChild: function (parentNode, newChild) {
return nativeAppendChild.call(parentNode, newChild);
},
removeChild: function (parentNode, node) {
return nativeRemoveChild.call(parentNode, node);
}
};
}());
Polymer.DomApi = function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = function (node) {
this.node = needsToWrap ? DomApi.wrap(node) : node;
};
var needsToWrap = Settings.hasShadow && !Settings.nativeShadow;
DomApi.wrap = window.wrap ? window.wrap : function (node) {
return node;
};
DomApi.prototype = {
flush: function () {
Polymer.dom.flush();
},
deepContains: function (node) {
if (this.node.contains(node)) {
return true;
}
var n = node;
var doc = node.ownerDocument;
while (n && n !== doc && n !== this.node) {
n = Polymer.dom(n).parentNode || n.host;
}
return n === this.node;
},
queryDistributedElements: function (selector) {
var c$ = this.getEffectiveChildNodes();
var list = [];
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE && DomApi.matchesSelector.call(c, selector)) {
list.push(c);
}
}
return list;
},
getEffectiveChildNodes: function () {
var list = [];
var c$ = this.childNodes;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.localName === CONTENT) {
var d$ = dom(c).getDistributedNodes();
for (var j = 0; j < d$.length; j++) {
list.push(d$[j]);
}
} else {
list.push(c);
}
}
return list;
},
observeNodes: function (callback) {
if (callback) {
if (!this.observer) {
this.observer = this.node.localName === CONTENT ? new DomApi.DistributedNodesObserver(this) : new DomApi.EffectiveNodesObserver(this);
}
return this.observer.addListener(callback);
}
},
unobserveNodes: function (handle) {
if (this.observer) {
this.observer.removeListener(handle);
}
},
notifyObserver: function () {
if (this.observer) {
this.observer.notify();
}
},
_query: function (matcher, node, halter) {
node = node || this.node;
var list = [];
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
return list;
},
_queryElements: function (elements, matcher, halter, list) {
for (var i = 0, l = elements.length, c; i < l && (c = elements[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE) {
if (this._queryElement(c, matcher, halter, list)) {
return true;
}
}
}
},
_queryElement: function (node, matcher, halter, list) {
var result = matcher(node);
if (result) {
list.push(node);
}
if (halter && halter(result)) {
return result;
}
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
}
};
var CONTENT = DomApi.CONTENT = 'content';
var dom = DomApi.factory = function (node) {
node = node || document;
if (!node.__domApi) {
node.__domApi = new DomApi.ctor(node);
}
return node.__domApi;
};
DomApi.hasApi = function (node) {
return Boolean(node.__domApi);
};
DomApi.ctor = DomApi;
Polymer.dom = function (obj, patch) {
if (obj instanceof Event) {
return Polymer.EventApi.factory(obj);
} else {
return DomApi.factory(obj, patch);
}
};
var p = Element.prototype;
DomApi.matchesSelector = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
return DomApi;
}();
(function () {
'use strict';
var Settings = Polymer.Settings;
var DomApi = Polymer.DomApi;
var dom = DomApi.factory;
var TreeApi = Polymer.TreeApi;
var getInnerHTML = Polymer.domInnerHTML.getInnerHTML;
var CONTENT = DomApi.CONTENT;
if (Settings.useShadow) {
return;
}
var nativeCloneNode = Element.prototype.cloneNode;
var nativeImportNode = Document.prototype.importNode;
Polymer.Base.mixin(DomApi.prototype, {
_lazyDistribute: function (host) {
if (host.shadyRoot && host.shadyRoot._distributionClean) {
host.shadyRoot._distributionClean = false;
Polymer.dom.addDebouncer(host.debounce('_distribute', host._distributeContent));
}
},
appendChild: function (node) {
return this.insertBefore(node);
},
insertBefore: function (node, ref_node) {
if (ref_node && TreeApi.Logical.getParentNode(ref_node) !== this.node) {
throw Error('The ref_node to be inserted before is not a child ' + 'of this node');
}
if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
if (DomApi.hasApi(parent)) {
dom(parent).notifyObserver();
}
this._removeNode(node);
} else {
this._removeOwnerShadyRoot(node);
}
}
if (!this._addNode(node, ref_node)) {
if (ref_node) {
ref_node = ref_node.localName === CONTENT ? this._firstComposedNode(ref_node) : ref_node;
}
var container = this.node._isShadyRoot ? this.node.host : this.node;
if (ref_node) {
TreeApi.Composed.insertBefore(container, node, ref_node);
} else {
TreeApi.Composed.appendChild(container, node);
}
}
this.notifyObserver();
return node;
},
_addNode: function (node, ref_node) {
var root = this.getOwnerRoot();
if (root) {
var ipAdded = this._maybeAddInsertionPoint(node, this.node);
if (!root._invalidInsertionPoints) {
root._invalidInsertionPoints = ipAdded;
}
this._addNodeToHost(root.host, node);
}
if (TreeApi.Logical.hasChildNodes(this.node)) {
TreeApi.Logical.recordInsertBefore(node, this.node, ref_node);
}
var handled = this._maybeDistribute(node) || this.node.shadyRoot;
if (handled) {
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
while (node.firstChild) {
TreeApi.Composed.removeChild(node, node.firstChild);
}
} else {
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
return handled;
},
removeChild: function (node) {
if (TreeApi.Logical.getParentNode(node) !== this.node) {
throw Error('The node to be removed is not a child of this node: ' + node);
}
if (!this._removeNode(node)) {
var container = this.node._isShadyRoot ? this.node.host : this.node;
var parent = TreeApi.Composed.getParentNode(node);
if (container === parent) {
TreeApi.Composed.removeChild(container, node);
}
}
this.notifyObserver();
return node;
},
_removeNode: function (node) {
var logicalParent = TreeApi.Logical.hasParentNode(node) && TreeApi.Logical.getParentNode(node);
var distributed;
var root = this._ownerShadyRootForNode(node);
if (logicalParent) {
distributed = dom(node)._maybeDistributeParent();
TreeApi.Logical.recordRemoveChild(node, logicalParent);
if (root && this._removeDistributedChildren(root, node)) {
root._invalidInsertionPoints = true;
this._lazyDistribute(root.host);
}
}
this._removeOwnerShadyRoot(node);
if (root) {
this._removeNodeFromHost(root.host, node);
}
return distributed;
},
replaceChild: function (node, ref_node) {
this.insertBefore(node, ref_node);
this.removeChild(ref_node);
return node;
},
_hasCachedOwnerRoot: function (node) {
return Boolean(node._ownerShadyRoot !== undefined);
},
getOwnerRoot: function () {
return this._ownerShadyRootForNode(this.node);
},
_ownerShadyRootForNode: function (node) {
if (!node) {
return;
}
var root = node._ownerShadyRoot;
if (root === undefined) {
if (node._isShadyRoot) {
root = node;
} else {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
root = parent._isShadyRoot ? parent : this._ownerShadyRootForNode(parent);
} else {
root = null;
}
}
if (root || document.documentElement.contains(node)) {
node._ownerShadyRoot = root;
}
}
return root;
},
_maybeDistribute: function (node) {
var fragContent = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent && dom(node).querySelector(CONTENT);
var wrappedContent = fragContent && TreeApi.Logical.getParentNode(fragContent).nodeType !== Node.DOCUMENT_FRAGMENT_NODE;
var hasContent = fragContent || node.localName === CONTENT;
if (hasContent) {
var root = this.getOwnerRoot();
if (root) {
this._lazyDistribute(root.host);
}
}
var needsDist = this._nodeNeedsDistribution(this.node);
if (needsDist) {
this._lazyDistribute(this.node);
}
return needsDist || hasContent && !wrappedContent;
},
_maybeAddInsertionPoint: function (node, parent) {
var added;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent) {
var c$ = dom(node).querySelectorAll(CONTENT);
for (var i = 0, n, np, na; i < c$.length && (n = c$[i]); i++) {
np = TreeApi.Logical.getParentNode(n);
if (np === node) {
np = parent;
}
na = this._maybeAddInsertionPoint(n, np);
added = added || na;
}
} else if (node.localName === CONTENT) {
TreeApi.Logical.saveChildNodes(parent);
TreeApi.Logical.saveChildNodes(node);
added = true;
}
return added;
},
_updateInsertionPoints: function (host) {
var i$ = host.shadyRoot._insertionPoints = dom(host.shadyRoot).querySelectorAll(CONTENT);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(TreeApi.Logical.getParentNode(c));
}
},
_nodeNeedsDistribution: function (node) {
return node && node.shadyRoot && DomApi.hasInsertionPoint(node.shadyRoot);
},
_addNodeToHost: function (host, node) {
if (host._elementAdd) {
host._elementAdd(node);
}
},
_removeNodeFromHost: function (host, node) {
if (host._elementRemove) {
host._elementRemove(node);
}
},
_removeDistributedChildren: function (root, container) {
var hostNeedsDist;
var ip$ = root._insertionPoints;
for (var i = 0; i < ip$.length; i++) {
var content = ip$[i];
if (this._contains(container, content)) {
var dc$ = dom(content).getDistributedNodes();
for (var j = 0; j < dc$.length; j++) {
hostNeedsDist = true;
var node = dc$[j];
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
}
return hostNeedsDist;
},
_contains: function (container, node) {
while (node) {
if (node == container) {
return true;
}
node = TreeApi.Logical.getParentNode(node);
}
},
_removeOwnerShadyRoot: function (node) {
if (this._hasCachedOwnerRoot(node)) {
var c$ = TreeApi.Logical.getChildNodes(node);
for (var i = 0, l = c$.length, n; i < l && (n = c$[i]); i++) {
this._removeOwnerShadyRoot(n);
}
}
node._ownerShadyRoot = undefined;
},
_firstComposedNode: function (content) {
var n$ = dom(content).getDistributedNodes();
for (var i = 0, l = n$.length, n, p$; i < l && (n = n$[i]); i++) {
p$ = dom(n).getDestinationInsertionPoints();
if (p$[p$.length - 1] === content) {
return n;
}
}
},
querySelector: function (selector) {
var result = this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node, function (n) {
return Boolean(n);
})[0];
return result || null;
},
querySelectorAll: function (selector) {
return this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node);
},
getDestinationInsertionPoints: function () {
return this.node._destinationInsertionPoints || [];
},
getDistributedNodes: function () {
return this.node._distributedNodes || [];
},
_clear: function () {
while (this.childNodes.length) {
this.removeChild(this.childNodes[0]);
}
},
setAttribute: function (name, value) {
this.node.setAttribute(name, value);
this._maybeDistributeParent();
},
removeAttribute: function (name) {
this.node.removeAttribute(name);
this._maybeDistributeParent();
},
_maybeDistributeParent: function () {
if (this._nodeNeedsDistribution(this.parentNode)) {
this._lazyDistribute(this.parentNode);
return true;
}
},
cloneNode: function (deep) {
var n = nativeCloneNode.call(this.node, false);
if (deep) {
var c$ = this.childNodes;
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(c$[i]).cloneNode(true);
d.appendChild(nc);
}
}
return n;
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
var n = nativeImportNode.call(doc, externalNode, false);
if (deep) {
var c$ = TreeApi.Logical.getChildNodes(externalNode);
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(doc).importNode(c$[i], true);
d.appendChild(nc);
}
}
return n;
},
_getComposedInnerHTML: function () {
return getInnerHTML(this.node, true);
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var active = document.activeElement;
if (!active) {
return null;
}
var isShadyRoot = !!this.node._isShadyRoot;
if (this.node !== document) {
if (!isShadyRoot) {
return null;
}
if (this.node.host === active || !this.node.host.contains(active)) {
return null;
}
}
var activeRoot = dom(active).getOwnerRoot();
while (activeRoot && activeRoot !== this.node) {
active = activeRoot.host;
activeRoot = dom(active).getOwnerRoot();
}
if (this.node === document) {
return activeRoot ? null : active;
} else {
return activeRoot === this.node ? active : null;
}
},
configurable: true
},
childNodes: {
get: function () {
var c$ = TreeApi.Logical.getChildNodes(this.node);
return Array.isArray(c$) ? c$ : TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
if (TreeApi.Logical.hasChildNodes(this.node)) {
return Array.prototype.filter.call(this.childNodes, function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
} else {
return TreeApi.arrayCopyChildren(this.node);
}
},
configurable: true
},
parentNode: {
get: function () {
return TreeApi.Logical.getParentNode(this.node);
},
configurable: true
},
firstChild: {
get: function () {
return TreeApi.Logical.getFirstChild(this.node);
},
configurable: true
},
lastChild: {
get: function () {
return TreeApi.Logical.getLastChild(this.node);
},
configurable: true
},
nextSibling: {
get: function () {
return TreeApi.Logical.getNextSibling(this.node);
},
configurable: true
},
previousSibling: {
get: function () {
return TreeApi.Logical.getPreviousSibling(this.node);
},
configurable: true
},
firstElementChild: {
get: function () {
return TreeApi.Logical.getFirstElementChild(this.node);
},
configurable: true
},
lastElementChild: {
get: function () {
return TreeApi.Logical.getLastElementChild(this.node);
},
configurable: true
},
nextElementSibling: {
get: function () {
return TreeApi.Logical.getNextElementSibling(this.node);
},
configurable: true
},
previousElementSibling: {
get: function () {
return TreeApi.Logical.getPreviousElementSibling(this.node);
},
configurable: true
},
textContent: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return this.node.textContent;
} else {
var tc = [];
for (var i = 0, cn = this.childNodes, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(c.textContent);
}
}
return tc.join('');
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
this.node.textContent = text;
} else {
this._clear();
if (text) {
this.appendChild(document.createTextNode(text));
}
}
},
configurable: true
},
innerHTML: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return null;
} else {
return getInnerHTML(this.node);
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt !== Node.TEXT_NODE || nt !== Node.COMMENT_NODE) {
this._clear();
var d = document.createElement('div');
d.innerHTML = text;
var c$ = TreeApi.arrayCopyChildNodes(d);
for (var i = 0; i < c$.length; i++) {
this.appendChild(c$[i]);
}
}
},
configurable: true
}
});
DomApi.hasInsertionPoint = function (root) {
return Boolean(root && root._insertionPoints.length);
};
}());
(function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = Polymer.DomApi;
if (!Settings.useShadow) {
return;
}
Polymer.Base.mixin(DomApi.prototype, {
querySelectorAll: function (selector) {
return TreeApi.arrayCopy(this.node.querySelectorAll(selector));
},
getOwnerRoot: function () {
var n = this.node;
while (n) {
if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
return n;
}
n = n.parentNode;
}
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
return doc.importNode(externalNode, deep);
},
getDestinationInsertionPoints: function () {
var n$ = this.node.getDestinationInsertionPoints && this.node.getDestinationInsertionPoints();
return n$ ? TreeApi.arrayCopy(n$) : [];
},
getDistributedNodes: function () {
var n$ = this.node.getDistributedNodes && this.node.getDistributedNodes();
return n$ ? TreeApi.arrayCopy(n$) : [];
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var node = DomApi.wrap(this.node);
var activeElement = node.activeElement;
return node.contains(activeElement) ? activeElement : null;
},
configurable: true
},
childNodes: {
get: function () {
return TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
return TreeApi.arrayCopyChildren(this.node);
},
configurable: true
},
textContent: {
get: function () {
return this.node.textContent;
},
set: function (value) {
return this.node.textContent = value;
},
configurable: true
},
innerHTML: {
get: function () {
return this.node.innerHTML;
},
set: function (value) {
return this.node.innerHTML = value;
},
configurable: true
}
});
var forwardMethods = function (m$) {
for (var i = 0; i < m$.length; i++) {
forwardMethod(m$[i]);
}
};
var forwardMethod = function (method) {
DomApi.prototype[method] = function () {
return this.node[method].apply(this.node, arguments);
};
};
forwardMethods([
'cloneNode',
'appendChild',
'insertBefore',
'removeChild',
'replaceChild',
'setAttribute',
'removeAttribute',
'querySelector'
]);
var forwardProperties = function (f$) {
for (var i = 0; i < f$.length; i++) {
forwardProperty(f$[i]);
}
};
var forwardProperty = function (name) {
Object.defineProperty(DomApi.prototype, name, {
get: function () {
return this.node[name];
},
configurable: true
});
};
forwardProperties([
'parentNode',
'firstChild',
'lastChild',
'nextSibling',
'previousSibling',
'firstElementChild',
'lastElementChild',
'nextElementSibling',
'previousElementSibling'
]);
}());
Polymer.Base.mixin(Polymer.dom, {
_flushGuard: 0,
_FLUSH_MAX: 100,
_needsTakeRecords: !Polymer.Settings.useNativeCustomElements,
_debouncers: [],
_staticFlushList: [],
_finishDebouncer: null,
flush: function () {
this._flushGuard = 0;
this._prepareFlush();
while (this._debouncers.length && this._flushGuard < this._FLUSH_MAX) {
while (this._debouncers.length) {
this._debouncers.shift().complete();
}
if (this._finishDebouncer) {
this._finishDebouncer.complete();
}
this._prepareFlush();
this._flushGuard++;
}
if (this._flushGuard >= this._FLUSH_MAX) {
console.warn('Polymer.dom.flush aborted. Flush may not be complete.');
}
},
_prepareFlush: function () {
if (this._needsTakeRecords) {
CustomElements.takeRecords();
}
for (var i = 0; i < this._staticFlushList.length; i++) {
this._staticFlushList[i]();
}
},
addStaticFlush: function (fn) {
this._staticFlushList.push(fn);
},
removeStaticFlush: function (fn) {
var i = this._staticFlushList.indexOf(fn);
if (i >= 0) {
this._staticFlushList.splice(i, 1);
}
},
addDebouncer: function (debouncer) {
this._debouncers.push(debouncer);
this._finishDebouncer = Polymer.Debounce(this._finishDebouncer, this._finishFlush);
},
_finishFlush: function () {
Polymer.dom._debouncers = [];
}
});
Polymer.EventApi = function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.Event = function (event) {
this.event = event;
};
if (Settings.useShadow) {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.path[0];
},
get localTarget() {
return this.event.target;
},
get path() {
var path = this.event.path;
if (!Array.isArray(path)) {
path = Array.prototype.slice.call(path);
}
return path;
}
};
} else {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.target;
},
get localTarget() {
var current = this.event.currentTarget;
var currentRoot = current && Polymer.dom(current).getOwnerRoot();
var p$ = this.path;
for (var i = 0; i < p$.length; i++) {
if (Polymer.dom(p$[i]).getOwnerRoot() === currentRoot) {
return p$[i];
}
}
},
get path() {
if (!this.event._path) {
var path = [];
var current = this.rootTarget;
while (current) {
path.push(current);
var insertionPoints = Polymer.dom(current).getDestinationInsertionPoints();
if (insertionPoints.length) {
for (var i = 0; i < insertionPoints.length - 1; i++) {
path.push(insertionPoints[i]);
}
current = insertionPoints[insertionPoints.length - 1];
} else {
current = Polymer.dom(current).parentNode || current.host;
}
}
path.push(window);
this.event._path = path;
}
return this.event._path;
}
};
}
var factory = function (event) {
if (!event.__eventApi) {
event.__eventApi = new DomApi.Event(event);
}
return event.__eventApi;
};
return { factory: factory };
}();
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var useShadow = Polymer.Settings.useShadow;
Object.defineProperty(DomApi.prototype, 'classList', {
get: function () {
if (!this._classList) {
this._classList = new DomApi.ClassList(this);
}
return this._classList;
},
configurable: true
});
DomApi.ClassList = function (host) {
this.domApi = host;
this.node = host.node;
};
DomApi.ClassList.prototype = {
add: function () {
this.node.classList.add.apply(this.node.classList, arguments);
this._distributeParent();
},
remove: function () {
this.node.classList.remove.apply(this.node.classList, arguments);
this._distributeParent();
},
toggle: function () {
this.node.classList.toggle.apply(this.node.classList, arguments);
this._distributeParent();
},
_distributeParent: function () {
if (!useShadow) {
this.domApi._maybeDistributeParent();
}
},
contains: function () {
return this.node.classList.contains.apply(this.node.classList, arguments);
}
};
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.EffectiveNodesObserver = function (domApi) {
this.domApi = domApi;
this.node = this.domApi.node;
this._listeners = [];
};
DomApi.EffectiveNodesObserver.prototype = {
addListener: function (callback) {
if (!this._isSetup) {
this._setup();
this._isSetup = true;
}
var listener = {
fn: callback,
_nodes: []
};
this._listeners.push(listener);
this._scheduleNotify();
return listener;
},
removeListener: function (handle) {
var i = this._listeners.indexOf(handle);
if (i >= 0) {
this._listeners.splice(i, 1);
handle._nodes = [];
}
if (!this._hasListeners()) {
this._cleanup();
this._isSetup = false;
}
},
_setup: function () {
this._observeContentElements(this.domApi.childNodes);
},
_cleanup: function () {
this._unobserveContentElements(this.domApi.childNodes);
},
_hasListeners: function () {
return Boolean(this._listeners.length);
},
_scheduleNotify: function () {
if (this._debouncer) {
this._debouncer.stop();
}
this._debouncer = Polymer.Debounce(this._debouncer, this._notify);
this._debouncer.context = this;
Polymer.dom.addDebouncer(this._debouncer);
},
notify: function () {
if (this._hasListeners()) {
this._scheduleNotify();
}
},
_notify: function () {
this._beforeCallListeners();
this._callListeners();
},
_beforeCallListeners: function () {
this._updateContentElements();
},
_updateContentElements: function () {
this._observeContentElements(this.domApi.childNodes);
},
_observeContentElements: function (elements) {
for (var i = 0, n; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
n.__observeNodesMap = n.__observeNodesMap || new WeakMap();
if (!n.__observeNodesMap.has(this)) {
n.__observeNodesMap.set(this, this._observeContent(n));
}
}
}
},
_observeContent: function (content) {
var self = this;
var h = Polymer.dom(content).observeNodes(function () {
self._scheduleNotify();
});
h._avoidChangeCalculation = true;
return h;
},
_unobserveContentElements: function (elements) {
for (var i = 0, n, h; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
h = n.__observeNodesMap.get(this);
if (h) {
Polymer.dom(n).unobserveNodes(h);
n.__observeNodesMap.delete(this);
}
}
}
},
_isContent: function (node) {
return node.localName === 'content';
},
_callListeners: function () {
var o$ = this._listeners;
var nodes = this._getEffectiveNodes();
for (var i = 0, o; i < o$.length && (o = o$[i]); i++) {
var info = this._generateListenerInfo(o, nodes);
if (info || o._alwaysNotify) {
this._callListener(o, info);
}
}
},
_getEffectiveNodes: function () {
return this.domApi.getEffectiveChildNodes();
},
_generateListenerInfo: function (listener, newNodes) {
if (listener._avoidChangeCalculation) {
return true;
}
var oldNodes = listener._nodes;
var info = {
target: this.node,
addedNodes: [],
removedNodes: []
};
var splices = Polymer.ArraySplice.calculateSplices(newNodes, oldNodes);
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
info.removedNodes.push(n);
}
}
for (i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (j = s.index; j < s.index + s.addedCount; j++) {
info.addedNodes.push(newNodes[j]);
}
}
listener._nodes = newNodes;
if (info.addedNodes.length || info.removedNodes.length) {
return info;
}
},
_callListener: function (listener, info) {
return listener.fn.call(this.node, info);
},
enableShadowAttributeTracking: function () {
}
};
if (Settings.useShadow) {
var baseSetup = DomApi.EffectiveNodesObserver.prototype._setup;
var baseCleanup = DomApi.EffectiveNodesObserver.prototype._cleanup;
Polymer.Base.mixin(DomApi.EffectiveNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var self = this;
this._mutationHandler = function (mxns) {
if (mxns && mxns.length) {
self._scheduleNotify();
}
};
this._observer = new MutationObserver(this._mutationHandler);
this._boundFlush = function () {
self._flush();
};
Polymer.dom.addStaticFlush(this._boundFlush);
this._observer.observe(this.node, { childList: true });
}
baseSetup.call(this);
},
_cleanup: function () {
this._observer.disconnect();
this._observer = null;
this._mutationHandler = null;
Polymer.dom.removeStaticFlush(this._boundFlush);
baseCleanup.call(this);
},
_flush: function () {
if (this._observer) {
this._mutationHandler(this._observer.takeRecords());
}
},
enableShadowAttributeTracking: function () {
if (this._observer) {
this._makeContentListenersAlwaysNotify();
this._observer.disconnect();
this._observer.observe(this.node, {
childList: true,
attributes: true,
subtree: true
});
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host && Polymer.dom(host).observer) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
},
_makeContentListenersAlwaysNotify: function () {
for (var i = 0, h; i < this._listeners.length; i++) {
h = this._listeners[i];
h._alwaysNotify = h._isContentListener;
}
}
});
}
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.DistributedNodesObserver = function (domApi) {
DomApi.EffectiveNodesObserver.call(this, domApi);
};
DomApi.DistributedNodesObserver.prototype = Object.create(DomApi.EffectiveNodesObserver.prototype);
Polymer.Base.mixin(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
},
_cleanup: function () {
},
_beforeCallListeners: function () {
},
_getEffectiveNodes: function () {
return this.domApi.getDistributedNodes();
}
});
if (Settings.useShadow) {
Polymer.Base.mixin(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
var self = this;
this._observer = Polymer.dom(host).observeNodes(function () {
self._scheduleNotify();
});
this._observer._isContentListener = true;
if (this._hasAttrSelect()) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
}
},
_hasAttrSelect: function () {
var select = this.node.getAttribute('select');
return select && select.match(/[[.]+/);
},
_cleanup: function () {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
Polymer.dom(host).unobserveNodes(this._observer);
}
this._observer = null;
}
});
}
}());
(function () {
var DomApi = Polymer.DomApi;
var TreeApi = Polymer.TreeApi;
Polymer.Base._addFeature({
_prepShady: function () {
this._useContent = this._useContent || Boolean(this._template);
},
_setupShady: function () {
this.shadyRoot = null;
if (!this.__domApi) {
this.__domApi = null;
}
if (!this.__dom) {
this.__dom = null;
}
if (!this._ownerShadyRoot) {
this._ownerShadyRoot = undefined;
}
},
_poolContent: function () {
if (this._useContent) {
TreeApi.Logical.saveChildNodes(this);
}
},
_setupRoot: function () {
if (this._useContent) {
this._createLocalRoot();
if (!this.dataHost) {
upgradeLogicalChildren(TreeApi.Logical.getChildNodes(this));
}
}
},
_createLocalRoot: function () {
this.shadyRoot = this.root;
this.shadyRoot._distributionClean = false;
this.shadyRoot._hasDistributed = false;
this.shadyRoot._isShadyRoot = true;
this.shadyRoot._dirtyRoots = [];
var i$ = this.shadyRoot._insertionPoints = !this._notes || this._notes._hasContent ? this.shadyRoot.querySelectorAll('content') : [];
TreeApi.Logical.saveChildNodes(this.shadyRoot);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(c.parentNode);
}
this.shadyRoot.host = this;
},
distributeContent: function (updateInsertionPoints) {
if (this.shadyRoot) {
this.shadyRoot._invalidInsertionPoints = this.shadyRoot._invalidInsertionPoints || updateInsertionPoints;
var host = getTopDistributingHost(this);
Polymer.dom(this)._lazyDistribute(host);
}
},
_distributeContent: function () {
if (this._useContent && !this.shadyRoot._distributionClean) {
if (this.shadyRoot._invalidInsertionPoints) {
Polymer.dom(this)._updateInsertionPoints(this);
this.shadyRoot._invalidInsertionPoints = false;
}
this._beginDistribute();
this._distributeDirtyRoots();
this._finishDistribute();
}
},
_beginDistribute: function () {
if (this._useContent && DomApi.hasInsertionPoint(this.shadyRoot)) {
this._resetDistribution();
this._distributePool(this.shadyRoot, this._collectPool());
}
},
_distributeDirtyRoots: function () {
var c$ = this.shadyRoot._dirtyRoots;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._distributeContent();
}
this.shadyRoot._dirtyRoots = [];
},
_finishDistribute: function () {
if (this._useContent) {
this.shadyRoot._distributionClean = true;
if (DomApi.hasInsertionPoint(this.shadyRoot)) {
this._composeTree();
notifyContentObservers(this.shadyRoot);
} else {
if (!this.shadyRoot._hasDistributed) {
TreeApi.Composed.clearChildNodes(this);
this.appendChild(this.shadyRoot);
} else {
var children = this._composeNode(this);
this._updateChildNodes(this, children);
}
}
if (!this.shadyRoot._hasDistributed) {
notifyInitialDistribution(this);
}
this.shadyRoot._hasDistributed = true;
}
},
elementMatches: function (selector, node) {
node = node || this;
return DomApi.matchesSelector.call(node, selector);
},
_resetDistribution: function () {
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (child._destinationInsertionPoints) {
child._destinationInsertionPoints = undefined;
}
if (isInsertionPoint(child)) {
clearDistributedDestinationInsertionPoints(child);
}
}
var root = this.shadyRoot;
var p$ = root._insertionPoints;
for (var j = 0; j < p$.length; j++) {
p$[j]._distributedNodes = [];
}
},
_collectPool: function () {
var pool = [];
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (isInsertionPoint(child)) {
pool.push.apply(pool, child._distributedNodes);
} else {
pool.push(child);
}
}
return pool;
},
_distributePool: function (node, pool) {
var p$ = node._insertionPoints;
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
this._distributeInsertionPoint(p, pool);
maybeRedistributeParent(p, this);
}
},
_distributeInsertionPoint: function (content, pool) {
var anyDistributed = false;
for (var i = 0, l = pool.length, node; i < l; i++) {
node = pool[i];
if (!node) {
continue;
}
if (this._matchesContentSelect(node, content)) {
distributeNodeInto(node, content);
pool[i] = undefined;
anyDistributed = true;
}
}
if (!anyDistributed) {
var children = TreeApi.Logical.getChildNodes(content);
for (var j = 0; j < children.length; j++) {
distributeNodeInto(children[j], content);
}
}
},
_composeTree: function () {
this._updateChildNodes(this, this._composeNode(this));
var p$ = this.shadyRoot._insertionPoints;
for (var i = 0, l = p$.length, p, parent; i < l && (p = p$[i]); i++) {
parent = TreeApi.Logical.getParentNode(p);
if (!parent._useContent && parent !== this && parent !== this.shadyRoot) {
this._updateChildNodes(parent, this._composeNode(parent));
}
}
},
_composeNode: function (node) {
var children = [];
var c$ = TreeApi.Logical.getChildNodes(node.shadyRoot || node);
for (var i = 0; i < c$.length; i++) {
var child = c$[i];
if (isInsertionPoint(child)) {
var distributedNodes = child._distributedNodes;
for (var j = 0; j < distributedNodes.length; j++) {
var distributedNode = distributedNodes[j];
if (isFinalDestination(child, distributedNode)) {
children.push(distributedNode);
}
}
} else {
children.push(child);
}
}
return children;
},
_updateChildNodes: function (container, children) {
var composed = TreeApi.Composed.getChildNodes(container);
var splices = Polymer.ArraySplice.calculateSplices(children, composed);
for (var i = 0, d = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
if (TreeApi.Composed.getParentNode(n) === container) {
TreeApi.Composed.removeChild(container, n);
}
composed.splice(s.index + d, 1);
}
d -= s.addedCount;
}
for (var i = 0, s, next; i < splices.length && (s = splices[i]); i++) {
next = composed[s.index];
for (j = s.index, n; j < s.index + s.addedCount; j++) {
n = children[j];
TreeApi.Composed.insertBefore(container, n, next);
composed.splice(j, 0, n);
}
}
},
_matchesContentSelect: function (node, contentElement) {
var select = contentElement.getAttribute('select');
if (!select) {
return true;
}
select = select.trim();
if (!select) {
return true;
}
if (!(node instanceof Element)) {
return false;
}
var validSelectors = /^(:not\()?[*.#[a-zA-Z_|]/;
if (!validSelectors.test(select)) {
return false;
}
return this.elementMatches(select, node);
},
_elementAdd: function () {
},
_elementRemove: function () {
}
});
var domHostDesc = {
get: function () {
var root = Polymer.dom(this).getOwnerRoot();
return root && root.host;
},
configurable: true
};
Object.defineProperty(Polymer.Base, 'domHost', domHostDesc);
Polymer.BaseDescriptors.domHost = domHostDesc;
function distributeNodeInto(child, insertionPoint) {
insertionPoint._distributedNodes.push(child);
var points = child._destinationInsertionPoints;
if (!points) {
child._destinationInsertionPoints = [insertionPoint];
} else {
points.push(insertionPoint);
}
}
function clearDistributedDestinationInsertionPoints(content) {
var e$ = content._distributedNodes;
if (e$) {
for (var i = 0; i < e$.length; i++) {
var d = e$[i]._destinationInsertionPoints;
if (d) {
d.splice(d.indexOf(content) + 1, d.length);
}
}
}
}
function maybeRedistributeParent(content, host) {
var parent = TreeApi.Logical.getParentNode(content);
if (parent && parent.shadyRoot && DomApi.hasInsertionPoint(parent.shadyRoot) && parent.shadyRoot._distributionClean) {
parent.shadyRoot._distributionClean = false;
host.shadyRoot._dirtyRoots.push(parent);
}
}
function isFinalDestination(insertionPoint, node) {
var points = node._destinationInsertionPoints;
return points && points[points.length - 1] === insertionPoint;
}
function isInsertionPoint(node) {
return node.localName == 'content';
}
function getTopDistributingHost(host) {
while (host && hostNeedsRedistribution(host)) {
host = host.domHost;
}
return host;
}
function hostNeedsRedistribution(host) {
var c$ = TreeApi.Logical.getChildNodes(host);
for (var i = 0, c; i < c$.length; i++) {
c = c$[i];
if (c.localName && c.localName === 'content') {
return host.domHost;
}
}
}
function notifyContentObservers(root) {
for (var i = 0, c; i < root._insertionPoints.length; i++) {
c = root._insertionPoints[i];
if (DomApi.hasApi(c)) {
Polymer.dom(c).notifyObserver();
}
}
}
function notifyInitialDistribution(host) {
if (DomApi.hasApi(host)) {
Polymer.dom(host).notifyObserver();
}
}
var needsUpgrade = window.CustomElements && !CustomElements.useNative;
function upgradeLogicalChildren(children) {
if (needsUpgrade && children) {
for (var i = 0; i < children.length; i++) {
CustomElements.upgrade(children[i]);
}
}
}
}());
if (Polymer.Settings.useShadow) {
Polymer.Base._addFeature({
_poolContent: function () {
},
_beginDistribute: function () {
},
distributeContent: function () {
},
_distributeContent: function () {
},
_finishDistribute: function () {
},
_createLocalRoot: function () {
this.createShadowRoot();
this.shadowRoot.appendChild(this.root);
this.root = this.shadowRoot;
}
});
}
Polymer.Async = {
_currVal: 0,
_lastVal: 0,
_callbacks: [],
_twiddleContent: 0,
_twiddle: document.createTextNode(''),
run: function (callback, waitTime) {
if (waitTime > 0) {
return ~setTimeout(callback, waitTime);
} else {
this._twiddle.textContent = this._twiddleContent++;
this._callbacks.push(callback);
return this._currVal++;
}
},
cancel: function (handle) {
if (handle < 0) {
clearTimeout(~handle);
} else {
var idx = handle - this._lastVal;
if (idx >= 0) {
if (!this._callbacks[idx]) {
throw 'invalid async handle: ' + handle;
}
this._callbacks[idx] = null;
}
}
},
_atEndOfMicrotask: function () {
var len = this._callbacks.length;
for (var i = 0; i < len; i++) {
var cb = this._callbacks[i];
if (cb) {
try {
cb();
} catch (e) {
i++;
this._callbacks.splice(0, i);
this._lastVal += i;
this._twiddle.textContent = this._twiddleContent++;
throw e;
}
}
}
this._callbacks.splice(0, len);
this._lastVal += len;
}
};
new window.MutationObserver(function () {
Polymer.Async._atEndOfMicrotask();
}).observe(Polymer.Async._twiddle, { characterData: true });
Polymer.Debounce = function () {
var Async = Polymer.Async;
var Debouncer = function (context) {
this.context = context;
var self = this;
this.boundComplete = function () {
self.complete();
};
};
Debouncer.prototype = {
go: function (callback, wait) {
var h;
this.finish = function () {
Async.cancel(h);
};
h = Async.run(this.boundComplete, wait);
this.callback = callback;
},
stop: function () {
if (this.finish) {
this.finish();
this.finish = null;
this.callback = null;
}
},
complete: function () {
if (this.finish) {
var callback = this.callback;
this.stop();
callback.call(this.context);
}
}
};
function debounce(debouncer, callback, wait) {
if (debouncer) {
debouncer.stop();
} else {
debouncer = new Debouncer(this);
}
debouncer.go(callback, wait);
return debouncer;
}
return debounce;
}();
Polymer.Base._addFeature({
_setupDebouncers: function () {
this._debouncers = {};
},
debounce: function (jobName, callback, wait) {
return this._debouncers[jobName] = Polymer.Debounce.call(this, this._debouncers[jobName], callback, wait);
},
isDebouncerActive: function (jobName) {
var debouncer = this._debouncers[jobName];
return !!(debouncer && debouncer.finish);
},
flushDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.complete();
}
},
cancelDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.stop();
}
}
});
Polymer.DomModule = document.createElement('dom-module');
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepTemplate();
this._prepShady();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._registerHost();
if (this._template) {
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
}
this._marshalHostAttributes();
this._setupDebouncers();
this._marshalBehaviors();
this._tryReady();
},
_marshalBehavior: function (b) {
}
});
(function () {
Polymer.nar = [];
var disableUpgradeEnabled = Polymer.Settings.disableUpgradeEnabled;
Polymer.Annotations = {
parseAnnotations: function (template, stripWhiteSpace) {
var list = [];
var content = template._content || template.content;
this._parseNodeAnnotations(content, list, stripWhiteSpace || template.hasAttribute('strip-whitespace'));
return list;
},
_parseNodeAnnotations: function (node, list, stripWhiteSpace) {
return node.nodeType === Node.TEXT_NODE ? this._parseTextNodeAnnotation(node, list) : this._parseElementAnnotations(node, list, stripWhiteSpace);
},
_bindingRegex: function () {
var IDENT = '(?:' + '[a-zA-Z_$][\\w.:$\\-*]*' + ')';
var NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
var SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
var DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
var STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
var ARGUMENT = '(?:' + IDENT + '|' + NUMBER + '|' + STRING + '\\s*' + ')';
var ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
var ARGUMENT_LIST = '(?:' + '\\(\\s*' + '(?:' + ARGUMENTS + '?' + ')' + '\\)\\s*' + ')';
var BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')';
var OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
var CLOSE_BRACKET = '(?:]]|}})';
var NEGATE = '(?:(!)\\s*)?';
var EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
return new RegExp(EXPRESSION, 'g');
}(),
_parseBindings: function (text) {
var re = this._bindingRegex;
var parts = [];
var lastIndex = 0;
var m;
while ((m = re.exec(text)) !== null) {
if (m.index > lastIndex) {
parts.push({ literal: text.slice(lastIndex, m.index) });
}
var mode = m[1][0];
var negate = Boolean(m[2]);
var value = m[3].trim();
var customEvent, notifyEvent, colon;
if (mode == '{' && (colon = value.indexOf('::')) > 0) {
notifyEvent = value.substring(colon + 2);
value = value.substring(0, colon);
customEvent = true;
}
parts.push({
compoundIndex: parts.length,
value: value,
mode: mode,
negate: negate,
event: notifyEvent,
customEvent: customEvent
});
lastIndex = re.lastIndex;
}
if (lastIndex && lastIndex < text.length) {
var literal = text.substring(lastIndex);
if (literal) {
parts.push({ literal: literal });
}
}
if (parts.length) {
return parts;
}
},
_literalFromParts: function (parts) {
var s = '';
for (var i = 0; i < parts.length; i++) {
var literal = parts[i].literal;
s += literal || '';
}
return s;
},
_parseTextNodeAnnotation: function (node, list) {
var parts = this._parseBindings(node.textContent);
if (parts) {
node.textContent = this._literalFromParts(parts) || ' ';
var annote = {
bindings: [{
kind: 'text',
name: 'textContent',
parts: parts,
isCompound: parts.length !== 1
}]
};
list.push(annote);
return annote;
}
},
_parseElementAnnotations: function (element, list, stripWhiteSpace) {
var annote = {
bindings: [],
events: []
};
if (element.localName === 'content') {
list._hasContent = true;
}
this._parseChildNodesAnnotations(element, annote, list, stripWhiteSpace);
if (element.attributes) {
this._parseNodeAttributeAnnotations(element, annote, list);
if (this.prepElement) {
this.prepElement(element);
}
}
if (annote.bindings.length || annote.events.length || annote.id) {
list.push(annote);
}
return annote;
},
_parseChildNodesAnnotations: function (root, annote, list, stripWhiteSpace) {
if (root.firstChild) {
var node = root.firstChild;
var i = 0;
while (node) {
var next = node.nextSibling;
if (node.localName === 'template' && !node.hasAttribute('preserve-content')) {
this._parseTemplate(node, i, list, annote, stripWhiteSpace);
}
if (node.localName == 'slot') {
node = this._replaceSlotWithContent(node);
}
if (node.nodeType === Node.TEXT_NODE) {
var n = next;
while (n && n.nodeType === Node.TEXT_NODE) {
node.textContent += n.textContent;
next = n.nextSibling;
root.removeChild(n);
n = next;
}
if (stripWhiteSpace && !node.textContent.trim()) {
root.removeChild(node);
i--;
}
}
if (node.parentNode) {
var childAnnotation = this._parseNodeAnnotations(node, list, stripWhiteSpace);
if (childAnnotation) {
childAnnotation.parent = annote;
childAnnotation.index = i;
}
}
node = next;
i++;
}
}
},
_replaceSlotWithContent: function (slot) {
var content = slot.ownerDocument.createElement('content');
while (slot.firstChild) {
content.appendChild(slot.firstChild);
}
var attrs = slot.attributes;
for (var i = 0; i < attrs.length; i++) {
var attr = attrs[i];
content.setAttribute(attr.name, attr.value);
}
var name = slot.getAttribute('name');
if (name) {
content.setAttribute('select', '[slot=\'' + name + '\']');
}
slot.parentNode.replaceChild(content, slot);
return content;
},
_parseTemplate: function (node, index, list, parent, stripWhiteSpace) {
var content = document.createDocumentFragment();
content._notes = this.parseAnnotations(node, stripWhiteSpace);
content.appendChild(node.content);
list.push({
bindings: Polymer.nar,
events: Polymer.nar,
templateContent: content,
parent: parent,
index: index
});
},
_parseNodeAttributeAnnotations: function (node, annotation) {
var attrs = Array.prototype.slice.call(node.attributes);
for (var i = attrs.length - 1, a; a = attrs[i]; i--) {
var n = a.name;
var v = a.value;
var b;
if (n.slice(0, 3) === 'on-') {
node.removeAttribute(n);
annotation.events.push({
name: n.slice(3),
value: v
});
} else if (b = this._parseNodeAttributeAnnotation(node, n, v)) {
annotation.bindings.push(b);
} else if (n === 'id') {
annotation.id = v;
}
}
},
_parseNodeAttributeAnnotation: function (node, name, value) {
var parts = this._parseBindings(value);
if (parts) {
var origName = name;
var kind = 'property';
if (name[name.length - 1] == '$') {
name = name.slice(0, -1);
kind = 'attribute';
}
var literal = this._literalFromParts(parts);
if (literal && kind == 'attribute') {
node.setAttribute(name, literal);
}
if (node.localName === 'input' && origName === 'value') {
node.setAttribute(origName, '');
}
if (disableUpgradeEnabled && origName === 'disable-upgrade$') {
node.setAttribute(name, '');
}
node.removeAttribute(origName);
var propertyName = Polymer.CaseMap.dashToCamelCase(name);
if (kind === 'property') {
name = propertyName;
}
return {
kind: kind,
name: name,
propertyName: propertyName,
parts: parts,
literal: literal,
isCompound: parts.length !== 1
};
}
},
findAnnotatedNode: function (root, annote) {
var parent = annote.parent && Polymer.Annotations.findAnnotatedNode(root, annote.parent);
if (parent) {
for (var n = parent.firstChild, i = 0; n; n = n.nextSibling) {
if (annote.index === i++) {
return n;
}
}
} else {
return root;
}
}
};
}());
Polymer.Path = {
root: function (path) {
var dotIndex = path.indexOf('.');
if (dotIndex === -1) {
return path;
}
return path.slice(0, dotIndex);
},
isDeep: function (path) {
return path.indexOf('.') !== -1;
},
isAncestor: function (base, path) {
return base.indexOf(path + '.') === 0;
},
isDescendant: function (base, path) {
return path.indexOf(base + '.') === 0;
},
translate: function (base, newBase, path) {
return newBase + path.slice(base.length);
},
matches: function (base, wildcard, path) {
return base === path || this.isAncestor(base, path) || Boolean(wildcard) && this.isDescendant(base, path);
}
};
Polymer.Base._addFeature({
_prepAnnotations: function () {
if (!this._template) {
this._notes = [];
} else {
var self = this;
Polymer.Annotations.prepElement = function (element) {
self._prepElement(element);
};
if (this._template._content && this._template._content._notes) {
this._notes = this._template._content._notes;
} else {
this._notes = Polymer.Annotations.parseAnnotations(this._template);
this._processAnnotations(this._notes);
}
Polymer.Annotations.prepElement = null;
}
},
_processAnnotations: function (notes) {
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
for (var j = 0; j < note.bindings.length; j++) {
var b = note.bindings[j];
for (var k = 0; k < b.parts.length; k++) {
var p = b.parts[k];
if (!p.literal) {
var signature = this._parseMethod(p.value);
if (signature) {
p.signature = signature;
} else {
p.model = Polymer.Path.root(p.value);
}
}
}
}
if (note.templateContent) {
this._processAnnotations(note.templateContent._notes);
var pp = note.templateContent._parentProps = this._discoverTemplateParentProps(note.templateContent._notes);
var bindings = [];
for (var prop in pp) {
var name = '_parent_' + prop;
bindings.push({
index: note.index,
kind: 'property',
name: name,
propertyName: name,
parts: [{
mode: '{',
model: prop,
value: prop
}]
});
}
note.bindings = note.bindings.concat(bindings);
}
}
},
_discoverTemplateParentProps: function (notes) {
var pp = {};
for (var i = 0, n; i < notes.length && (n = notes[i]); i++) {
for (var j = 0, b$ = n.bindings, b; j < b$.length && (b = b$[j]); j++) {
for (var k = 0, p$ = b.parts, p; k < p$.length && (p = p$[k]); k++) {
if (p.signature) {
var args = p.signature.args;
for (var kk = 0; kk < args.length; kk++) {
var model = args[kk].model;
if (model) {
pp[model] = true;
}
}
if (p.signature.dynamicFn) {
pp[p.signature.method] = true;
}
} else {
if (p.model) {
pp[p.model] = true;
}
}
}
}
if (n.templateContent) {
var tpp = n.templateContent._parentProps;
Polymer.Base.mixin(pp, tpp);
}
}
return pp;
},
_prepElement: function (element) {
Polymer.ResolveUrl.resolveAttrs(element, this._template.ownerDocument);
},
_findAnnotatedNode: Polymer.Annotations.findAnnotatedNode,
_marshalAnnotationReferences: function () {
if (this._template) {
this._marshalIdNodes();
this._marshalAnnotatedNodes();
this._marshalAnnotatedListeners();
}
},
_configureAnnotationReferences: function () {
var notes = this._notes;
var nodes = this._nodes;
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
var node = nodes[i];
this._configureTemplateContent(note, node);
this._configureCompoundBindings(note, node);
}
},
_configureTemplateContent: function (note, node) {
if (note.templateContent) {
node._content = note.templateContent;
}
},
_configureCompoundBindings: function (note, node) {
var bindings = note.bindings;
for (var i = 0; i < bindings.length; i++) {
var binding = bindings[i];
if (binding.isCompound) {
var storage = node.__compoundStorage__ || (node.__compoundStorage__ = {});
var parts = binding.parts;
var literals = new Array(parts.length);
for (var j = 0; j < parts.length; j++) {
literals[j] = parts[j].literal;
}
var name = binding.name;
storage[name] = literals;
if (binding.literal && binding.kind == 'property') {
if (node._configValue) {
node._configValue(name, binding.literal);
} else {
node[name] = binding.literal;
}
}
}
}
},
_marshalIdNodes: function () {
this.$ = {};
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.id) {
this.$[a.id] = this._findAnnotatedNode(this.root, a);
}
}
},
_marshalAnnotatedNodes: function () {
if (this._notes && this._notes.length) {
var r = new Array(this._notes.length);
for (var i = 0; i < this._notes.length; i++) {
r[i] = this._findAnnotatedNode(this.root, this._notes[i]);
}
this._nodes = r;
}
},
_marshalAnnotatedListeners: function () {
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.events && a.events.length) {
var node = this._findAnnotatedNode(this.root, a);
for (var j = 0, e$ = a.events, e; j < e$.length && (e = e$[j]); j++) {
this.listen(node, e.name, e.value);
}
}
}
}
});
Polymer.Base._addFeature({
listeners: {},
_listenListeners: function (listeners) {
var node, name, eventName;
for (eventName in listeners) {
if (eventName.indexOf('.') < 0) {
node = this;
name = eventName;
} else {
name = eventName.split('.');
node = this.$[name[0]];
name = name[1];
}
this.listen(node, name, listeners[eventName]);
}
},
listen: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (!handler) {
handler = this._createEventHandler(node, eventName, methodName);
}
if (handler._listening) {
return;
}
this._listen(node, eventName, handler);
handler._listening = true;
},
_boundListenerKey: function (eventName, methodName) {
return eventName + ':' + methodName;
},
_recordEventHandler: function (host, eventName, target, methodName, handler) {
var hbl = host.__boundListeners;
if (!hbl) {
hbl = host.__boundListeners = new WeakMap();
}
var bl = hbl.get(target);
if (!bl) {
bl = {};
if (!Polymer.Settings.isIE || target != window) {
hbl.set(target, bl);
}
}
var key = this._boundListenerKey(eventName, methodName);
bl[key] = handler;
},
_recallEventHandler: function (host, eventName, target, methodName) {
var hbl = host.__boundListeners;
if (!hbl) {
return;
}
var bl = hbl.get(target);
if (!bl) {
return;
}
var key = this._boundListenerKey(eventName, methodName);
return bl[key];
},
_createEventHandler: function (node, eventName, methodName) {
var host = this;
var handler = function (e) {
if (host[methodName]) {
host[methodName](e, e.detail);
} else {
host._warn(host._logf('_createEventHandler', 'listener method `' + methodName + '` not defined'));
}
};
handler._listening = false;
this._recordEventHandler(host, eventName, node, methodName, handler);
return handler;
},
unlisten: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (handler) {
this._unlisten(node, eventName, handler);
handler._listening = false;
}
},
_listen: function (node, eventName, handler) {
node.addEventListener(eventName, handler);
},
_unlisten: function (node, eventName, handler) {
node.removeEventListener(eventName, handler);
}
});
(function () {
'use strict';
var wrap = Polymer.DomApi.wrap;
var HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
var GESTURE_KEY = '__polymerGestures';
var HANDLED_OBJ = '__polymerGesturesHandled';
var TOUCH_ACTION = '__polymerGesturesTouchAction';
var TAP_DISTANCE = 25;
var TRACK_DISTANCE = 5;
var TRACK_LENGTH = 2;
var MOUSE_TIMEOUT = 2500;
var MOUSE_EVENTS = [
'mousedown',
'mousemove',
'mouseup',
'click'
];
var MOUSE_WHICH_TO_BUTTONS = [
0,
1,
4,
2
];
var MOUSE_HAS_BUTTONS = function () {
try {
return new MouseEvent('test', { buttons: 1 }).buttons === 1;
} catch (e) {
return false;
}
}();
var SUPPORTS_PASSIVE = false;
(function () {
try {
var opts = Object.defineProperty({}, 'passive', {
get: function () {
SUPPORTS_PASSIVE = true;
}
});
window.addEventListener('test', null, opts);
window.removeEventListener('test', null, opts);
} catch (e) {
}
}());
var IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);
var mouseCanceller = function (mouseEvent) {
var sc = mouseEvent.sourceCapabilities;
if (sc && !sc.firesTouchEvents) {
return;
}
mouseEvent[HANDLED_OBJ] = { skip: true };
if (mouseEvent.type === 'click') {
var path = Polymer.dom(mouseEvent).path;
for (var i = 0; i < path.length; i++) {
if (path[i] === POINTERSTATE.mouse.target) {
return;
}
}
mouseEvent.preventDefault();
mouseEvent.stopPropagation();
}
};
function setupTeardownMouseCanceller(setup) {
var events = IS_TOUCH_ONLY ? ['click'] : MOUSE_EVENTS;
for (var i = 0, en; i < events.length; i++) {
en = events[i];
if (setup) {
document.addEventListener(en, mouseCanceller, true);
} else {
document.removeEventListener(en, mouseCanceller, true);
}
}
}
function ignoreMouse(ev) {
if (!POINTERSTATE.mouse.mouseIgnoreJob) {
setupTeardownMouseCanceller(true);
}
var unset = function () {
setupTeardownMouseCanceller();
POINTERSTATE.mouse.target = null;
POINTERSTATE.mouse.mouseIgnoreJob = null;
};
POINTERSTATE.mouse.target = Polymer.dom(ev).rootTarget;
POINTERSTATE.mouse.mouseIgnoreJob = Polymer.Debounce(POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
}
function hasLeftMouseButton(ev) {
var type = ev.type;
if (MOUSE_EVENTS.indexOf(type) === -1) {
return false;
}
if (type === 'mousemove') {
var buttons = ev.buttons === undefined ? 1 : ev.buttons;
if (ev instanceof window.MouseEvent && !MOUSE_HAS_BUTTONS) {
buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
}
return Boolean(buttons & 1);
} else {
var button = ev.button === undefined ? 0 : ev.button;
return button === 0;
}
}
function isSyntheticClick(ev) {
if (ev.type === 'click') {
if (ev.detail === 0) {
return true;
}
var t = Gestures.findOriginalTarget(ev);
var bcr = t.getBoundingClientRect();
var x = ev.pageX, y = ev.pageY;
return !(x >= bcr.left && x <= bcr.right && (y >= bcr.top && y <= bcr.bottom));
}
return false;
}
var POINTERSTATE = {
mouse: {
target: null,
mouseIgnoreJob: null
},
touch: {
x: 0,
y: 0,
id: -1,
scrollDecided: false
}
};
function firstTouchAction(ev) {
var path = Polymer.dom(ev).path;
var ta = 'auto';
for (var i = 0, n; i < path.length; i++) {
n = path[i];
if (n[TOUCH_ACTION]) {
ta = n[TOUCH_ACTION];
break;
}
}
return ta;
}
function trackDocument(stateObj, movefn, upfn) {
stateObj.movefn = movefn;
stateObj.upfn = upfn;
document.addEventListener('mousemove', movefn);
document.addEventListener('mouseup', upfn);
}
function untrackDocument(stateObj) {
document.removeEventListener('mousemove', stateObj.movefn);
document.removeEventListener('mouseup', stateObj.upfn);
stateObj.movefn = null;
stateObj.upfn = null;
}
document.addEventListener('touchend', ignoreMouse, SUPPORTS_PASSIVE ? { passive: true } : false);
var Gestures = {
gestures: {},
recognizers: [],
deepTargetFind: function (x, y) {
var node = document.elementFromPoint(x, y);
var next = node;
while (next && next.shadowRoot) {
next = next.shadowRoot.elementFromPoint(x, y);
if (next) {
node = next;
}
}
return node;
},
findOriginalTarget: function (ev) {
if (ev.path) {
return ev.path[0];
}
return ev.target;
},
handleNative: function (ev) {
var handled;
var type = ev.type;
var node = wrap(ev.currentTarget);
var gobj = node[GESTURE_KEY];
if (!gobj) {
return;
}
var gs = gobj[type];
if (!gs) {
return;
}
if (!ev[HANDLED_OBJ]) {
ev[HANDLED_OBJ] = {};
if (type.slice(0, 5) === 'touch') {
var t = ev.changedTouches[0];
if (type === 'touchstart') {
if (ev.touches.length === 1) {
POINTERSTATE.touch.id = t.identifier;
}
}
if (POINTERSTATE.touch.id !== t.identifier) {
return;
}
if (!HAS_NATIVE_TA) {
if (type === 'touchstart' || type === 'touchmove') {
Gestures.handleTouchAction(ev);
}
}
}
}
handled = ev[HANDLED_OBJ];
if (handled.skip) {
return;
}
var recognizers = Gestures.recognizers;
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
if (r.flow && r.flow.start.indexOf(ev.type) > -1 && r.reset) {
r.reset();
}
}
}
for (i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
handled[r.name] = true;
r[type](ev);
}
}
},
handleTouchAction: function (ev) {
var t = ev.changedTouches[0];
var type = ev.type;
if (type === 'touchstart') {
POINTERSTATE.touch.x = t.clientX;
POINTERSTATE.touch.y = t.clientY;
POINTERSTATE.touch.scrollDecided = false;
} else if (type === 'touchmove') {
if (POINTERSTATE.touch.scrollDecided) {
return;
}
POINTERSTATE.touch.scrollDecided = true;
var ta = firstTouchAction(ev);
var prevent = false;
var dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
var dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
if (!ev.cancelable) {
} else if (ta === 'none') {
prevent = true;
} else if (ta === 'pan-x') {
prevent = dy > dx;
} else if (ta === 'pan-y') {
prevent = dx > dy;
}
if (prevent) {
ev.preventDefault();
} else {
Gestures.prevent('track');
}
}
},
add: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (!gobj) {
node[GESTURE_KEY] = gobj = {};
}
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1 && dep !== 'click') {
continue;
}
gd = gobj[dep];
if (!gd) {
gobj[dep] = gd = { _count: 0 };
}
if (gd._count === 0) {
node.addEventListener(dep, this.handleNative);
}
gd[name] = (gd[name] || 0) + 1;
gd._count = (gd._count || 0) + 1;
}
node.addEventListener(evType, handler);
if (recognizer.touchAction) {
this.setTouchAction(node, recognizer.touchAction);
}
},
remove: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (gobj) {
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
gd = gobj[dep];
if (gd && gd[name]) {
gd[name] = (gd[name] || 1) - 1;
gd._count = (gd._count || 1) - 1;
if (gd._count === 0) {
node.removeEventListener(dep, this.handleNative);
}
}
}
}
node.removeEventListener(evType, handler);
},
register: function (recog) {
this.recognizers.push(recog);
for (var i = 0; i < recog.emits.length; i++) {
this.gestures[recog.emits[i]] = recog;
}
},
findRecognizerByEvent: function (evName) {
for (var i = 0, r; i < this.recognizers.length; i++) {
r = this.recognizers[i];
for (var j = 0, n; j < r.emits.length; j++) {
n = r.emits[j];
if (n === evName) {
return r;
}
}
}
return null;
},
setTouchAction: function (node, value) {
if (HAS_NATIVE_TA) {
node.style.touchAction = value;
}
node[TOUCH_ACTION] = value;
},
fire: function (target, type, detail) {
var ev = Polymer.Base.fire(type, detail, {
node: target,
bubbles: true,
cancelable: true
});
if (ev.defaultPrevented) {
var preventer = detail.preventer || detail.sourceEvent;
if (preventer && preventer.preventDefault) {
preventer.preventDefault();
}
}
},
prevent: function (evName) {
var recognizer = this.findRecognizerByEvent(evName);
if (recognizer.info) {
recognizer.info.prevent = true;
}
},
resetMouseCanceller: function () {
if (POINTERSTATE.mouse.mouseIgnoreJob) {
POINTERSTATE.mouse.mouseIgnoreJob.complete();
}
}
};
Gestures.register({
name: 'downup',
deps: [
'mousedown',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: [
'down',
'up'
],
info: {
movefn: null,
upfn: null
},
reset: function () {
untrackDocument(this.info);
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
if (!hasLeftMouseButton(e)) {
self.fire('up', t, e);
untrackDocument(self.info);
}
};
var upfn = function upfn(e) {
if (hasLeftMouseButton(e)) {
self.fire('up', t, e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.fire('down', t, e);
},
touchstart: function (e) {
this.fire('down', Gestures.findOriginalTarget(e), e.changedTouches[0], e);
},
touchend: function (e) {
this.fire('up', Gestures.findOriginalTarget(e), e.changedTouches[0], e);
},
fire: function (type, target, event, preventer) {
Gestures.fire(target, type, {
x: event.clientX,
y: event.clientY,
sourceEvent: event,
preventer: preventer,
prevent: function (e) {
return Gestures.prevent(e);
}
});
}
});
Gestures.register({
name: 'track',
touchAction: 'none',
deps: [
'mousedown',
'touchstart',
'touchmove',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: ['track'],
info: {
x: 0,
y: 0,
state: 'start',
started: false,
moves: [],
addMove: function (move) {
if (this.moves.length > TRACK_LENGTH) {
this.moves.shift();
}
this.moves.push(move);
},
movefn: null,
upfn: null,
prevent: false
},
reset: function () {
this.info.state = 'start';
this.info.started = false;
this.info.moves = [];
this.info.x = 0;
this.info.y = 0;
this.info.prevent = false;
untrackDocument(this.info);
},
hasMovedEnough: function (x, y) {
if (this.info.prevent) {
return false;
}
if (this.info.started) {
return true;
}
var dx = Math.abs(this.info.x - x);
var dy = Math.abs(this.info.y - y);
return dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE;
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
var x = e.clientX, y = e.clientY;
if (self.hasMovedEnough(x, y)) {
self.info.state = self.info.started ? e.type === 'mouseup' ? 'end' : 'track' : 'start';
if (self.info.state === 'start') {
Gestures.prevent('tap');
}
self.info.addMove({
x: x,
y: y
});
if (!hasLeftMouseButton(e)) {
self.info.state = 'end';
untrackDocument(self.info);
}
self.fire(t, e);
self.info.started = true;
}
};
var upfn = function upfn(e) {
if (self.info.started) {
movefn(e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.info.x = e.clientX;
this.info.y = e.clientY;
},
touchstart: function (e) {
var ct = e.changedTouches[0];
this.info.x = ct.clientX;
this.info.y = ct.clientY;
},
touchmove: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
var x = ct.clientX, y = ct.clientY;
if (this.hasMovedEnough(x, y)) {
if (this.info.state === 'start') {
Gestures.prevent('tap');
}
this.info.addMove({
x: x,
y: y
});
this.fire(t, ct);
this.info.state = 'track';
this.info.started = true;
}
},
touchend: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
if (this.info.started) {
this.info.state = 'end';
this.info.addMove({
x: ct.clientX,
y: ct.clientY
});
this.fire(t, ct, e);
}
},
fire: function (target, touch, preventer) {
var secondlast = this.info.moves[this.info.moves.length - 2];
var lastmove = this.info.moves[this.info.moves.length - 1];
var dx = lastmove.x - this.info.x;
var dy = lastmove.y - this.info.y;
var ddx, ddy = 0;
if (secondlast) {
ddx = lastmove.x - secondlast.x;
ddy = lastmove.y - secondlast.y;
}
return Gestures.fire(target, 'track', {
state: this.info.state,
x: touch.clientX,
y: touch.clientY,
dx: dx,
dy: dy,
ddx: ddx,
ddy: ddy,
sourceEvent: touch,
preventer: preventer,
hover: function () {
return Gestures.deepTargetFind(touch.clientX, touch.clientY);
}
});
}
});
Gestures.register({
name: 'tap',
deps: [
'mousedown',
'click',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'click',
'touchend'
]
},
emits: ['tap'],
info: {
x: NaN,
y: NaN,
prevent: false
},
reset: function () {
this.info.x = NaN;
this.info.y = NaN;
this.info.prevent = false;
},
save: function (e) {
this.info.x = e.clientX;
this.info.y = e.clientY;
},
mousedown: function (e) {
if (hasLeftMouseButton(e)) {
this.save(e);
}
},
click: function (e) {
if (hasLeftMouseButton(e)) {
this.forward(e);
}
},
touchstart: function (e) {
this.save(e.changedTouches[0], e);
},
touchend: function (e) {
this.forward(e.changedTouches[0], e);
},
forward: function (e, preventer) {
var dx = Math.abs(e.clientX - this.info.x);
var dy = Math.abs(e.clientY - this.info.y);
var t = Gestures.findOriginalTarget(e);
if (isNaN(dx) || isNaN(dy) || dx <= TAP_DISTANCE && dy <= TAP_DISTANCE || isSyntheticClick(e)) {
if (!this.info.prevent) {
Gestures.fire(t, 'tap', {
x: e.clientX,
y: e.clientY,
sourceEvent: e,
preventer: preventer
});
}
}
}
});
var DIRECTION_MAP = {
x: 'pan-x',
y: 'pan-y',
none: 'none',
all: 'auto'
};
Polymer.Base._addFeature({
_setupGestures: function () {
this.__polymerGestures = null;
},
_listen: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.add(node, eventName, handler);
} else {
node.addEventListener(eventName, handler);
}
},
_unlisten: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.remove(node, eventName, handler);
} else {
node.removeEventListener(eventName, handler);
}
},
setScrollDirection: function (direction, node) {
node = node || this;
Gestures.setTouchAction(node, DIRECTION_MAP[direction] || 'auto');
}
});
Polymer.Gestures = Gestures;
}());
(function () {
'use strict';
Polymer.Base._addFeature({
$$: function (slctr) {
return Polymer.dom(this.root).querySelector(slctr);
},
toggleClass: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.classList.contains(name);
}
if (bool) {
Polymer.dom(node).classList.add(name);
} else {
Polymer.dom(node).classList.remove(name);
}
},
toggleAttribute: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.hasAttribute(name);
}
if (bool) {
Polymer.dom(node).setAttribute(name, '');
} else {
Polymer.dom(node).removeAttribute(name);
}
},
classFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).classList.remove(name);
}
if (toElement) {
Polymer.dom(toElement).classList.add(name);
}
},
attributeFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).removeAttribute(name);
}
if (toElement) {
Polymer.dom(toElement).setAttribute(name, '');
}
},
getEffectiveChildNodes: function () {
return Polymer.dom(this).getEffectiveChildNodes();
},
getEffectiveChildren: function () {
var list = Polymer.dom(this).getEffectiveChildNodes();
return list.filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
getEffectiveTextContent: function () {
var cn = this.getEffectiveChildNodes();
var tc = [];
for (var i = 0, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(Polymer.dom(c).textContent);
}
}
return tc.join('');
},
queryEffectiveChildren: function (slctr) {
var e$ = Polymer.dom(this).queryDistributedElements(slctr);
return e$ && e$[0];
},
queryAllEffectiveChildren: function (slctr) {
return Polymer.dom(this).queryDistributedElements(slctr);
},
getContentChildNodes: function (slctr) {
var content = Polymer.dom(this.root).querySelector(slctr || 'content');
return content ? Polymer.dom(content).getDistributedNodes() : [];
},
getContentChildren: function (slctr) {
return this.getContentChildNodes(slctr).filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
fire: function (type, detail, options) {
options = options || Polymer.nob;
var node = options.node || this;
detail = detail === null || detail === undefined ? {} : detail;
var bubbles = options.bubbles === undefined ? true : options.bubbles;
var cancelable = Boolean(options.cancelable);
var useCache = options._useCache;
var event = this._getEvent(type, bubbles, cancelable, useCache);
event.detail = detail;
if (useCache) {
this.__eventCache[type] = null;
}
node.dispatchEvent(event);
if (useCache) {
this.__eventCache[type] = event;
}
return event;
},
__eventCache: {},
_getEvent: function (type, bubbles, cancelable, useCache) {
var event = useCache && this.__eventCache[type];
if (!event || (event.bubbles != bubbles || event.cancelable != cancelable)) {
event = new Event(type, {
bubbles: Boolean(bubbles),
cancelable: cancelable
});
}
return event;
},
async: function (callback, waitTime) {
var self = this;
return Polymer.Async.run(function () {
callback.call(self);
}, waitTime);
},
cancelAsync: function (handle) {
Polymer.Async.cancel(handle);
},
arrayDelete: function (path, item) {
var index;
if (Array.isArray(path)) {
index = path.indexOf(item);
if (index >= 0) {
return path.splice(index, 1);
}
} else {
var arr = this._get(path);
index = arr.indexOf(item);
if (index >= 0) {
return this.splice(path, index, 1);
}
}
},
transform: function (transform, node) {
node = node || this;
node.style.webkitTransform = transform;
node.style.transform = transform;
},
translate3d: function (x, y, z, node) {
node = node || this;
this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
},
importHref: function (href, onload, onerror, optAsync) {
var link = document.createElement('link');
link.rel = 'import';
link.href = href;
var list = Polymer.Base.importHref.imported = Polymer.Base.importHref.imported || {};
var cached = list[link.href];
var imprt = cached || link;
var self = this;
var loadListener = function (e) {
e.target.__firedLoad = true;
e.target.removeEventListener('load', loadListener);
e.target.removeEventListener('error', errorListener);
return onload.call(self, e);
};
var errorListener = function (e) {
e.target.__firedError = true;
e.target.removeEventListener('load', loadListener);
e.target.removeEventListener('error', errorListener);
return onerror.call(self, e);
};
if (onload) {
imprt.addEventListener('load', loadListener);
}
if (onerror) {
imprt.addEventListener('error', errorListener);
}
if (cached) {
if (cached.__firedLoad) {
cached.dispatchEvent(new Event('load'));
}
if (cached.__firedError) {
cached.dispatchEvent(new Event('error'));
}
} else {
list[link.href] = link;
optAsync = Boolean(optAsync);
if (optAsync) {
link.setAttribute('async', '');
}
document.head.appendChild(link);
}
return imprt;
},
create: function (tag, props) {
var elt = document.createElement(tag);
if (props) {
for (var n in props) {
elt[n] = props[n];
}
}
return elt;
},
isLightDescendant: function (node) {
return this !== node && this.contains(node) && Polymer.dom(this).getOwnerRoot() === Polymer.dom(node).getOwnerRoot();
},
isLocalDescendant: function (node) {
return this.root === Polymer.dom(node).getOwnerRoot();
}
});
if (!Polymer.Settings.useNativeCustomElements) {
var importHref = Polymer.Base.importHref;
Polymer.Base.importHref = function (href, onload, onerror, optAsync) {
CustomElements.ready = false;
var loadFn = function (e) {
CustomElements.upgradeDocumentTree(document);
CustomElements.ready = true;
if (onload) {
return onload.call(this, e);
}
};
return importHref.call(this, href, loadFn, onerror, optAsync);
};
}
}());
Polymer.Bind = {
prepareModel: function (model) {
Polymer.Base.mixin(model, this._modelApi);
},
_modelApi: {
_notifyChange: function (source, event, value) {
value = value === undefined ? this[source] : value;
event = event || Polymer.CaseMap.camelToDashCase(source) + '-changed';
this.fire(event, { value: value }, {
bubbles: false,
cancelable: false,
_useCache: Polymer.Settings.eventDataCache || !Polymer.Settings.isIE
});
},
_propertySetter: function (property, value, effects, fromAbove) {
var old = this.__data__[property];
if (old !== value && (old === old || value === value)) {
this.__data__[property] = value;
if (typeof value == 'object') {
this._clearPath(property);
}
if (this._propertyChanged) {
this._propertyChanged(property, value, old);
}
if (effects) {
this._effectEffects(property, value, effects, old, fromAbove);
}
}
return old;
},
__setProperty: function (property, value, quiet, node) {
node = node || this;
var effects = node._propertyEffects && node._propertyEffects[property];
if (effects) {
node._propertySetter(property, value, effects, quiet);
} else if (node[property] !== value) {
node[property] = value;
}
},
_effectEffects: function (property, value, effects, old, fromAbove) {
for (var i = 0, l = effects.length, fx; i < l && (fx = effects[i]); i++) {
fx.fn.call(this, property, this[property], fx.effect, old, fromAbove);
}
},
_clearPath: function (path) {
for (var prop in this.__data__) {
if (Polymer.Path.isDescendant(path, prop)) {
this.__data__[prop] = undefined;
}
}
}
},
ensurePropertyEffects: function (model, property) {
if (!model._propertyEffects) {
model._propertyEffects = {};
}
var fx = model._propertyEffects[property];
if (!fx) {
fx = model._propertyEffects[property] = [];
}
return fx;
},
addPropertyEffect: function (model, property, kind, effect) {
var fx = this.ensurePropertyEffects(model, property);
var propEffect = {
kind: kind,
effect: effect,
fn: Polymer.Bind['_' + kind + 'Effect']
};
fx.push(propEffect);
return propEffect;
},
createBindings: function (model) {
var fx$ = model._propertyEffects;
if (fx$) {
for (var n in fx$) {
var fx = fx$[n];
fx.sort(this._sortPropertyEffects);
this._createAccessors(model, n, fx);
}
}
},
_sortPropertyEffects: function () {
var EFFECT_ORDER = {
'compute': 0,
'annotation': 1,
'annotatedComputation': 2,
'reflect': 3,
'notify': 4,
'observer': 5,
'complexObserver': 6,
'function': 7
};
return function (a, b) {
return EFFECT_ORDER[a.kind] - EFFECT_ORDER[b.kind];
};
}(),
_createAccessors: function (model, property, effects) {
var defun = {
get: function () {
return this.__data__[property];
}
};
var setter = function (value) {
this._propertySetter(property, value, effects);
};
var info = model.getPropertyInfo && model.getPropertyInfo(property);
if (info && info.readOnly) {
if (!info.computed) {
model['_set' + this.upper(property)] = setter;
}
} else {
defun.set = setter;
}
Object.defineProperty(model, property, defun);
},
upper: function (name) {
return name[0].toUpperCase() + name.substring(1);
},
_addAnnotatedListener: function (model, index, property, path, event, negated) {
if (!model._bindListeners) {
model._bindListeners = [];
}
var fn = this._notedListenerFactory(property, path, Polymer.Path.isDeep(path), negated);
var eventName = event || Polymer.CaseMap.camelToDashCase(property) + '-changed';
model._bindListeners.push({
index: index,
property: property,
path: path,
changedFn: fn,
event: eventName
});
},
_isEventBogus: function (e, target) {
return e.path && e.path[0] !== target;
},
_notedListenerFactory: function (property, path, isStructured, negated) {
return function (target, value, targetPath) {
if (targetPath) {
var newPath = Polymer.Path.translate(property, path, targetPath);
this._notifyPath(newPath, value);
} else {
value = target[property];
if (negated) {
value = !value;
}
if (!isStructured) {
this[path] = value;
} else {
if (this.__data__[path] != value) {
this.set(path, value);
}
}
}
};
},
prepareInstance: function (inst) {
inst.__data__ = Object.create(null);
},
setupBindListeners: function (inst) {
var b$ = inst._bindListeners;
for (var i = 0, l = b$.length, info; i < l && (info = b$[i]); i++) {
var node = inst._nodes[info.index];
this._addNotifyListener(node, inst, info.event, info.changedFn);
}
},
_addNotifyListener: function (element, context, event, changedFn) {
element.addEventListener(event, function (e) {
return context._notifyListener(changedFn, e);
});
}
};
Polymer.Base.mixin(Polymer.Bind, {
_shouldAddListener: function (effect) {
return effect.name && effect.kind != 'attribute' && effect.kind != 'text' && !effect.isCompound && effect.parts[0].mode === '{';
},
_annotationEffect: function (source, value, effect) {
if (source != effect.value) {
value = this._get(effect.value);
this.__data__[effect.value] = value;
}
this._applyEffectValue(effect, value);
},
_reflectEffect: function (source, value, effect) {
this.reflectPropertyToAttribute(source, effect.attribute, value);
},
_notifyEffect: function (source, value, effect, old, fromAbove) {
if (!fromAbove) {
this._notifyChange(source, effect.event, value);
}
},
_functionEffect: function (source, value, fn, old, fromAbove) {
fn.call(this, source, value, old, fromAbove);
},
_observerEffect: function (source, value, effect, old) {
var fn = this[effect.method];
if (fn) {
fn.call(this, value, old);
} else {
this._warn(this._logf('_observerEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_complexObserverEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
fn.apply(this, args);
}
} else if (effect.dynamicFn) {
} else {
this._warn(this._logf('_complexObserverEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_computeEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(this, args);
this.__setProperty(effect.name, computedvalue);
}
} else if (effect.dynamicFn) {
} else {
this._warn(this._logf('_computeEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_annotatedComputationEffect: function (source, value, effect) {
var computedHost = this._rootDataHost || this;
var fn = computedHost[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(computedHost, args);
this._applyEffectValue(effect, computedvalue);
}
} else if (effect.dynamicFn) {
} else {
computedHost._warn(computedHost._logf('_annotatedComputationEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_marshalArgs: function (model, effect, path, value) {
var values = [];
var args = effect.args;
var bailoutEarly = args.length > 1 || effect.dynamicFn;
for (var i = 0, l = args.length; i < l; i++) {
var arg = args[i];
var name = arg.name;
var v;
if (arg.literal) {
v = arg.value;
} else if (path === name) {
v = value;
} else {
v = model[name];
if (v === undefined && arg.structured) {
v = Polymer.Base._get(name, model);
}
}
if (bailoutEarly && v === undefined) {
return;
}
if (arg.wildcard) {
var matches = Polymer.Path.isAncestor(path, name);
values[i] = {
path: matches ? path : name,
value: matches ? value : v,
base: v
};
} else {
values[i] = v;
}
}
return values;
}
});
Polymer.Base._addFeature({
_addPropertyEffect: function (property, kind, effect) {
var prop = Polymer.Bind.addPropertyEffect(this, property, kind, effect);
prop.pathFn = this['_' + prop.kind + 'PathEffect'];
},
_prepEffects: function () {
Polymer.Bind.prepareModel(this);
this._addAnnotationEffects(this._notes);
},
_prepBindings: function () {
Polymer.Bind.createBindings(this);
},
_addPropertyEffects: function (properties) {
if (properties) {
for (var p in properties) {
var prop = properties[p];
if (prop.observer) {
this._addObserverEffect(p, prop.observer);
}
if (prop.computed) {
prop.readOnly = true;
this._addComputedEffect(p, prop.computed);
}
if (prop.notify) {
this._addPropertyEffect(p, 'notify', { event: Polymer.CaseMap.camelToDashCase(p) + '-changed' });
}
if (prop.reflectToAttribute) {
var attr = Polymer.CaseMap.camelToDashCase(p);
if (attr[0] === '-') {
this._warn(this._logf('_addPropertyEffects', 'Property ' + p + ' cannot be reflected to attribute ' + attr + ' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property instead.'));
} else {
this._addPropertyEffect(p, 'reflect', { attribute: attr });
}
}
if (prop.readOnly) {
Polymer.Bind.ensurePropertyEffects(this, p);
}
}
}
},
_addComputedEffect: function (name, expression) {
var sig = this._parseMethod(expression);
var dynamicFn = sig.dynamicFn;
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'compute', {
method: sig.method,
args: sig.args,
trigger: arg,
name: name,
dynamicFn: dynamicFn
});
}
if (dynamicFn) {
this._addPropertyEffect(sig.method, 'compute', {
method: sig.method,
args: sig.args,
trigger: null,
name: name,
dynamicFn: dynamicFn
});
}
},
_addObserverEffect: function (property, observer) {
this._addPropertyEffect(property, 'observer', {
method: observer,
property: property
});
},
_addComplexObserverEffects: function (observers) {
if (observers) {
for (var i = 0, o; i < observers.length && (o = observers[i]); i++) {
this._addComplexObserverEffect(o);
}
}
},
_addComplexObserverEffect: function (observer) {
var sig = this._parseMethod(observer);
if (!sig) {
throw new Error('Malformed observer expression \'' + observer + '\'');
}
var dynamicFn = sig.dynamicFn;
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: arg,
dynamicFn: dynamicFn
});
}
if (dynamicFn) {
this._addPropertyEffect(sig.method, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: null,
dynamicFn: dynamicFn
});
}
},
_addAnnotationEffects: function (notes) {
for (var i = 0, note; i < notes.length && (note = notes[i]); i++) {
var b$ = note.bindings;
for (var j = 0, binding; j < b$.length && (binding = b$[j]); j++) {
this._addAnnotationEffect(binding, i);
}
}
},
_addAnnotationEffect: function (note, index) {
if (Polymer.Bind._shouldAddListener(note)) {
Polymer.Bind._addAnnotatedListener(this, index, note.name, note.parts[0].value, note.parts[0].event, note.parts[0].negate);
}
for (var i = 0; i < note.parts.length; i++) {
var part = note.parts[i];
if (part.signature) {
this._addAnnotatedComputationEffect(note, part, index);
} else if (!part.literal) {
if (note.kind === 'attribute' && note.name[0] === '-') {
this._warn(this._logf('_addAnnotationEffect', 'Cannot set attribute ' + note.name + ' because "-" is not a valid attribute starting character'));
} else {
this._addPropertyEffect(part.model, 'annotation', {
kind: note.kind,
index: index,
name: note.name,
propertyName: note.propertyName,
value: part.value,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
event: part.event,
customEvent: part.customEvent,
negate: part.negate
});
}
}
}
},
_addAnnotatedComputationEffect: function (note, part, index) {
var sig = part.signature;
if (sig.static) {
this.__addAnnotatedComputationEffect('__static__', index, note, part, null);
} else {
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
if (!arg.literal) {
this.__addAnnotatedComputationEffect(arg.model, index, note, part, arg);
}
}
if (sig.dynamicFn) {
this.__addAnnotatedComputationEffect(sig.method, index, note, part, null);
}
}
},
__addAnnotatedComputationEffect: function (property, index, note, part, trigger) {
this._addPropertyEffect(property, 'annotatedComputation', {
index: index,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
kind: note.kind,
name: note.name,
negate: part.negate,
method: part.signature.method,
args: part.signature.args,
trigger: trigger,
dynamicFn: part.signature.dynamicFn
});
},
_parseMethod: function (expression) {
var m = expression.match(/([^\s]+?)\(([\s\S]*)\)/);
if (m) {
var sig = {
method: m[1],
static: true
};
if (this.getPropertyInfo(sig.method) !== Polymer.nob) {
sig.static = false;
sig.dynamicFn = true;
}
if (m[2].trim()) {
var args = m[2].replace(/\\,/g, '&comma;').split(',');
return this._parseArgs(args, sig);
} else {
sig.args = Polymer.nar;
return sig;
}
}
},
_parseArgs: function (argList, sig) {
sig.args = argList.map(function (rawArg) {
var arg = this._parseArg(rawArg);
if (!arg.literal) {
sig.static = false;
}
return arg;
}, this);
return sig;
},
_parseArg: function (rawArg) {
var arg = rawArg.trim().replace(/&comma;/g, ',').replace(/\\(.)/g, '$1');
var a = { name: arg };
var fc = arg[0];
if (fc === '-') {
fc = arg[1];
}
if (fc >= '0' && fc <= '9') {
fc = '#';
}
switch (fc) {
case '\'':
case '"':
a.value = arg.slice(1, -1);
a.literal = true;
break;
case '#':
a.value = Number(arg);
a.literal = true;
break;
}
if (!a.literal) {
a.model = Polymer.Path.root(arg);
a.structured = Polymer.Path.isDeep(arg);
if (a.structured) {
a.wildcard = arg.slice(-2) == '.*';
if (a.wildcard) {
a.name = arg.slice(0, -2);
}
}
}
return a;
},
_marshalInstanceEffects: function () {
Polymer.Bind.prepareInstance(this);
if (this._bindListeners) {
Polymer.Bind.setupBindListeners(this);
}
},
_applyEffectValue: function (info, value) {
var node = this._nodes[info.index];
var property = info.name;
value = this._computeFinalAnnotationValue(node, property, value, info);
if (info.kind == 'attribute') {
this.serializeValueToAttribute(value, property, node);
} else {
var pinfo = node._propertyInfo && node._propertyInfo[property];
if (pinfo && pinfo.readOnly) {
return;
}
this.__setProperty(property, value, Polymer.Settings.suppressBindingNotifications, node);
}
},
_computeFinalAnnotationValue: function (node, property, value, info) {
if (info.negate) {
value = !value;
}
if (info.isCompound) {
var storage = node.__compoundStorage__[property];
storage[info.compoundIndex] = value;
value = storage.join('');
}
if (info.kind !== 'attribute') {
if (property === 'className') {
value = this._scopeElementClass(node, value);
}
if (property === 'textContent' || node.localName == 'input' && property == 'value') {
value = value == undefined ? '' : value;
}
}
return value;
},
_executeStaticEffects: function () {
if (this._propertyEffects && this._propertyEffects.__static__) {
this._effectEffects('__static__', null, this._propertyEffects.__static__);
}
}
});
(function () {
var usePolyfillProto = Polymer.Settings.usePolyfillProto;
var avoidInstanceProperties = Boolean(Object.getOwnPropertyDescriptor(document.documentElement, 'properties'));
Polymer.Base._addFeature({
_setupConfigure: function (initialConfig) {
this._config = {};
this._handlers = [];
this._aboveConfig = null;
if (initialConfig) {
for (var i in initialConfig) {
if (initialConfig[i] !== undefined) {
this._config[i] = initialConfig[i];
}
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this._config);
},
_attributeChangedImpl: function (name) {
var model = this._clientsReadied ? this : this._config;
this._setAttributeToProperty(model, name);
},
_configValue: function (name, value) {
var info = this._propertyInfo[name];
if (!info || !info.readOnly) {
this._config[name] = value;
}
},
_beforeClientsReady: function () {
this._configure();
},
_configure: function () {
this._configureAnnotationReferences();
this._configureInstanceProperties();
this._aboveConfig = this.mixin({}, this._config);
var config = {};
for (var i = 0; i < this.behaviors.length; i++) {
this._configureProperties(this.behaviors[i].properties, config);
}
this._configureProperties(avoidInstanceProperties ? this.__proto__.properties : this.properties, config);
this.mixin(config, this._aboveConfig);
this._config = config;
if (this._clients && this._clients.length) {
this._distributeConfig(this._config);
}
},
_configureInstanceProperties: function () {
for (var i in this._propertyEffects) {
if (!usePolyfillProto && this.hasOwnProperty(i)) {
this._configValue(i, this[i]);
delete this[i];
}
}
},
_configureProperties: function (properties, config) {
for (var i in properties) {
var c = properties[i];
if (c.value !== undefined) {
var value = c.value;
if (typeof value == 'function') {
value = value.call(this, this._config);
}
config[i] = value;
}
}
},
_distributeConfig: function (config) {
var fx$ = this._propertyEffects;
if (fx$) {
for (var p in config) {
var fx = fx$[p];
if (fx) {
for (var i = 0, l = fx.length, x; i < l && (x = fx[i]); i++) {
if (x.kind === 'annotation') {
var node = this._nodes[x.effect.index];
var name = x.effect.propertyName;
var isAttr = x.effect.kind == 'attribute';
var hasEffect = node._propertyEffects && node._propertyEffects[name];
if (node._configValue && (hasEffect || !isAttr)) {
var value = p === x.effect.value ? config[p] : this._get(x.effect.value, config);
value = this._computeFinalAnnotationValue(node, name, value, x.effect);
if (isAttr) {
value = node.deserialize(this.serialize(value), node._propertyInfo[name].type);
}
node._configValue(name, value);
}
}
}
}
}
}
},
_afterClientsReady: function () {
this.importPath = this._importPath;
this.rootPath = Polymer.rootPath;
this._executeStaticEffects();
this._applyConfig(this._config, this._aboveConfig);
this._flushHandlers();
},
_applyConfig: function (config, aboveConfig) {
for (var n in config) {
if (this[n] === undefined) {
this.__setProperty(n, config[n], n in aboveConfig);
}
}
},
_notifyListener: function (fn, e) {
if (!Polymer.Bind._isEventBogus(e, e.target)) {
var value, path;
if (e.detail) {
value = e.detail.value;
path = e.detail.path;
}
if (!this._clientsReadied) {
this._queueHandler([
fn,
e.target,
value,
path
]);
} else {
return fn.call(this, e.target, value, path);
}
}
},
_queueHandler: function (args) {
this._handlers.push(args);
},
_flushHandlers: function () {
var h$ = this._handlers;
for (var i = 0, l = h$.length, h; i < l && (h = h$[i]); i++) {
h[0].call(this, h[1], h[2], h[3]);
}
this._handlers = [];
}
});
}());
(function () {
'use strict';
var Path = Polymer.Path;
Polymer.Base._addFeature({
notifyPath: function (path, value, fromAbove) {
var info = {};
var v = this._get(path, this, info);
if (arguments.length === 1) {
value = v;
}
if (info.path) {
this._notifyPath(info.path, value, fromAbove);
}
},
_notifyPath: function (path, value, fromAbove) {
var old = this._propertySetter(path, value);
if (old !== value && (old === old || value === value)) {
this._pathEffector(path, value);
if (!fromAbove) {
this._notifyPathUp(path, value);
}
return true;
}
},
_getPathParts: function (path) {
if (Array.isArray(path)) {
var parts = [];
for (var i = 0; i < path.length; i++) {
var args = path[i].toString().split('.');
for (var j = 0; j < args.length; j++) {
parts.push(args[j]);
}
}
return parts;
} else {
return path.toString().split('.');
}
},
set: function (path, value, root) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
var last = parts[parts.length - 1];
if (parts.length > 1) {
for (var i = 0; i < parts.length - 1; i++) {
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
if (!prop) {
return;
}
array = Array.isArray(prop) ? prop : null;
}
if (array) {
var coll = Polymer.Collection.get(array);
var old, key;
if (last[0] == '#') {
key = last;
old = coll.getItem(key);
last = array.indexOf(old);
coll.setItem(key, value);
} else if (parseInt(last, 10) == last) {
old = prop[last];
key = coll.getKey(old);
parts[i] = key;
coll.setItem(key, value);
}
}
prop[last] = value;
if (!root) {
this._notifyPath(parts.join('.'), value);
}
} else {
prop[path] = value;
}
},
get: function (path, root) {
return this._get(path, root);
},
_get: function (path, root, info) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
for (var i = 0; i < parts.length; i++) {
if (!prop) {
return;
}
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (info && array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
array = Array.isArray(prop) ? prop : null;
}
if (info) {
info.path = parts.join('.');
}
return prop;
},
_pathEffector: function (path, value) {
var model = Path.root(path);
var fx$ = this._propertyEffects && this._propertyEffects[model];
if (fx$) {
for (var i = 0, fx; i < fx$.length && (fx = fx$[i]); i++) {
var fxFn = fx.pathFn;
if (fxFn) {
fxFn.call(this, path, value, fx.effect);
}
}
}
if (this._boundPaths) {
this._notifyBoundPaths(path, value);
}
},
_annotationPathEffect: function (path, value, effect) {
if (Path.matches(effect.value, false, path)) {
Polymer.Bind._annotationEffect.call(this, path, value, effect);
} else if (!effect.negate && Path.isDescendant(effect.value, path)) {
var node = this._nodes[effect.index];
if (node && node._notifyPath) {
var newPath = Path.translate(effect.value, effect.name, path);
node._notifyPath(newPath, value, true);
}
}
},
_complexObserverPathEffect: function (path, value, effect) {
if (Path.matches(effect.trigger.name, effect.trigger.wildcard, path)) {
Polymer.Bind._complexObserverEffect.call(this, path, value, effect);
}
},
_computePathEffect: function (path, value, effect) {
if (Path.matches(effect.trigger.name, effect.trigger.wildcard, path)) {
Polymer.Bind._computeEffect.call(this, path, value, effect);
}
},
_annotatedComputationPathEffect: function (path, value, effect) {
if (Path.matches(effect.trigger.name, effect.trigger.wildcard, path)) {
Polymer.Bind._annotatedComputationEffect.call(this, path, value, effect);
}
},
linkPaths: function (to, from) {
this._boundPaths = this._boundPaths || {};
if (from) {
this._boundPaths[to] = from;
} else {
this.unlinkPaths(to);
}
},
unlinkPaths: function (path) {
if (this._boundPaths) {
delete this._boundPaths[path];
}
},
_notifyBoundPaths: function (path, value) {
for (var a in this._boundPaths) {
var b = this._boundPaths[a];
if (Path.isDescendant(a, path)) {
this._notifyPath(Path.translate(a, b, path), value);
} else if (Path.isDescendant(b, path)) {
this._notifyPath(Path.translate(b, a, path), value);
}
}
},
_notifyPathUp: function (path, value) {
var rootName = Path.root(path);
var dashCaseName = Polymer.CaseMap.camelToDashCase(rootName);
var eventName = dashCaseName + this._EVENT_CHANGED;
this.fire(eventName, {
path: path,
value: value
}, {
bubbles: false,
_useCache: Polymer.Settings.eventDataCache || !Polymer.Settings.isIE
});
},
_EVENT_CHANGED: '-changed',
notifySplices: function (path, splices) {
var info = {};
var array = this._get(path, this, info);
this._notifySplices(array, info.path, splices);
},
_notifySplices: function (array, path, splices) {
var change = {
keySplices: Polymer.Collection.applySplices(array, splices),
indexSplices: splices
};
var splicesPath = path + '.splices';
this._notifyPath(splicesPath, change);
this._notifyPath(path + '.length', array.length);
this.__data__[splicesPath] = {
keySplices: null,
indexSplices: null
};
},
_notifySplice: function (array, path, index, added, removed) {
this._notifySplices(array, path, [{
index: index,
addedCount: added,
removed: removed,
object: array,
type: 'splice'
}]);
},
push: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var len = array.length;
var ret = array.push.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, len, args.length, []);
}
return ret;
},
pop: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.pop.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, array.length, 0, [ret]);
}
return ret;
},
splice: function (path, start) {
var info = {};
var array = this._get(path, this, info);
if (start < 0) {
start = array.length - Math.floor(-start);
} else {
start = Math.floor(start);
}
if (!start) {
start = 0;
}
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.splice.apply(array, args);
var addedCount = Math.max(args.length - 2, 0);
if (addedCount || ret.length) {
this._notifySplice(array, info.path, start, addedCount, ret);
}
return ret;
},
shift: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.shift.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, 0, 0, [ret]);
}
return ret;
},
unshift: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.unshift.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, 0, args.length, []);
}
return ret;
},
prepareModelNotifyPath: function (model) {
this.mixin(model, {
fire: Polymer.Base.fire,
_getEvent: Polymer.Base._getEvent,
__eventCache: Polymer.Base.__eventCache,
notifyPath: Polymer.Base.notifyPath,
_get: Polymer.Base._get,
_EVENT_CHANGED: Polymer.Base._EVENT_CHANGED,
_notifyPath: Polymer.Base._notifyPath,
_notifyPathUp: Polymer.Base._notifyPathUp,
_pathEffector: Polymer.Base._pathEffector,
_annotationPathEffect: Polymer.Base._annotationPathEffect,
_complexObserverPathEffect: Polymer.Base._complexObserverPathEffect,
_annotatedComputationPathEffect: Polymer.Base._annotatedComputationPathEffect,
_computePathEffect: Polymer.Base._computePathEffect,
_notifyBoundPaths: Polymer.Base._notifyBoundPaths,
_getPathParts: Polymer.Base._getPathParts
});
}
});
}());
Polymer.Base._addFeature({
resolveUrl: function (url) {
return Polymer.ResolveUrl.resolveUrl(url, this._importPath);
}
});
Polymer.CssParse = function () {
return {
parse: function (text) {
text = this._clean(text);
return this._parseCss(this._lex(text), text);
},
_clean: function (cssText) {
return cssText.replace(this._rx.comments, '').replace(this._rx.port, '');
},
_lex: function (text) {
var root = {
start: 0,
end: text.length
};
var n = root;
for (var i = 0, l = text.length; i < l; i++) {
switch (text[i]) {
case this.OPEN_BRACE:
if (!n.rules) {
n.rules = [];
}
var p = n;
var previous = p.rules[p.rules.length - 1];
n = {
start: i + 1,
parent: p,
previous: previous
};
p.rules.push(n);
break;
case this.CLOSE_BRACE:
n.end = i + 1;
n = n.parent || root;
break;
}
}
return root;
},
_parseCss: function (node, text) {
var t = text.substring(node.start, node.end - 1);
node.parsedCssText = node.cssText = t.trim();
if (node.parent) {
var ss = node.previous ? node.previous.end : node.parent.start;
t = text.substring(ss, node.start - 1);
t = this._expandUnicodeEscapes(t);
t = t.replace(this._rx.multipleSpaces, ' ');
t = t.substring(t.lastIndexOf(';') + 1);
var s = node.parsedSelector = node.selector = t.trim();
node.atRule = s.indexOf(this.AT_START) === 0;
if (node.atRule) {
if (s.indexOf(this.MEDIA_START) === 0) {
node.type = this.types.MEDIA_RULE;
} else if (s.match(this._rx.keyframesRule)) {
node.type = this.types.KEYFRAMES_RULE;
node.keyframesName = node.selector.split(this._rx.multipleSpaces).pop();
}
} else {
if (s.indexOf(this.VAR_START) === 0) {
node.type = this.types.MIXIN_RULE;
} else {
node.type = this.types.STYLE_RULE;
}
}
}
var r$ = node.rules;
if (r$) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this._parseCss(r, text);
}
}
return node;
},
_expandUnicodeEscapes: function (s) {
return s.replace(/\\([0-9a-f]{1,6})\s/gi, function () {
var code = arguments[1], repeat = 6 - code.length;
while (repeat--) {
code = '0' + code;
}
return '\\' + code;
});
},
stringify: function (node, preserveProperties, text) {
text = text || '';
var cssText = '';
if (node.cssText || node.rules) {
var r$ = node.rules;
if (r$ && !this._hasMixinRules(r$)) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
cssText = this.stringify(r, preserveProperties, cssText);
}
} else {
cssText = preserveProperties ? node.cssText : this.removeCustomProps(node.cssText);
cssText = cssText.trim();
if (cssText) {
cssText = '  ' + cssText + '\n';
}
}
}
if (cssText) {
if (node.selector) {
text += node.selector + ' ' + this.OPEN_BRACE + '\n';
}
text += cssText;
if (node.selector) {
text += this.CLOSE_BRACE + '\n\n';
}
}
return text;
},
_hasMixinRules: function (rules) {
return rules[0].selector.indexOf(this.VAR_START) === 0;
},
removeCustomProps: function (cssText) {
cssText = this.removeCustomPropAssignment(cssText);
return this.removeCustomPropApply(cssText);
},
removeCustomPropAssignment: function (cssText) {
return cssText.replace(this._rx.customProp, '').replace(this._rx.mixinProp, '');
},
removeCustomPropApply: function (cssText) {
return cssText.replace(this._rx.mixinApply, '').replace(this._rx.varApply, '');
},
types: {
STYLE_RULE: 1,
KEYFRAMES_RULE: 7,
MEDIA_RULE: 4,
MIXIN_RULE: 1000
},
OPEN_BRACE: '{',
CLOSE_BRACE: '}',
_rx: {
comments: /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//gim,
port: /@import[^;]*;/gim,
customProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
mixinProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
mixinApply: /@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,
varApply: /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
keyframesRule: /^@[^\s]*keyframes/,
multipleSpaces: /\s+/g
},
VAR_START: '--',
MEDIA_START: '@media',
AT_START: '@'
};
}();
Polymer.StyleUtil = function () {
var settings = Polymer.Settings;
return {
NATIVE_VARIABLES: Polymer.Settings.useNativeCSSProperties,
MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css], template',
INCLUDE_ATTR: 'include',
toCssText: function (rules, callback) {
if (typeof rules === 'string') {
rules = this.parser.parse(rules);
}
if (callback) {
this.forEachRule(rules, callback);
}
return this.parser.stringify(rules, this.NATIVE_VARIABLES);
},
forRulesInStyles: function (styles, styleRuleCallback, keyframesRuleCallback) {
if (styles) {
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
this.forEachRuleInStyle(s, styleRuleCallback, keyframesRuleCallback);
}
}
},
forActiveRulesInStyles: function (styles, styleRuleCallback, keyframesRuleCallback) {
if (styles) {
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
this.forEachRuleInStyle(s, styleRuleCallback, keyframesRuleCallback, true);
}
}
},
rulesForStyle: function (style) {
if (!style.__cssRules && style.textContent) {
style.__cssRules = this.parser.parse(style.textContent);
}
return style.__cssRules;
},
isKeyframesSelector: function (rule) {
return rule.parent && rule.parent.type === this.ruleTypes.KEYFRAMES_RULE;
},
forEachRuleInStyle: function (style, styleRuleCallback, keyframesRuleCallback, onlyActiveRules) {
var rules = this.rulesForStyle(style);
var styleCallback, keyframeCallback;
if (styleRuleCallback) {
styleCallback = function (rule) {
styleRuleCallback(rule, style);
};
}
if (keyframesRuleCallback) {
keyframeCallback = function (rule) {
keyframesRuleCallback(rule, style);
};
}
this.forEachRule(rules, styleCallback, keyframeCallback, onlyActiveRules);
},
forEachRule: function (node, styleRuleCallback, keyframesRuleCallback, onlyActiveRules) {
if (!node) {
return;
}
var skipRules = false;
if (onlyActiveRules) {
if (node.type === this.ruleTypes.MEDIA_RULE) {
var matchMedia = node.selector.match(this.rx.MEDIA_MATCH);
if (matchMedia) {
if (!window.matchMedia(matchMedia[1]).matches) {
skipRules = true;
}
}
}
}
if (node.type === this.ruleTypes.STYLE_RULE) {
styleRuleCallback(node);
} else if (keyframesRuleCallback && node.type === this.ruleTypes.KEYFRAMES_RULE) {
keyframesRuleCallback(node);
} else if (node.type === this.ruleTypes.MIXIN_RULE) {
skipRules = true;
}
var r$ = node.rules;
if (r$ && !skipRules) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this.forEachRule(r, styleRuleCallback, keyframesRuleCallback, onlyActiveRules);
}
}
},
applyCss: function (cssText, moniker, target, contextNode) {
var style = this.createScopeStyle(cssText, moniker);
return this.applyStyle(style, target, contextNode);
},
applyStyle: function (style, target, contextNode) {
target = target || document.head;
var after = contextNode && contextNode.nextSibling || target.firstChild;
this.__lastHeadApplyNode = style;
return target.insertBefore(style, after);
},
createScopeStyle: function (cssText, moniker) {
var style = document.createElement('style');
if (moniker) {
style.setAttribute('scope', moniker);
}
style.textContent = cssText;
return style;
},
__lastHeadApplyNode: null,
applyStylePlaceHolder: function (moniker) {
var placeHolder = document.createComment(' Shady DOM styles for ' + moniker + ' ');
var after = this.__lastHeadApplyNode ? this.__lastHeadApplyNode.nextSibling : null;
var scope = document.head;
scope.insertBefore(placeHolder, after || scope.firstChild);
this.__lastHeadApplyNode = placeHolder;
return placeHolder;
},
cssFromModules: function (moduleIds, warnIfNotFound) {
var modules = moduleIds.trim().split(' ');
var cssText = '';
for (var i = 0; i < modules.length; i++) {
cssText += this.cssFromModule(modules[i], warnIfNotFound);
}
return cssText;
},
cssFromModule: function (moduleId, warnIfNotFound) {
var m = Polymer.DomModule.import(moduleId);
if (m && !m._cssText) {
m._cssText = this.cssFromElement(m);
}
if (!m && warnIfNotFound) {
console.warn('Could not find style data in module named', moduleId);
}
return m && m._cssText || '';
},
cssFromElement: function (element) {
var cssText = '';
var content = element.content || element;
var e$ = Polymer.TreeApi.arrayCopy(content.querySelectorAll(this.MODULE_STYLES_SELECTOR));
for (var i = 0, e; i < e$.length; i++) {
e = e$[i];
if (e.localName === 'template') {
if (!e.hasAttribute('preserve-content')) {
cssText += this.cssFromElement(e);
}
} else {
if (e.localName === 'style') {
var include = e.getAttribute(this.INCLUDE_ATTR);
if (include) {
cssText += this.cssFromModules(include, true);
}
e = e.__appliedElement || e;
e.parentNode.removeChild(e);
cssText += this.resolveCss(e.textContent, element.ownerDocument);
} else if (e.import && e.import.body) {
cssText += this.resolveCss(e.import.body.textContent, e.import);
}
}
}
return cssText;
},
styleIncludesToTemplate: function (targetTemplate) {
var styles = targetTemplate.content.querySelectorAll('style[include]');
for (var i = 0, s; i < styles.length; i++) {
s = styles[i];
s.parentNode.insertBefore(this._includesToFragment(s.getAttribute('include')), s);
}
},
_includesToFragment: function (styleIncludes) {
var includeArray = styleIncludes.trim().split(' ');
var frag = document.createDocumentFragment();
for (var i = 0; i < includeArray.length; i++) {
var t = Polymer.DomModule.import(includeArray[i], 'template');
if (t) {
this._addStylesToFragment(frag, t.content);
}
}
return frag;
},
_addStylesToFragment: function (frag, source) {
var s$ = source.querySelectorAll('style');
for (var i = 0, s; i < s$.length; i++) {
s = s$[i];
var include = s.getAttribute('include');
if (include) {
frag.appendChild(this._includesToFragment(include));
}
if (s.textContent) {
frag.appendChild(s.cloneNode(true));
}
}
},
isTargetedBuild: function (buildType) {
return settings.useNativeShadow ? buildType === 'shadow' : buildType === 'shady';
},
cssBuildTypeForModule: function (module) {
var dm = Polymer.DomModule.import(module);
if (dm) {
return this.getCssBuildType(dm);
}
},
getCssBuildType: function (element) {
return element.getAttribute('css-build');
},
_findMatchingParen: function (text, start) {
var level = 0;
for (var i = start, l = text.length; i < l; i++) {
switch (text[i]) {
case '(':
level++;
break;
case ')':
if (--level === 0) {
return i;
}
break;
}
}
return -1;
},
processVariableAndFallback: function (str, callback) {
var start = str.indexOf('var(');
if (start === -1) {
return callback(str, '', '', '');
}
var end = this._findMatchingParen(str, start + 3);
var inner = str.substring(start + 4, end);
var prefix = str.substring(0, start);
var suffix = this.processVariableAndFallback(str.substring(end + 1), callback);
var comma = inner.indexOf(',');
if (comma === -1) {
return callback(prefix, inner.trim(), '', suffix);
}
var value = inner.substring(0, comma).trim();
var fallback = inner.substring(comma + 1).trim();
return callback(prefix, value, fallback, suffix);
},
rx: {
VAR_ASSIGN: /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\s}])|$)/gi,
MIXIN_MATCH: /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi,
VAR_CONSUMED: /(--[\w-]+)\s*([:,;)]|$)/gi,
ANIMATION_MATCH: /(animation\s*:)|(animation-name\s*:)/,
MEDIA_MATCH: /@media[^(]*(\([^)]*\))/,
IS_VAR: /^--/,
BRACKETED: /\{[^}]*\}/g,
HOST_PREFIX: '(?:^|[^.#[:])',
HOST_SUFFIX: '($|[.:[\\s>+~])'
},
resolveCss: Polymer.ResolveUrl.resolveCss,
parser: Polymer.CssParse,
ruleTypes: Polymer.CssParse.types
};
}();
Polymer.StyleTransformer = function () {
var styleUtil = Polymer.StyleUtil;
var settings = Polymer.Settings;
var api = {
dom: function (node, scope, useAttr, shouldRemoveScope) {
this._transformDom(node, scope || '', useAttr, shouldRemoveScope);
},
_transformDom: function (node, selector, useAttr, shouldRemoveScope) {
if (node.setAttribute) {
this.element(node, selector, useAttr, shouldRemoveScope);
}
var c$ = Polymer.dom(node).childNodes;
for (var i = 0; i < c$.length; i++) {
this._transformDom(c$[i], selector, useAttr, shouldRemoveScope);
}
},
element: function (element, scope, useAttr, shouldRemoveScope) {
if (useAttr) {
if (shouldRemoveScope) {
element.removeAttribute(SCOPE_NAME);
} else {
element.setAttribute(SCOPE_NAME, scope);
}
} else {
if (scope) {
if (element.classList) {
if (shouldRemoveScope) {
element.classList.remove(SCOPE_NAME);
element.classList.remove(scope);
} else {
element.classList.add(SCOPE_NAME);
element.classList.add(scope);
}
} else if (element.getAttribute) {
var c = element.getAttribute(CLASS);
if (shouldRemoveScope) {
if (c) {
element.setAttribute(CLASS, c.replace(SCOPE_NAME, '').replace(scope, ''));
}
} else {
element.setAttribute(CLASS, (c ? c + ' ' : '') + SCOPE_NAME + ' ' + scope);
}
}
}
}
},
elementStyles: function (element, callback) {
var styles = element._styles;
var cssText = '';
var cssBuildType = element.__cssBuild;
var passthrough = settings.useNativeShadow || cssBuildType === 'shady';
var cb;
if (passthrough) {
var self = this;
cb = function (rule) {
rule.selector = self._slottedToContent(rule.selector);
rule.selector = rule.selector.replace(ROOT, ':host > *');
if (callback) {
callback(rule);
}
};
}
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
var rules = styleUtil.rulesForStyle(s);
cssText += passthrough ? styleUtil.toCssText(rules, cb) : this.css(rules, element.is, element.extends, callback, element._scopeCssViaAttr) + '\n\n';
}
return cssText.trim();
},
css: function (rules, scope, ext, callback, useAttr) {
var hostScope = this._calcHostScope(scope, ext);
scope = this._calcElementScope(scope, useAttr);
var self = this;
return styleUtil.toCssText(rules, function (rule) {
if (!rule.isScoped) {
self.rule(rule, scope, hostScope);
rule.isScoped = true;
}
if (callback) {
callback(rule, scope, hostScope);
}
});
},
_calcElementScope: function (scope, useAttr) {
if (scope) {
return useAttr ? CSS_ATTR_PREFIX + scope + CSS_ATTR_SUFFIX : CSS_CLASS_PREFIX + scope;
} else {
return '';
}
},
_calcHostScope: function (scope, ext) {
return ext ? '[is=' + scope + ']' : scope;
},
rule: function (rule, scope, hostScope) {
this._transformRule(rule, this._transformComplexSelector, scope, hostScope);
},
_transformRule: function (rule, transformer, scope, hostScope) {
rule.selector = rule.transformedSelector = this._transformRuleCss(rule, transformer, scope, hostScope);
},
_transformRuleCss: function (rule, transformer, scope, hostScope) {
var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
if (!styleUtil.isKeyframesSelector(rule)) {
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
p$[i] = transformer.call(this, p, scope, hostScope);
}
}
return p$.join(COMPLEX_SELECTOR_SEP);
},
_transformComplexSelector: function (selector, scope, hostScope) {
var stop = false;
var hostContext = false;
var self = this;
selector = selector.trim();
selector = this._slottedToContent(selector);
selector = selector.replace(ROOT, ':host > *');
selector = selector.replace(CONTENT_START, HOST + ' $1');
selector = selector.replace(SIMPLE_SELECTOR_SEP, function (m, c, s) {
if (!stop) {
var info = self._transformCompoundSelector(s, c, scope, hostScope);
stop = stop || info.stop;
hostContext = hostContext || info.hostContext;
c = info.combinator;
s = info.value;
} else {
s = s.replace(SCOPE_JUMP, ' ');
}
return c + s;
});
if (hostContext) {
selector = selector.replace(HOST_CONTEXT_PAREN, function (m, pre, paren, post) {
return pre + paren + ' ' + hostScope + post + COMPLEX_SELECTOR_SEP + ' ' + pre + hostScope + paren + post;
});
}
return selector;
},
_transformCompoundSelector: function (selector, combinator, scope, hostScope) {
var jumpIndex = selector.search(SCOPE_JUMP);
var hostContext = false;
if (selector.indexOf(HOST_CONTEXT) >= 0) {
hostContext = true;
} else if (selector.indexOf(HOST) >= 0) {
selector = this._transformHostSelector(selector, hostScope);
} else if (jumpIndex !== 0) {
selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
}
if (selector.indexOf(CONTENT) >= 0) {
combinator = '';
}
var stop;
if (jumpIndex >= 0) {
selector = selector.replace(SCOPE_JUMP, ' ');
stop = true;
}
return {
value: selector,
combinator: combinator,
stop: stop,
hostContext: hostContext
};
},
_transformSimpleSelector: function (selector, scope) {
var p$ = selector.split(PSEUDO_PREFIX);
p$[0] += scope;
return p$.join(PSEUDO_PREFIX);
},
_transformHostSelector: function (selector, hostScope) {
var m = selector.match(HOST_PAREN);
var paren = m && m[2].trim() || '';
if (paren) {
if (!paren[0].match(SIMPLE_SELECTOR_PREFIX)) {
var typeSelector = paren.split(SIMPLE_SELECTOR_PREFIX)[0];
if (typeSelector === hostScope) {
return paren;
} else {
return SELECTOR_NO_MATCH;
}
} else {
return selector.replace(HOST_PAREN, function (m, host, paren) {
return hostScope + paren;
});
}
} else {
return selector.replace(HOST, hostScope);
}
},
documentRule: function (rule) {
rule.selector = rule.parsedSelector;
this.normalizeRootSelector(rule);
if (!settings.useNativeShadow) {
this._transformRule(rule, this._transformDocumentSelector);
}
},
normalizeRootSelector: function (rule) {
rule.selector = rule.selector.replace(ROOT, 'html');
var parts = rule.selector.split(COMPLEX_SELECTOR_SEP);
parts = parts.filter(function (part) {
return !part.match(HOST_OR_HOST_GT_STAR);
});
rule.selector = parts.join(COMPLEX_SELECTOR_SEP);
},
_transformDocumentSelector: function (selector) {
return selector.match(SCOPE_JUMP) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
},
_slottedToContent: function (cssText) {
return cssText.replace(SLOTTED_PAREN, CONTENT + '> $1');
},
SCOPE_NAME: 'style-scope'
};
var SCOPE_NAME = api.SCOPE_NAME;
var SCOPE_DOC_SELECTOR = ':not([' + SCOPE_NAME + '])' + ':not(.' + SCOPE_NAME + ')';
var COMPLEX_SELECTOR_SEP = ',';
var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=\[])+)/g;
var SIMPLE_SELECTOR_PREFIX = /[[.:#*]/;
var HOST = ':host';
var ROOT = ':root';
var HOST_PAREN = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/;
var HOST_CONTEXT = ':host-context';
var HOST_CONTEXT_PAREN = /(.*)(?::host-context)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))(.*)/;
var CONTENT = '::content';
var SCOPE_JUMP = /::content|::shadow|\/deep\//;
var CSS_CLASS_PREFIX = '.';
var CSS_ATTR_PREFIX = '[' + SCOPE_NAME + '~=';
var CSS_ATTR_SUFFIX = ']';
var PSEUDO_PREFIX = ':';
var CLASS = 'class';
var CONTENT_START = new RegExp('^(' + CONTENT + ')');
var SELECTOR_NO_MATCH = 'should_not_match';
var SLOTTED_PAREN = /(?:::slotted)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/g;
var HOST_OR_HOST_GT_STAR = /:host(?:\s*>\s*\*)?/;
return api;
}();
Polymer.StyleExtends = function () {
var styleUtil = Polymer.StyleUtil;
return {
hasExtends: function (cssText) {
return Boolean(cssText.match(this.rx.EXTEND));
},
transform: function (style) {
var rules = styleUtil.rulesForStyle(style);
var self = this;
styleUtil.forEachRule(rules, function (rule) {
self._mapRuleOntoParent(rule);
if (rule.parent) {
var m;
while (m = self.rx.EXTEND.exec(rule.cssText)) {
var extend = m[1];
var extendor = self._findExtendor(extend, rule);
if (extendor) {
self._extendRule(rule, extendor);
}
}
}
rule.cssText = rule.cssText.replace(self.rx.EXTEND, '');
});
return styleUtil.toCssText(rules, function (rule) {
if (rule.selector.match(self.rx.STRIP)) {
rule.cssText = '';
}
}, true);
},
_mapRuleOntoParent: function (rule) {
if (rule.parent) {
var map = rule.parent.map || (rule.parent.map = {});
var parts = rule.selector.split(',');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
map[p.trim()] = rule;
}
return map;
}
},
_findExtendor: function (extend, rule) {
return rule.parent && rule.parent.map && rule.parent.map[extend] || this._findExtendor(extend, rule.parent);
},
_extendRule: function (target, source) {
if (target.parent !== source.parent) {
this._cloneAndAddRuleToParent(source, target.parent);
}
target.extends = target.extends || [];
target.extends.push(source);
source.selector = source.selector.replace(this.rx.STRIP, '');
source.selector = (source.selector && source.selector + ',\n') + target.selector;
if (source.extends) {
source.extends.forEach(function (e) {
this._extendRule(target, e);
}, this);
}
},
_cloneAndAddRuleToParent: function (rule, parent) {
rule = Object.create(rule);
rule.parent = parent;
if (rule.extends) {
rule.extends = rule.extends.slice();
}
parent.rules.push(rule);
},
rx: {
EXTEND: /@extends\(([^)]*)\)\s*?;/gim,
STRIP: /%[^,]*$/
}
};
}();
Polymer.ApplyShim = function () {
'use strict';
var styleUtil = Polymer.StyleUtil;
var MIXIN_MATCH = styleUtil.rx.MIXIN_MATCH;
var VAR_ASSIGN = styleUtil.rx.VAR_ASSIGN;
var BAD_VAR = /var\(\s*(--[^,]*),\s*(--[^)]*)\)/g;
var APPLY_NAME_CLEAN = /;\s*/m;
var INITIAL_INHERIT = /^\s*(initial)|(inherit)\s*$/;
var MIXIN_VAR_SEP = '_-_';
var mixinMap = {};
function mapSet(name, props) {
name = name.trim();
mixinMap[name] = {
properties: props,
dependants: {}
};
}
function mapGet(name) {
name = name.trim();
return mixinMap[name];
}
function replaceInitialOrInherit(property, value) {
var match = INITIAL_INHERIT.exec(value);
if (match) {
if (match[1]) {
value = ApplyShim._getInitialValueForProperty(property);
} else {
value = 'apply-shim-inherit';
}
}
return value;
}
function cssTextToMap(text) {
var props = text.split(';');
var property, value;
var out = {};
for (var i = 0, p, sp; i < props.length; i++) {
p = props[i];
if (p) {
sp = p.split(':');
if (sp.length > 1) {
property = sp[0].trim();
value = replaceInitialOrInherit(property, sp.slice(1).join(':'));
out[property] = value;
}
}
}
return out;
}
function invalidateMixinEntry(mixinEntry) {
var currentProto = ApplyShim.__currentElementProto;
var currentElementName = currentProto && currentProto.is;
for (var elementName in mixinEntry.dependants) {
if (elementName !== currentElementName) {
mixinEntry.dependants[elementName].__applyShimInvalid = true;
}
}
}
function produceCssProperties(matchText, propertyName, valueProperty, valueMixin) {
if (valueProperty) {
styleUtil.processVariableAndFallback(valueProperty, function (prefix, value) {
if (value && mapGet(value)) {
valueMixin = '@apply ' + value + ';';
}
});
}
if (!valueMixin) {
return matchText;
}
var mixinAsProperties = consumeCssProperties(valueMixin);
var prefix = matchText.slice(0, matchText.indexOf('--'));
var mixinValues = cssTextToMap(mixinAsProperties);
var combinedProps = mixinValues;
var mixinEntry = mapGet(propertyName);
var oldProps = mixinEntry && mixinEntry.properties;
if (oldProps) {
combinedProps = Object.create(oldProps);
combinedProps = Polymer.Base.mixin(combinedProps, mixinValues);
} else {
mapSet(propertyName, combinedProps);
}
var out = [];
var p, v;
var needToInvalidate = false;
for (p in combinedProps) {
v = mixinValues[p];
if (v === undefined) {
v = 'initial';
}
if (oldProps && !(p in oldProps)) {
needToInvalidate = true;
}
out.push(propertyName + MIXIN_VAR_SEP + p + ': ' + v);
}
if (needToInvalidate) {
invalidateMixinEntry(mixinEntry);
}
if (mixinEntry) {
mixinEntry.properties = combinedProps;
}
if (valueProperty) {
prefix = matchText + ';' + prefix;
}
return prefix + out.join('; ') + ';';
}
function fixVars(matchText, varA, varB) {
return 'var(' + varA + ',' + 'var(' + varB + '))';
}
function atApplyToCssProperties(mixinName, fallbacks) {
mixinName = mixinName.replace(APPLY_NAME_CLEAN, '');
var vars = [];
var mixinEntry = mapGet(mixinName);
if (!mixinEntry) {
mapSet(mixinName, {});
mixinEntry = mapGet(mixinName);
}
if (mixinEntry) {
var currentProto = ApplyShim.__currentElementProto;
if (currentProto) {
mixinEntry.dependants[currentProto.is] = currentProto;
}
var p, parts, f;
for (p in mixinEntry.properties) {
f = fallbacks && fallbacks[p];
parts = [
p,
': var(',
mixinName,
MIXIN_VAR_SEP,
p
];
if (f) {
parts.push(',', f);
}
parts.push(')');
vars.push(parts.join(''));
}
}
return vars.join('; ');
}
function consumeCssProperties(text) {
var m;
while (m = MIXIN_MATCH.exec(text)) {
var matchText = m[0];
var mixinName = m[1];
var idx = m.index;
var applyPos = idx + matchText.indexOf('@apply');
var afterApplyPos = idx + matchText.length;
var textBeforeApply = text.slice(0, applyPos);
var textAfterApply = text.slice(afterApplyPos);
var defaults = cssTextToMap(textBeforeApply);
var replacement = atApplyToCssProperties(mixinName, defaults);
text = [
textBeforeApply,
replacement,
textAfterApply
].join('');
MIXIN_MATCH.lastIndex = idx + replacement.length;
}
return text;
}
var ApplyShim = {
_measureElement: null,
_map: mixinMap,
_separator: MIXIN_VAR_SEP,
transform: function (styles, elementProto) {
this.__currentElementProto = elementProto;
styleUtil.forRulesInStyles(styles, this._boundFindDefinitions);
styleUtil.forRulesInStyles(styles, this._boundFindApplications);
if (elementProto) {
elementProto.__applyShimInvalid = false;
}
this.__currentElementProto = null;
},
_findDefinitions: function (rule) {
var cssText = rule.parsedCssText;
cssText = cssText.replace(BAD_VAR, fixVars);
cssText = cssText.replace(VAR_ASSIGN, produceCssProperties);
rule.cssText = cssText;
if (rule.selector === ':root') {
rule.selector = ':host > *';
}
},
_findApplications: function (rule) {
rule.cssText = consumeCssProperties(rule.cssText);
},
transformRule: function (rule) {
this._findDefinitions(rule);
this._findApplications(rule);
},
_getInitialValueForProperty: function (property) {
if (!this._measureElement) {
this._measureElement = document.createElement('meta');
this._measureElement.style.all = 'initial';
document.head.appendChild(this._measureElement);
}
return window.getComputedStyle(this._measureElement).getPropertyValue(property);
}
};
ApplyShim._boundTransformRule = ApplyShim.transformRule.bind(ApplyShim);
ApplyShim._boundFindDefinitions = ApplyShim._findDefinitions.bind(ApplyShim);
ApplyShim._boundFindApplications = ApplyShim._findApplications.bind(ApplyShim);
return ApplyShim;
}();
(function () {
var prepElement = Polymer.Base._prepElement;
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var styleExtends = Polymer.StyleExtends;
var applyShim = Polymer.ApplyShim;
var settings = Polymer.Settings;
Polymer.Base._addFeature({
_prepElement: function (element) {
if (this._encapsulateStyle && this.__cssBuild !== 'shady') {
styleTransformer.element(element, this.is, this._scopeCssViaAttr);
}
prepElement.call(this, element);
},
_prepStyles: function () {
if (this._encapsulateStyle === undefined) {
this._encapsulateStyle = !nativeShadow;
}
if (!nativeShadow) {
this._scopeStyle = styleUtil.applyStylePlaceHolder(this.is);
}
this.__cssBuild = styleUtil.cssBuildTypeForModule(this.is);
},
_prepShimStyles: function () {
if (this._template) {
var hasTargetedCssBuild = styleUtil.isTargetedBuild(this.__cssBuild);
if (settings.useNativeCSSProperties && this.__cssBuild === 'shadow' && hasTargetedCssBuild) {
if (settings.preserveStyleIncludes) {
styleUtil.styleIncludesToTemplate(this._template);
}
return;
}
this._styles = this._styles || this._collectStyles();
if (settings.useNativeCSSProperties && !this.__cssBuild) {
applyShim.transform(this._styles, this);
}
var cssText = settings.useNativeCSSProperties && hasTargetedCssBuild ? this._styles.length && this._styles[0].textContent.trim() : styleTransformer.elementStyles(this);
this._prepStyleProperties();
if (!this._needsStyleProperties() && cssText) {
styleUtil.applyCss(cssText, this.is, nativeShadow ? this._template.content : null, this._scopeStyle);
}
} else {
this._styles = [];
}
},
_collectStyles: function () {
var styles = [];
var cssText = '', m$ = this.styleModules;
if (m$) {
for (var i = 0, l = m$.length, m; i < l && (m = m$[i]); i++) {
cssText += styleUtil.cssFromModule(m);
}
}
cssText += styleUtil.cssFromModule(this.is);
var p = this._template && this._template.parentNode;
if (this._template && (!p || p.id.toLowerCase() !== this.is)) {
cssText += styleUtil.cssFromElement(this._template);
}
if (cssText) {
var style = document.createElement('style');
style.textContent = cssText;
if (styleExtends.hasExtends(style.textContent)) {
cssText = styleExtends.transform(style);
}
styles.push(style);
}
return styles;
},
_elementAdd: function (node) {
if (this._encapsulateStyle) {
if (node.__styleScoped) {
node.__styleScoped = false;
} else {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr);
}
}
},
_elementRemove: function (node) {
if (this._encapsulateStyle) {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr, true);
}
},
scopeSubtree: function (container, shouldObserve) {
if (nativeShadow) {
return;
}
var self = this;
var scopify = function (node) {
if (node.nodeType === Node.ELEMENT_NODE) {
var className = node.getAttribute('class');
node.setAttribute('class', self._scopeElementClass(node, className));
var n$ = node.querySelectorAll('*');
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
className = n.getAttribute('class');
n.setAttribute('class', self._scopeElementClass(n, className));
}
}
};
scopify(container);
if (shouldObserve) {
var mo = new MutationObserver(function (mxns) {
for (var i = 0, m; i < mxns.length && (m = mxns[i]); i++) {
if (m.addedNodes) {
for (var j = 0; j < m.addedNodes.length; j++) {
scopify(m.addedNodes[j]);
}
}
}
});
mo.observe(container, {
childList: true,
subtree: true
});
return mo;
}
}
});
}());
Polymer.StyleProperties = function () {
'use strict';
var matchesSelector = Polymer.DomApi.matchesSelector;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var IS_IE = navigator.userAgent.match('Trident');
var settings = Polymer.Settings;
return {
decorateStyles: function (styles, scope) {
var self = this, props = {}, keyframes = [], ruleIndex = 0;
var scopeSelector = styleTransformer._calcHostScope(scope.is, scope.extends);
styleUtil.forRulesInStyles(styles, function (rule, style) {
self.decorateRule(rule);
rule.index = ruleIndex++;
self.whenHostOrRootRule(scope, rule, style, function (info) {
if (rule.parent.type === styleUtil.ruleTypes.MEDIA_RULE) {
scope.__notStyleScopeCacheable = true;
}
if (info.isHost) {
var hostContextOrFunction = info.selector.split(' ').some(function (s) {
return s.indexOf(scopeSelector) === 0 && s.length !== scopeSelector.length;
});
scope.__notStyleScopeCacheable = scope.__notStyleScopeCacheable || hostContextOrFunction;
}
});
self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
}, function onKeyframesRule(rule) {
keyframes.push(rule);
});
styles._keyframes = keyframes;
var names = [];
for (var i in props) {
names.push(i);
}
return names;
},
decorateRule: function (rule) {
if (rule.propertyInfo) {
return rule.propertyInfo;
}
var info = {}, properties = {};
var hasProperties = this.collectProperties(rule, properties);
if (hasProperties) {
info.properties = properties;
rule.rules = null;
}
info.cssText = this.collectCssText(rule);
rule.propertyInfo = info;
return info;
},
collectProperties: function (rule, properties) {
var info = rule.propertyInfo;
if (info) {
if (info.properties) {
Polymer.Base.mixin(properties, info.properties);
return true;
}
} else {
var m, rx = this.rx.VAR_ASSIGN;
var cssText = rule.parsedCssText;
var value;
var any;
while (m = rx.exec(cssText)) {
value = (m[2] || m[3]).trim();
if (value !== 'inherit') {
properties[m[1].trim()] = value;
}
any = true;
}
return any;
}
},
collectCssText: function (rule) {
return this.collectConsumingCssText(rule.parsedCssText);
},
collectConsumingCssText: function (cssText) {
return cssText.replace(this.rx.BRACKETED, '').replace(this.rx.VAR_ASSIGN, '');
},
collectPropertiesInCssText: function (cssText, props) {
var m;
while (m = this.rx.VAR_CONSUMED.exec(cssText)) {
var name = m[1];
if (m[2] !== ':') {
props[name] = true;
}
}
},
reify: function (props) {
var names = Object.getOwnPropertyNames(props);
for (var i = 0, n; i < names.length; i++) {
n = names[i];
props[n] = this.valueForProperty(props[n], props);
}
},
valueForProperty: function (property, props) {
if (property) {
if (property.indexOf(';') >= 0) {
property = this.valueForProperties(property, props);
} else {
var self = this;
var fn = function (prefix, value, fallback, suffix) {
var propertyValue = self.valueForProperty(props[value], props);
if (!propertyValue || propertyValue === 'initial') {
propertyValue = self.valueForProperty(props[fallback] || fallback, props) || fallback;
} else if (propertyValue === 'apply-shim-inherit') {
propertyValue = 'inherit';
}
return prefix + (propertyValue || '') + suffix;
};
property = styleUtil.processVariableAndFallback(property, fn);
}
}
return property && property.trim() || '';
},
valueForProperties: function (property, props) {
var parts = property.split(';');
for (var i = 0, p, m; i < parts.length; i++) {
if (p = parts[i]) {
this.rx.MIXIN_MATCH.lastIndex = 0;
m = this.rx.MIXIN_MATCH.exec(p);
if (m) {
p = this.valueForProperty(props[m[1]], props);
} else {
var colon = p.indexOf(':');
if (colon !== -1) {
var pp = p.substring(colon);
pp = pp.trim();
pp = this.valueForProperty(pp, props) || pp;
p = p.substring(0, colon) + pp;
}
}
parts[i] = p && p.lastIndexOf(';') === p.length - 1 ? p.slice(0, -1) : p || '';
}
}
return parts.join(';');
},
applyProperties: function (rule, props) {
var output = '';
if (!rule.propertyInfo) {
this.decorateRule(rule);
}
if (rule.propertyInfo.cssText) {
output = this.valueForProperties(rule.propertyInfo.cssText, props);
}
rule.cssText = output;
},
applyKeyframeTransforms: function (rule, keyframeTransforms) {
var input = rule.cssText;
var output = rule.cssText;
if (rule.hasAnimations == null) {
rule.hasAnimations = this.rx.ANIMATION_MATCH.test(input);
}
if (rule.hasAnimations) {
var transform;
if (rule.keyframeNamesToTransform == null) {
rule.keyframeNamesToTransform = [];
for (var keyframe in keyframeTransforms) {
transform = keyframeTransforms[keyframe];
output = transform(input);
if (input !== output) {
input = output;
rule.keyframeNamesToTransform.push(keyframe);
}
}
} else {
for (var i = 0; i < rule.keyframeNamesToTransform.length; ++i) {
transform = keyframeTransforms[rule.keyframeNamesToTransform[i]];
input = transform(input);
}
output = input;
}
}
rule.cssText = output;
},
propertyDataFromStyles: function (styles, element) {
var props = {}, self = this;
var o = [];
styleUtil.forActiveRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
var selectorToMatch = rule.transformedSelector || rule.parsedSelector;
if (element && rule.propertyInfo.properties && selectorToMatch) {
if (matchesSelector.call(element, selectorToMatch)) {
self.collectProperties(rule, props);
addToBitMask(rule.index, o);
}
}
});
return {
properties: props,
key: o
};
},
_rootSelector: /:root|:host\s*>\s*\*/,
_checkRoot: function (hostScope, selector) {
return Boolean(selector.match(this._rootSelector)) || hostScope === 'html' && selector.indexOf('html') > -1;
},
whenHostOrRootRule: function (scope, rule, style, callback) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
if (!rule.propertyInfo.properties) {
return;
}
var hostScope = scope.is ? styleTransformer._calcHostScope(scope.is, scope.extends) : 'html';
var parsedSelector = rule.parsedSelector;
var isRoot = this._checkRoot(hostScope, parsedSelector);
var isHost = !isRoot && parsedSelector.indexOf(':host') === 0;
var cssBuild = scope.__cssBuild || style.__cssBuild;
if (cssBuild === 'shady') {
isRoot = parsedSelector === hostScope + ' > *.' + hostScope || parsedSelector.indexOf('html') > -1;
isHost = !isRoot && parsedSelector.indexOf(hostScope) === 0;
}
if (!isRoot && !isHost) {
return;
}
var selectorToMatch = hostScope;
if (isHost) {
if (settings.useNativeShadow && !rule.transformedSelector) {
rule.transformedSelector = styleTransformer._transformRuleCss(rule, styleTransformer._transformComplexSelector, scope.is, hostScope);
}
selectorToMatch = rule.transformedSelector || rule.parsedSelector;
}
if (isRoot && hostScope === 'html') {
selectorToMatch = rule.transformedSelector || rule.parsedSelector;
}
callback({
selector: selectorToMatch,
isHost: isHost,
isRoot: isRoot
});
},
hostAndRootPropertiesForScope: function (scope) {
var hostProps = {}, rootProps = {}, self = this;
styleUtil.forActiveRulesInStyles(scope._styles, function (rule, style) {
self.whenHostOrRootRule(scope, rule, style, function (info) {
var element = scope._element || scope;
if (matchesSelector.call(element, info.selector)) {
if (info.isHost) {
self.collectProperties(rule, hostProps);
} else {
self.collectProperties(rule, rootProps);
}
}
});
});
return {
rootProps: rootProps,
hostProps: hostProps
};
},
transformStyles: function (element, properties, scopeSelector) {
var self = this;
var hostSelector = styleTransformer._calcHostScope(element.is, element.extends);
var rxHostSelector = element.extends ? '\\' + hostSelector.slice(0, -1) + '\\]' : hostSelector;
var hostRx = new RegExp(this.rx.HOST_PREFIX + rxHostSelector + this.rx.HOST_SUFFIX);
var keyframeTransforms = this._elementKeyframeTransforms(element, scopeSelector);
return styleTransformer.elementStyles(element, function (rule) {
self.applyProperties(rule, properties);
if (!settings.useNativeShadow && !Polymer.StyleUtil.isKeyframesSelector(rule) && rule.cssText) {
self.applyKeyframeTransforms(rule, keyframeTransforms);
self._scopeSelector(rule, hostRx, hostSelector, element._scopeCssViaAttr, scopeSelector);
}
});
},
_elementKeyframeTransforms: function (element, scopeSelector) {
var keyframesRules = element._styles._keyframes;
var keyframeTransforms = {};
if (!settings.useNativeShadow && keyframesRules) {
for (var i = 0, keyframesRule = keyframesRules[i]; i < keyframesRules.length; keyframesRule = keyframesRules[++i]) {
this._scopeKeyframes(keyframesRule, scopeSelector);
keyframeTransforms[keyframesRule.keyframesName] = this._keyframesRuleTransformer(keyframesRule);
}
}
return keyframeTransforms;
},
_keyframesRuleTransformer: function (keyframesRule) {
return function (cssText) {
return cssText.replace(keyframesRule.keyframesNameRx, keyframesRule.transformedKeyframesName);
};
},
_scopeKeyframes: function (rule, scopeId) {
rule.keyframesNameRx = new RegExp(rule.keyframesName, 'g');
rule.transformedKeyframesName = rule.keyframesName + '-' + scopeId;
rule.transformedSelector = rule.transformedSelector || rule.selector;
rule.selector = rule.transformedSelector.replace(rule.keyframesName, rule.transformedKeyframesName);
},
_scopeSelector: function (rule, hostRx, hostSelector, viaAttr, scopeId) {
rule.transformedSelector = rule.transformedSelector || rule.selector;
var selector = rule.transformedSelector;
var scope = viaAttr ? '[' + styleTransformer.SCOPE_NAME + '~=' + scopeId + ']' : '.' + scopeId;
var parts = selector.split(',');
for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
parts[i] = p.match(hostRx) ? p.replace(hostSelector, scope) : scope + ' ' + p;
}
rule.selector = parts.join(',');
},
applyElementScopeSelector: function (element, selector, old, viaAttr) {
var c = viaAttr ? element.getAttribute(styleTransformer.SCOPE_NAME) : element.getAttribute('class') || '';
var v = old ? c.replace(old, selector) : (c ? c + ' ' : '') + this.XSCOPE_NAME + ' ' + selector;
if (c !== v) {
if (viaAttr) {
element.setAttribute(styleTransformer.SCOPE_NAME, v);
} else {
element.setAttribute('class', v);
}
}
},
applyElementStyle: function (element, properties, selector, style) {
var cssText = style ? style.textContent || '' : this.transformStyles(element, properties, selector);
var s = element._customStyle;
if (s && !settings.useNativeShadow && s !== style) {
s._useCount--;
if (s._useCount <= 0 && s.parentNode) {
s.parentNode.removeChild(s);
}
}
if (settings.useNativeShadow) {
if (element._customStyle) {
element._customStyle.textContent = cssText;
style = element._customStyle;
} else if (cssText) {
style = styleUtil.applyCss(cssText, selector, element.root, element._scopeStyle);
}
} else {
if (!style) {
if (cssText) {
style = styleUtil.applyCss(cssText, selector, null, element._scopeStyle);
}
} else if (!style.parentNode) {
if (IS_IE && cssText.indexOf('@media') > -1) {
style.textContent = cssText;
}
styleUtil.applyStyle(style, null, element._scopeStyle);
}
}
if (style) {
style._useCount = style._useCount || 0;
if (element._customStyle != style) {
style._useCount++;
}
element._customStyle = style;
}
return style;
},
mixinCustomStyle: function (props, customStyle) {
var v;
for (var i in customStyle) {
v = customStyle[i];
if (v || v === 0) {
props[i] = v;
}
}
},
updateNativeStyleProperties: function (element, properties) {
var oldPropertyNames = element.__customStyleProperties;
if (oldPropertyNames) {
for (var i = 0; i < oldPropertyNames.length; i++) {
element.style.removeProperty(oldPropertyNames[i]);
}
}
var propertyNames = [];
for (var p in properties) {
if (properties[p] !== null) {
element.style.setProperty(p, properties[p]);
propertyNames.push(p);
}
}
element.__customStyleProperties = propertyNames;
},
rx: styleUtil.rx,
XSCOPE_NAME: 'x-scope'
};
function addToBitMask(n, bits) {
var o = parseInt(n / 32);
var v = 1 << n % 32;
bits[o] = (bits[o] || 0) | v;
}
}();
(function () {
Polymer.StyleCache = function () {
this.cache = {};
};
Polymer.StyleCache.prototype = {
MAX: 100,
store: function (is, data, keyValues, keyStyles) {
data.keyValues = keyValues;
data.styles = keyStyles;
var s$ = this.cache[is] = this.cache[is] || [];
s$.push(data);
if (s$.length > this.MAX) {
s$.shift();
}
},
retrieve: function (is, keyValues, keyStyles) {
var cache = this.cache[is];
if (cache) {
for (var i = cache.length - 1, data; i >= 0; i--) {
data = cache[i];
if (keyStyles === data.styles && this._objectsEqual(keyValues, data.keyValues)) {
return data;
}
}
}
},
clear: function () {
this.cache = {};
},
_objectsEqual: function (target, source) {
var t, s;
for (var i in target) {
t = target[i], s = source[i];
if (!(typeof t === 'object' && t ? this._objectsStrictlyEqual(t, s) : t === s)) {
return false;
}
}
if (Array.isArray(target)) {
return target.length === source.length;
}
return true;
},
_objectsStrictlyEqual: function (target, source) {
return this._objectsEqual(target, source) && this._objectsEqual(source, target);
}
};
}());
Polymer.StyleDefaults = function () {
var styleProperties = Polymer.StyleProperties;
var StyleCache = Polymer.StyleCache;
var nativeVariables = Polymer.Settings.useNativeCSSProperties;
var api = {
_styles: [],
_properties: null,
customStyle: {},
_styleCache: new StyleCache(),
_element: Polymer.DomApi.wrap(document.documentElement),
addStyle: function (style) {
this._styles.push(style);
this._properties = null;
},
get _styleProperties() {
if (!this._properties) {
styleProperties.decorateStyles(this._styles, this);
this._styles._scopeStyleProperties = null;
this._properties = styleProperties.hostAndRootPropertiesForScope(this).rootProps;
styleProperties.mixinCustomStyle(this._properties, this.customStyle);
styleProperties.reify(this._properties);
}
return this._properties;
},
hasStyleProperties: function () {
return Boolean(this._properties);
},
_needsStyleProperties: function () {
},
_computeStyleProperties: function () {
return this._styleProperties;
},
updateStyles: function (properties) {
this._properties = null;
if (properties) {
Polymer.Base.mixin(this.customStyle, properties);
}
this._styleCache.clear();
for (var i = 0, s; i < this._styles.length; i++) {
s = this._styles[i];
s = s.__importElement || s;
s._apply();
}
if (nativeVariables) {
styleProperties.updateNativeStyleProperties(document.documentElement, this.customStyle);
}
}
};
return api;
}();
(function () {
'use strict';
var serializeValueToAttribute = Polymer.Base.serializeValueToAttribute;
var propertyUtils = Polymer.StyleProperties;
var styleTransformer = Polymer.StyleTransformer;
var styleDefaults = Polymer.StyleDefaults;
var nativeShadow = Polymer.Settings.useNativeShadow;
var nativeVariables = Polymer.Settings.useNativeCSSProperties;
Polymer.Base._addFeature({
_prepStyleProperties: function () {
if (!nativeVariables) {
this._ownStylePropertyNames = this._styles && this._styles.length ? propertyUtils.decorateStyles(this._styles, this) : null;
}
},
customStyle: null,
getComputedStyleValue: function (property) {
if (!nativeVariables && !this._styleProperties) {
this._computeStyleProperties();
}
return !nativeVariables && this._styleProperties && this._styleProperties[property] || getComputedStyle(this).getPropertyValue(property);
},
_setupStyleProperties: function () {
this.customStyle = {};
this._styleCache = null;
this._styleProperties = null;
this._scopeSelector = null;
this._ownStyleProperties = null;
this._customStyle = null;
},
_needsStyleProperties: function () {
return Boolean(!nativeVariables && this._ownStylePropertyNames && this._ownStylePropertyNames.length);
},
_validateApplyShim: function () {
if (this.__applyShimInvalid) {
Polymer.ApplyShim.transform(this._styles, this.__proto__);
var cssText = styleTransformer.elementStyles(this);
if (nativeShadow) {
var templateStyle = this._template.content.querySelector('style');
if (templateStyle) {
templateStyle.textContent = cssText;
}
} else {
var shadyStyle = this._scopeStyle && this._scopeStyle.nextSibling;
if (shadyStyle) {
shadyStyle.textContent = cssText;
}
}
}
},
_beforeAttached: function () {
if ((!this._scopeSelector || this.__stylePropertiesInvalid) && this._needsStyleProperties()) {
this.__stylePropertiesInvalid = false;
this._updateStyleProperties();
}
},
_findStyleHost: function () {
var e = this, root;
while (root = Polymer.dom(e).getOwnerRoot()) {
if (Polymer.isInstance(root.host)) {
return root.host;
}
e = root.host;
}
return styleDefaults;
},
_updateStyleProperties: function () {
var info, scope = this._findStyleHost();
if (!scope._styleProperties) {
scope._computeStyleProperties();
}
if (!scope._styleCache) {
scope._styleCache = new Polymer.StyleCache();
}
var scopeData = propertyUtils.propertyDataFromStyles(scope._styles, this);
var scopeCacheable = !this.__notStyleScopeCacheable;
if (scopeCacheable) {
scopeData.key.customStyle = this.customStyle;
info = scope._styleCache.retrieve(this.is, scopeData.key, this._styles);
}
var scopeCached = Boolean(info);
if (scopeCached) {
this._styleProperties = info._styleProperties;
} else {
this._computeStyleProperties(scopeData.properties);
}
this._computeOwnStyleProperties();
if (!scopeCached) {
info = styleCache.retrieve(this.is, this._ownStyleProperties, this._styles);
}
var globalCached = Boolean(info) && !scopeCached;
var style = this._applyStyleProperties(info);
if (!scopeCached) {
style = style && nativeShadow ? style.cloneNode(true) : style;
info = {
style: style,
_scopeSelector: this._scopeSelector,
_styleProperties: this._styleProperties
};
if (scopeCacheable) {
scopeData.key.customStyle = {};
this.mixin(scopeData.key.customStyle, this.customStyle);
scope._styleCache.store(this.is, info, scopeData.key, this._styles);
}
if (!globalCached) {
styleCache.store(this.is, Object.create(info), this._ownStyleProperties, this._styles);
}
}
},
_computeStyleProperties: function (scopeProps) {
var scope = this._findStyleHost();
if (!scope._styleProperties) {
scope._computeStyleProperties();
}
var props = Object.create(scope._styleProperties);
var hostAndRootProps = propertyUtils.hostAndRootPropertiesForScope(this);
this.mixin(props, hostAndRootProps.hostProps);
scopeProps = scopeProps || propertyUtils.propertyDataFromStyles(scope._styles, this).properties;
this.mixin(props, scopeProps);
this.mixin(props, hostAndRootProps.rootProps);
propertyUtils.mixinCustomStyle(props, this.customStyle);
propertyUtils.reify(props);
this._styleProperties = props;
},
_computeOwnStyleProperties: function () {
var props = {};
for (var i = 0, n; i < this._ownStylePropertyNames.length; i++) {
n = this._ownStylePropertyNames[i];
props[n] = this._styleProperties[n];
}
this._ownStyleProperties = props;
},
_scopeCount: 0,
_applyStyleProperties: function (info) {
var oldScopeSelector = this._scopeSelector;
this._scopeSelector = info ? info._scopeSelector : this.is + '-' + this.__proto__._scopeCount++;
var style = propertyUtils.applyElementStyle(this, this._styleProperties, this._scopeSelector, info && info.style);
if (!nativeShadow) {
propertyUtils.applyElementScopeSelector(this, this._scopeSelector, oldScopeSelector, this._scopeCssViaAttr);
}
return style;
},
serializeValueToAttribute: function (value, attribute, node) {
node = node || this;
if (attribute === 'class' && !nativeShadow) {
var host = node === this ? this.domHost || this.dataHost : this;
if (host) {
value = host._scopeElementClass(node, value);
}
}
node = this.shadyRoot && this.shadyRoot._hasDistributed ? Polymer.dom(node) : node;
serializeValueToAttribute.call(this, value, attribute, node);
},
_scopeElementClass: function (element, selector) {
if (!nativeShadow && !this._scopeCssViaAttr) {
selector = (selector ? selector + ' ' : '') + SCOPE_NAME + ' ' + this.is + (element._scopeSelector ? ' ' + XSCOPE_NAME + ' ' + element._scopeSelector : '');
}
return selector;
},
updateStyles: function (properties) {
if (properties) {
this.mixin(this.customStyle, properties);
}
if (nativeVariables) {
propertyUtils.updateNativeStyleProperties(this, this.customStyle);
} else {
if (this.isAttached) {
if (this._needsStyleProperties()) {
this._updateStyleProperties();
} else {
this._styleProperties = null;
}
} else {
this.__stylePropertiesInvalid = true;
}
if (this._styleCache) {
this._styleCache.clear();
}
this._updateRootStyles();
}
},
_updateRootStyles: function (root) {
root = root || this.root;
var c$ = Polymer.dom(root)._query(function (e) {
return e.shadyRoot || e.shadowRoot;
});
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.updateStyles) {
c.updateStyles();
}
}
}
});
Polymer.updateStyles = function (properties) {
styleDefaults.updateStyles(properties);
Polymer.Base._updateRootStyles(document);
};
var styleCache = new Polymer.StyleCache();
Polymer.customStyleCache = styleCache;
var SCOPE_NAME = styleTransformer.SCOPE_NAME;
var XSCOPE_NAME = propertyUtils.XSCOPE_NAME;
}());
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
if (this.factoryImpl) {
this._prepConstructor();
}
this._prepStyles();
},
_finishRegisterFeatures: function () {
this._prepTemplate();
this._prepShimStyles();
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepPropertyInfo();
this._prepBindings();
this._prepShady();
},
_prepBehavior: function (b) {
this._addPropertyEffects(b.properties);
this._addComplexObserverEffects(b.observers);
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._setupGestures();
this._setupConfigure(this.__data__);
this._setupStyleProperties();
this._setupDebouncers();
this._setupShady();
this._registerHost();
if (this._template) {
this._validateApplyShim();
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
this._marshalAnnotationReferences();
}
this._marshalInstanceEffects();
this._marshalBehaviors();
this._marshalHostAttributes();
this._marshalAttributes();
this._tryReady();
},
_marshalBehavior: function (b) {
if (b.listeners) {
this._listenListeners(b.listeners);
}
}
});
(function () {
var propertyUtils = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var cssParse = Polymer.CssParse;
var styleDefaults = Polymer.StyleDefaults;
var styleTransformer = Polymer.StyleTransformer;
var applyShim = Polymer.ApplyShim;
var debounce = Polymer.Debounce;
var settings = Polymer.Settings;
var updateDebouncer;
Polymer({
is: 'custom-style',
extends: 'style',
_template: null,
properties: { include: String },
ready: function () {
this.__appliedElement = this.__appliedElement || this;
this.__cssBuild = styleUtil.getCssBuildType(this);
if (this.__appliedElement !== this) {
this.__appliedElement.__cssBuild = this.__cssBuild;
}
this._tryApply();
},
attached: function () {
this._tryApply();
},
_tryApply: function () {
if (!this._appliesToDocument) {
if (this.parentNode && this.parentNode.localName !== 'dom-module') {
this._appliesToDocument = true;
var e = this.__appliedElement;
if (!settings.useNativeCSSProperties) {
this.__needsUpdateStyles = styleDefaults.hasStyleProperties();
styleDefaults.addStyle(e);
}
if (e.textContent || this.include) {
this._apply(true);
} else {
var self = this;
var observer = new MutationObserver(function () {
observer.disconnect();
self._apply(true);
});
observer.observe(e, { childList: true });
}
}
}
},
_updateStyles: function () {
Polymer.updateStyles();
},
_apply: function (initialApply) {
var e = this.__appliedElement;
if (this.include) {
e.textContent = styleUtil.cssFromModules(this.include, true) + e.textContent;
}
if (!e.textContent) {
return;
}
var buildType = this.__cssBuild;
var targetedBuild = styleUtil.isTargetedBuild(buildType);
if (settings.useNativeCSSProperties && targetedBuild) {
return;
}
var styleRules = styleUtil.rulesForStyle(e);
if (!targetedBuild) {
styleUtil.forEachRule(styleRules, function (rule) {
styleTransformer.documentRule(rule);
});
if (settings.useNativeCSSProperties && !buildType) {
applyShim.transform([e]);
}
}
if (settings.useNativeCSSProperties) {
e.textContent = styleUtil.toCssText(styleRules);
} else {
var self = this;
var fn = function fn() {
self._flushCustomProperties();
};
if (initialApply) {
Polymer.RenderStatus.whenReady(fn);
} else {
fn();
}
}
},
_flushCustomProperties: function () {
if (this.__needsUpdateStyles) {
this.__needsUpdateStyles = false;
updateDebouncer = debounce(updateDebouncer, this._updateStyles);
} else {
this._applyCustomProperties();
}
},
_applyCustomProperties: function () {
var element = this.__appliedElement;
this._computeStyleProperties();
var props = this._styleProperties;
var rules = styleUtil.rulesForStyle(element);
if (!rules) {
return;
}
element.textContent = styleUtil.toCssText(rules, function (rule) {
var css = rule.cssText = rule.parsedCssText;
if (rule.propertyInfo && rule.propertyInfo.cssText) {
css = cssParse.removeCustomPropAssignment(css);
rule.cssText = propertyUtils.valueForProperties(css, props);
}
});
}
});
}());
Polymer.Templatizer = {
properties: { __hideTemplateChildren__: { observer: '_showHideChildren' } },
_instanceProps: Polymer.nob,
_parentPropPrefix: '_parent_',
templatize: function (template) {
this._templatized = template;
if (!template._content) {
template._content = template.content;
}
if (template._content._ctor) {
this.ctor = template._content._ctor;
this._prepParentProperties(this.ctor.prototype, template);
return;
}
var archetype = Object.create(Polymer.Base);
this._customPrepAnnotations(archetype, template);
this._prepParentProperties(archetype, template);
archetype._prepEffects();
this._customPrepEffects(archetype);
archetype._prepBehaviors();
archetype._prepPropertyInfo();
archetype._prepBindings();
archetype._notifyPathUp = this._notifyPathUpImpl;
archetype._scopeElementClass = this._scopeElementClassImpl;
archetype.listen = this._listenImpl;
archetype._showHideChildren = this._showHideChildrenImpl;
archetype.__setPropertyOrig = this.__setProperty;
archetype.__setProperty = this.__setPropertyImpl;
var _constructor = this._constructorImpl;
var ctor = function TemplateInstance(model, host) {
_constructor.call(this, model, host);
};
ctor.prototype = archetype;
archetype.constructor = ctor;
template._content._ctor = ctor;
this.ctor = ctor;
},
_getRootDataHost: function () {
return this.dataHost && this.dataHost._rootDataHost || this.dataHost;
},
_showHideChildrenImpl: function (hide) {
var c = this._children;
for (var i = 0; i < c.length; i++) {
var n = c[i];
if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
if (n.nodeType === Node.TEXT_NODE) {
if (hide) {
n.__polymerTextContent__ = n.textContent;
n.textContent = '';
} else {
n.textContent = n.__polymerTextContent__;
}
} else if (n.style) {
if (hide) {
n.__polymerDisplay__ = n.style.display;
n.style.display = 'none';
} else {
n.style.display = n.__polymerDisplay__;
}
}
}
n.__hideTemplateChildren__ = hide;
}
},
__setPropertyImpl: function (property, value, fromAbove, node) {
if (node && node.__hideTemplateChildren__ && property == 'textContent') {
property = '__polymerTextContent__';
}
this.__setPropertyOrig(property, value, fromAbove, node);
},
_debounceTemplate: function (fn) {
Polymer.dom.addDebouncer(this.debounce('_debounceTemplate', fn));
},
_flushTemplates: function () {
Polymer.dom.flush();
},
_customPrepEffects: function (archetype) {
var parentProps = archetype._parentProps;
for (var prop in parentProps) {
archetype._addPropertyEffect(prop, 'function', this._createHostPropEffector(prop));
}
for (prop in this._instanceProps) {
archetype._addPropertyEffect(prop, 'function', this._createInstancePropEffector(prop));
}
},
_customPrepAnnotations: function (archetype, template) {
archetype._template = template;
var c = template._content;
if (!c._notes) {
var rootDataHost = archetype._rootDataHost;
if (rootDataHost) {
Polymer.Annotations.prepElement = function () {
rootDataHost._prepElement();
};
}
c._notes = Polymer.Annotations.parseAnnotations(template);
Polymer.Annotations.prepElement = null;
this._processAnnotations(c._notes);
}
archetype._notes = c._notes;
archetype._parentProps = c._parentProps;
},
_prepParentProperties: function (archetype, template) {
var parentProps = this._parentProps = archetype._parentProps;
if (this._forwardParentProp && parentProps) {
var proto = archetype._parentPropProto;
var prop;
if (!proto) {
for (prop in this._instanceProps) {
delete parentProps[prop];
}
proto = archetype._parentPropProto = Object.create(null);
if (template != this) {
Polymer.Bind.prepareModel(proto);
Polymer.Base.prepareModelNotifyPath(proto);
}
for (prop in parentProps) {
var parentProp = this._parentPropPrefix + prop;
var effects = [
{
kind: 'function',
effect: this._createForwardPropEffector(prop),
fn: Polymer.Bind._functionEffect
},
{
kind: 'notify',
fn: Polymer.Bind._notifyEffect,
effect: { event: Polymer.CaseMap.camelToDashCase(parentProp) + '-changed' }
}
];
proto._propertyEffects = proto._propertyEffects || {};
proto._propertyEffects[parentProp] = effects;
Polymer.Bind._createAccessors(proto, parentProp, effects);
}
}
var self = this;
if (template != this) {
Polymer.Bind.prepareInstance(template);
template._forwardParentProp = function (source, value) {
self._forwardParentProp(source, value);
};
}
this._extendTemplate(template, proto);
template._pathEffector = function (path, value, fromAbove) {
return self._pathEffectorImpl(path, value, fromAbove);
};
}
},
_createForwardPropEffector: function (prop) {
return function (source, value) {
this._forwardParentProp(prop, value);
};
},
_createHostPropEffector: function (prop) {
var prefix = this._parentPropPrefix;
return function (source, value) {
this.dataHost._templatized[prefix + prop] = value;
};
},
_createInstancePropEffector: function (prop) {
return function (source, value, old, fromAbove) {
if (!fromAbove) {
this.dataHost._forwardInstanceProp(this, prop, value);
}
};
},
_extendTemplate: function (template, proto) {
var n$ = Object.getOwnPropertyNames(proto);
if (proto._propertySetter) {
template._propertySetter = proto._propertySetter;
}
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
var val = template[n];
if (val && n == '_propertyEffects') {
var pe = Polymer.Base.mixin({}, val);
template._propertyEffects = Polymer.Base.mixin(pe, proto._propertyEffects);
} else {
var pd = Object.getOwnPropertyDescriptor(proto, n);
Object.defineProperty(template, n, pd);
if (val !== undefined) {
template._propertySetter(n, val);
}
}
}
},
_showHideChildren: function (hidden) {
},
_forwardInstancePath: function (inst, path, value) {
},
_forwardInstanceProp: function (inst, prop, value) {
},
_notifyPathUpImpl: function (path, value) {
var dataHost = this.dataHost;
var root = Polymer.Path.root(path);
dataHost._forwardInstancePath.call(dataHost, this, path, value);
if (root in dataHost._parentProps) {
dataHost._templatized._notifyPath(dataHost._parentPropPrefix + path, value);
}
},
_pathEffectorImpl: function (path, value, fromAbove) {
if (this._forwardParentPath) {
if (path.indexOf(this._parentPropPrefix) === 0) {
var subPath = path.substring(this._parentPropPrefix.length);
var model = Polymer.Path.root(subPath);
if (model in this._parentProps) {
this._forwardParentPath(subPath, value);
}
}
}
Polymer.Base._pathEffector.call(this._templatized, path, value, fromAbove);
},
_constructorImpl: function (model, host) {
this._rootDataHost = host._getRootDataHost();
this._setupConfigure(model);
this._registerHost(host);
this._beginHosting();
this.root = this.instanceTemplate(this._template);
this.root.__noContent = !this._notes._hasContent;
this.root.__styleScoped = true;
this._endHosting();
this._marshalAnnotatedNodes();
this._marshalInstanceEffects();
this._marshalAnnotatedListeners();
var children = [];
for (var n = this.root.firstChild; n; n = n.nextSibling) {
children.push(n);
n._templateInstance = this;
}
this._children = children;
if (host.__hideTemplateChildren__) {
this._showHideChildren(true);
}
this._tryReady();
},
_listenImpl: function (node, eventName, methodName) {
var model = this;
var host = this._rootDataHost;
var handler = host._createEventHandler(node, eventName, methodName);
var decorated = function (e) {
e.model = model;
handler(e);
};
host._listen(node, eventName, decorated);
},
_scopeElementClassImpl: function (node, value) {
var host = this._rootDataHost;
if (host) {
return host._scopeElementClass(node, value);
}
return value;
},
stamp: function (model) {
model = model || {};
if (this._parentProps) {
var templatized = this._templatized;
for (var prop in this._parentProps) {
if (model[prop] === undefined) {
model[prop] = templatized[this._parentPropPrefix + prop];
}
}
}
return new this.ctor(model, this);
},
modelForElement: function (el) {
var model;
while (el) {
if (model = el._templateInstance) {
if (model.dataHost != this) {
el = model.dataHost;
} else {
return model;
}
} else {
el = el.parentNode;
}
}
}
};
Polymer({
is: 'dom-template',
extends: 'template',
_template: null,
behaviors: [Polymer.Templatizer],
ready: function () {
this.templatize(this);
}
});
Polymer._collections = new WeakMap();
Polymer.Collection = function (userArray) {
Polymer._collections.set(userArray, this);
this.userArray = userArray;
this.store = userArray.slice();
this.initMap();
};
Polymer.Collection.prototype = {
constructor: Polymer.Collection,
initMap: function () {
var omap = this.omap = new WeakMap();
var pmap = this.pmap = {};
var s = this.store;
for (var i = 0; i < s.length; i++) {
var item = s[i];
if (item && typeof item == 'object') {
omap.set(item, i);
} else {
pmap[item] = i;
}
}
},
add: function (item) {
var key = this.store.push(item) - 1;
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
return '#' + key;
},
removeKey: function (key) {
if (key = this._parseKey(key)) {
this._removeFromMap(this.store[key]);
delete this.store[key];
}
},
_removeFromMap: function (item) {
if (item && typeof item == 'object') {
this.omap.delete(item);
} else {
delete this.pmap[item];
}
},
remove: function (item) {
var key = this.getKey(item);
this.removeKey(key);
return key;
},
getKey: function (item) {
var key;
if (item && typeof item == 'object') {
key = this.omap.get(item);
} else {
key = this.pmap[item];
}
if (key != undefined) {
return '#' + key;
}
},
getKeys: function () {
return Object.keys(this.store).map(function (key) {
return '#' + key;
});
},
_parseKey: function (key) {
if (key && key[0] == '#') {
return key.slice(1);
}
},
setItem: function (key, item) {
if (key = this._parseKey(key)) {
var old = this.store[key];
if (old) {
this._removeFromMap(old);
}
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
this.store[key] = item;
}
},
getItem: function (key) {
if (key = this._parseKey(key)) {
return this.store[key];
}
},
getItems: function () {
var items = [], store = this.store;
for (var key in store) {
items.push(store[key]);
}
return items;
},
_applySplices: function (splices) {
var keyMap = {}, key;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
s.addedKeys = [];
for (var j = 0; j < s.removed.length; j++) {
key = this.getKey(s.removed[j]);
keyMap[key] = keyMap[key] ? null : -1;
}
for (j = 0; j < s.addedCount; j++) {
var item = this.userArray[s.index + j];
key = this.getKey(item);
key = key === undefined ? this.add(item) : key;
keyMap[key] = keyMap[key] ? null : 1;
s.addedKeys.push(key);
}
}
var removed = [];
var added = [];
for (key in keyMap) {
if (keyMap[key] < 0) {
this.removeKey(key);
removed.push(key);
}
if (keyMap[key] > 0) {
added.push(key);
}
}
return [{
removed: removed,
added: added
}];
}
};
Polymer.Collection.get = function (userArray) {
return Polymer._collections.get(userArray) || new Polymer.Collection(userArray);
};
Polymer.Collection.applySplices = function (userArray, splices) {
var coll = Polymer._collections.get(userArray);
return coll ? coll._applySplices(splices) : null;
};
Polymer({
is: 'dom-repeat',
extends: 'template',
_template: null,
properties: {
items: { type: Array },
as: {
type: String,
value: 'item'
},
indexAs: {
type: String,
value: 'index'
},
sort: {
type: Function,
observer: '_sortChanged'
},
filter: {
type: Function,
observer: '_filterChanged'
},
observe: {
type: String,
observer: '_observeChanged'
},
delay: Number,
renderedItemCount: {
type: Number,
notify: !Polymer.Settings.suppressTemplateNotifications,
readOnly: true
},
initialCount: {
type: Number,
observer: '_initializeChunking'
},
targetFramerate: {
type: Number,
value: 20
},
notifyDomChange: { type: Boolean },
_targetFrameTime: {
type: Number,
computed: '_computeFrameTime(targetFramerate)'
}
},
behaviors: [Polymer.Templatizer],
observers: ['_itemsChanged(items.*)'],
created: function () {
this._instances = [];
this._pool = [];
this._limit = Infinity;
var self = this;
this._boundRenderChunk = function () {
self._renderChunk();
};
},
detached: function () {
this.__isDetached = true;
for (var i = 0; i < this._instances.length; i++) {
this._detachInstance(i);
}
},
attached: function () {
if (this.__isDetached) {
this.__isDetached = false;
var refNode;
var parentNode = Polymer.dom(this).parentNode;
if (parentNode.localName == this.is) {
refNode = parentNode;
parentNode = Polymer.dom(parentNode).parentNode;
} else {
refNode = this;
}
var parent = Polymer.dom(parentNode);
for (var i = 0; i < this._instances.length; i++) {
this._attachInstance(i, parent, refNode);
}
}
},
ready: function () {
this._instanceProps = { __key__: true };
this._instanceProps[this.as] = true;
this._instanceProps[this.indexAs] = true;
if (!this.ctor) {
this.templatize(this);
}
},
_sortChanged: function (sort) {
var dataHost = this._getRootDataHost();
this._sortFn = sort && (typeof sort == 'function' ? sort : function () {
return dataHost[sort].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_filterChanged: function (filter) {
var dataHost = this._getRootDataHost();
this._filterFn = filter && (typeof filter == 'function' ? filter : function () {
return dataHost[filter].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_computeFrameTime: function (rate) {
return Math.ceil(1000 / rate);
},
_initializeChunking: function () {
if (this.initialCount) {
this._limit = this.initialCount;
this._chunkCount = this.initialCount;
this._lastChunkTime = performance.now();
}
},
_tryRenderChunk: function () {
if (this.items && this._limit < this.items.length) {
this.debounce('renderChunk', this._requestRenderChunk);
}
},
_requestRenderChunk: function () {
requestAnimationFrame(this._boundRenderChunk);
},
_renderChunk: function () {
var currChunkTime = performance.now();
var ratio = this._targetFrameTime / (currChunkTime - this._lastChunkTime);
this._chunkCount = Math.round(this._chunkCount * ratio) || 1;
this._limit += this._chunkCount;
this._lastChunkTime = currChunkTime;
this._debounceTemplate(this._render);
},
_observeChanged: function () {
this._observePaths = this.observe && this.observe.replace('.*', '.').split(' ');
},
_itemsChanged: function (change) {
if (change.path == 'items') {
if (Array.isArray(this.items)) {
this.collection = Polymer.Collection.get(this.items);
} else if (!this.items) {
this.collection = null;
} else {
this._error(this._logf('dom-repeat', 'expected array for `items`,' + ' found', this.items));
}
this._keySplices = [];
this._indexSplices = [];
this._needFullRefresh = true;
this._initializeChunking();
this._debounceTemplate(this._render);
} else if (change.path == 'items.splices') {
this._keySplices = this._keySplices.concat(change.value.keySplices);
this._indexSplices = this._indexSplices.concat(change.value.indexSplices);
this._debounceTemplate(this._render);
} else {
var subpath = change.path.slice(6);
this._forwardItemPath(subpath, change.value);
this._checkObservedPaths(subpath);
}
},
_checkObservedPaths: function (path) {
if (this._observePaths) {
path = path.substring(path.indexOf('.') + 1);
var paths = this._observePaths;
for (var i = 0; i < paths.length; i++) {
if (path.indexOf(paths[i]) === 0) {
this._needFullRefresh = true;
if (this.delay) {
this.debounce('render', this._render, this.delay);
} else {
this._debounceTemplate(this._render);
}
return;
}
}
}
},
render: function () {
this._needFullRefresh = true;
this._debounceTemplate(this._render);
this._flushTemplates();
},
_render: function () {
if (this._needFullRefresh) {
this._applyFullRefresh();
this._needFullRefresh = false;
} else if (this._keySplices.length) {
if (this._sortFn) {
this._applySplicesUserSort(this._keySplices);
} else {
if (this._filterFn) {
this._applyFullRefresh();
} else {
this._applySplicesArrayOrder(this._indexSplices);
}
}
} else {
}
this._keySplices = [];
this._indexSplices = [];
var keyToIdx = this._keyToInstIdx = {};
for (var i = this._instances.length - 1; i >= 0; i--) {
var inst = this._instances[i];
if (inst.isPlaceholder && i < this._limit) {
inst = this._insertInstance(i, inst.__key__);
} else if (!inst.isPlaceholder && i >= this._limit) {
inst = this._downgradeInstance(i, inst.__key__);
}
keyToIdx[inst.__key__] = i;
if (!inst.isPlaceholder) {
inst.__setProperty(this.indexAs, i, true);
}
}
this._pool.length = 0;
this._setRenderedItemCount(this._instances.length);
if (!Polymer.Settings.suppressTemplateNotifications || this.notifyDomChange) {
this.fire('dom-change');
}
this._tryRenderChunk();
},
_applyFullRefresh: function () {
var c = this.collection;
var keys;
if (this._sortFn) {
keys = c ? c.getKeys() : [];
} else {
keys = [];
var items = this.items;
if (items) {
for (var i = 0; i < items.length; i++) {
keys.push(c.getKey(items[i]));
}
}
}
var self = this;
if (this._filterFn) {
keys = keys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
if (this._sortFn) {
keys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
}
for (i = 0; i < keys.length; i++) {
var key = keys[i];
var inst = this._instances[i];
if (inst) {
inst.__key__ = key;
if (!inst.isPlaceholder && i < this._limit) {
inst.__setProperty(this.as, c.getItem(key), true);
}
} else if (i < this._limit) {
this._insertInstance(i, key);
} else {
this._insertPlaceholder(i, key);
}
}
for (var j = this._instances.length - 1; j >= i; j--) {
this._detachAndRemoveInstance(j);
}
},
_numericSort: function (a, b) {
return a - b;
},
_applySplicesUserSort: function (splices) {
var c = this.collection;
var keyMap = {};
var key;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
key = s.removed[j];
keyMap[key] = keyMap[key] ? null : -1;
}
for (j = 0; j < s.added.length; j++) {
key = s.added[j];
keyMap[key] = keyMap[key] ? null : 1;
}
}
var removedIdxs = [];
var addedKeys = [];
for (key in keyMap) {
if (keyMap[key] === -1) {
removedIdxs.push(this._keyToInstIdx[key]);
}
if (keyMap[key] === 1) {
addedKeys.push(key);
}
}
if (removedIdxs.length) {
removedIdxs.sort(this._numericSort);
for (i = removedIdxs.length - 1; i >= 0; i--) {
var idx = removedIdxs[i];
if (idx !== undefined) {
this._detachAndRemoveInstance(idx);
}
}
}
var self = this;
if (addedKeys.length) {
if (this._filterFn) {
addedKeys = addedKeys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
addedKeys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
var start = 0;
for (i = 0; i < addedKeys.length; i++) {
start = this._insertRowUserSort(start, addedKeys[i]);
}
}
},
_insertRowUserSort: function (start, key) {
var c = this.collection;
var item = c.getItem(key);
var end = this._instances.length - 1;
var idx = -1;
while (start <= end) {
var mid = start + end >> 1;
var midKey = this._instances[mid].__key__;
var cmp = this._sortFn(c.getItem(midKey), item);
if (cmp < 0) {
start = mid + 1;
} else if (cmp > 0) {
end = mid - 1;
} else {
idx = mid;
break;
}
}
if (idx < 0) {
idx = end + 1;
}
this._insertPlaceholder(idx, key);
return idx;
},
_applySplicesArrayOrder: function (splices) {
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
this._detachAndRemoveInstance(s.index);
}
for (j = 0; j < s.addedKeys.length; j++) {
this._insertPlaceholder(s.index + j, s.addedKeys[j]);
}
}
},
_detachInstance: function (idx) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
for (var i = 0; i < inst._children.length; i++) {
var el = inst._children[i];
Polymer.dom(inst.root).appendChild(el);
}
return inst;
}
},
_attachInstance: function (idx, parent, refNode) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
parent.insertBefore(inst.root, refNode);
}
},
_detachAndRemoveInstance: function (idx) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
this._instances.splice(idx, 1);
},
_insertPlaceholder: function (idx, key) {
this._instances.splice(idx, 0, {
isPlaceholder: true,
__key__: key
});
},
_stampInstance: function (idx, key) {
var model = { __key__: key };
model[this.as] = this.collection.getItem(key);
model[this.indexAs] = idx;
return this.stamp(model);
},
_insertInstance: function (idx, key) {
var inst = this._pool.pop();
if (inst) {
inst.__setProperty(this.as, this.collection.getItem(key), true);
inst.__setProperty('__key__', key, true);
} else {
inst = this._stampInstance(idx, key);
}
var beforeRow = this._instances[idx + 1];
var beforeNode = beforeRow && !beforeRow.isPlaceholder ? beforeRow._children[0] : this;
var parentNode = Polymer.dom(this).parentNode;
if (parentNode.localName == this.is) {
if (beforeNode == this) {
beforeNode = parentNode;
}
parentNode = Polymer.dom(parentNode).parentNode;
}
Polymer.dom(parentNode).insertBefore(inst.root, beforeNode);
this._instances[idx] = inst;
return inst;
},
_downgradeInstance: function (idx, key) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
inst = {
isPlaceholder: true,
__key__: key
};
this._instances[idx] = inst;
return inst;
},
_showHideChildren: function (hidden) {
for (var i = 0; i < this._instances.length; i++) {
if (!this._instances[i].isPlaceholder)
this._instances[i]._showHideChildren(hidden);
}
},
_forwardInstanceProp: function (inst, prop, value) {
if (prop == this.as) {
var idx;
if (this._sortFn || this._filterFn) {
idx = this.items.indexOf(this.collection.getItem(inst.__key__));
} else {
idx = inst[this.indexAs];
}
this.set('items.' + idx, value);
}
},
_forwardInstancePath: function (inst, path, value) {
if (path.indexOf(this.as + '.') === 0) {
this._notifyPath('items.' + inst.__key__ + '.' + path.slice(this.as.length + 1), value);
}
},
_forwardParentProp: function (prop, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst.__setProperty(prop, value, true);
}
}
},
_forwardParentPath: function (path, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst._notifyPath(path, value, true);
}
}
},
_forwardItemPath: function (path, value) {
if (this._keyToInstIdx) {
var dot = path.indexOf('.');
var key = path.substring(0, dot < 0 ? path.length : dot);
var idx = this._keyToInstIdx[key];
var inst = this._instances[idx];
if (inst && !inst.isPlaceholder) {
if (dot >= 0) {
path = this.as + '.' + path.substring(dot + 1);
inst._notifyPath(path, value, true);
} else {
inst.__setProperty(this.as, value, true);
}
}
}
},
itemForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.as];
},
keyForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance.__key__;
},
indexForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.indexAs];
}
});
Polymer({
is: 'array-selector',
_template: null,
properties: {
items: {
type: Array,
observer: 'clearSelection'
},
multi: {
type: Boolean,
value: false,
observer: 'clearSelection'
},
selected: {
type: Object,
notify: true
},
selectedItem: {
type: Object,
notify: true
},
toggle: {
type: Boolean,
value: false
}
},
clearSelection: function () {
if (Array.isArray(this.selected)) {
for (var i = 0; i < this.selected.length; i++) {
this.unlinkPaths('selected.' + i);
}
} else {
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
if (this.multi) {
if (!this.selected || this.selected.length) {
this.selected = [];
this._selectedColl = Polymer.Collection.get(this.selected);
}
} else {
this.selected = null;
this._selectedColl = null;
}
this.selectedItem = null;
},
isSelected: function (item) {
if (this.multi) {
return this._selectedColl.getKey(item) !== undefined;
} else {
return this.selected == item;
}
},
deselect: function (item) {
if (this.multi) {
if (this.isSelected(item)) {
var skey = this._selectedColl.getKey(item);
this.arrayDelete('selected', item);
this.unlinkPaths('selected.' + skey);
}
} else {
this.selected = null;
this.selectedItem = null;
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
},
select: function (item) {
var icol = Polymer.Collection.get(this.items);
var key = icol.getKey(item);
if (this.multi) {
if (this.isSelected(item)) {
if (this.toggle) {
this.deselect(item);
}
} else {
this.push('selected', item);
var skey = this._selectedColl.getKey(item);
this.linkPaths('selected.' + skey, 'items.' + key);
}
} else {
if (this.toggle && item == this.selected) {
this.deselect();
} else {
this.selected = item;
this.selectedItem = item;
this.linkPaths('selected', 'items.' + key);
this.linkPaths('selectedItem', 'items.' + key);
}
}
}
});
Polymer({
is: 'dom-if',
extends: 'template',
_template: null,
properties: {
'if': {
type: Boolean,
value: false,
observer: '_queueRender'
},
restamp: {
type: Boolean,
value: false,
observer: '_queueRender'
},
notifyDomChange: { type: Boolean }
},
behaviors: [Polymer.Templatizer],
_queueRender: function () {
this._debounceTemplate(this._render);
},
detached: function () {
var parentNode = this.parentNode;
if (parentNode && parentNode.localName == this.is) {
parentNode = Polymer.dom(parentNode).parentNode;
}
if (!parentNode || parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE && (!Polymer.Settings.hasShadow || !(parentNode instanceof ShadowRoot))) {
this._teardownInstance();
}
},
attached: function () {
if (this.if && this.ctor) {
this.async(this._ensureInstance);
}
},
render: function () {
this._flushTemplates();
},
_render: function () {
if (this.if) {
if (!this.ctor) {
this.templatize(this);
}
this._ensureInstance();
this._showHideChildren();
} else if (this.restamp) {
this._teardownInstance();
}
if (!this.restamp && this._instance) {
this._showHideChildren();
}
if (this.if != this._lastIf) {
if (!Polymer.Settings.suppressTemplateNotifications || this.notifyDomChange) {
this.fire('dom-change');
}
this._lastIf = this.if;
}
},
_ensureInstance: function () {
var refNode;
var parentNode = Polymer.dom(this).parentNode;
if (parentNode && parentNode.localName == this.is) {
refNode = parentNode;
parentNode = Polymer.dom(parentNode).parentNode;
} else {
refNode = this;
}
if (parentNode) {
if (!this._instance) {
this._instance = this.stamp();
var root = this._instance.root;
Polymer.dom(parentNode).insertBefore(root, refNode);
} else {
var c$ = this._instance._children;
if (c$ && c$.length) {
var lastChild = Polymer.dom(refNode).previousSibling;
if (lastChild !== c$[c$.length - 1]) {
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
Polymer.dom(parentNode).insertBefore(n, refNode);
}
}
}
}
}
},
_teardownInstance: function () {
if (this._instance) {
var c$ = this._instance._children;
if (c$ && c$.length) {
var parent = Polymer.dom(Polymer.dom(c$[0]).parentNode);
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
parent.removeChild(n);
}
}
this._instance = null;
}
},
_showHideChildren: function () {
var hidden = this.__hideTemplateChildren__ || !this.if;
if (this._instance) {
this._instance._showHideChildren(hidden);
}
},
_forwardParentProp: function (prop, value) {
if (this._instance) {
this._instance.__setProperty(prop, value, true);
}
},
_forwardParentPath: function (path, value) {
if (this._instance) {
this._instance._notifyPath(path, value, true);
}
}
});
Polymer({
is: 'dom-bind',
properties: { notifyDomChange: { type: Boolean } },
extends: 'template',
_template: null,
created: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
if (document.readyState == 'loading') {
document.addEventListener('DOMContentLoaded', function () {
self._markImportsReady();
});
} else {
self._markImportsReady();
}
});
},
_ensureReady: function () {
if (!this._readied) {
this._readySelf();
}
},
_markImportsReady: function () {
this._importsReady = true;
this._ensureReady();
},
_registerFeatures: function () {
this._prepConstructor();
},
_insertChildren: function () {
var refNode;
var parentNode = Polymer.dom(this).parentNode;
if (parentNode.localName == this.is) {
refNode = parentNode;
parentNode = Polymer.dom(parentNode).parentNode;
} else {
refNode = this;
}
Polymer.dom(parentNode).insertBefore(this.root, refNode);
},
_removeChildren: function () {
if (this._children) {
for (var i = 0; i < this._children.length; i++) {
this.root.appendChild(this._children[i]);
}
}
},
_initFeatures: function () {
},
_scopeElementClass: function (element, selector) {
if (this.dataHost) {
return this.dataHost._scopeElementClass(element, selector);
} else {
return selector;
}
},
_configureInstanceProperties: function () {
},
_prepConfigure: function () {
var config = {};
for (var prop in this._propertyEffects) {
config[prop] = this[prop];
}
var setupConfigure = this._setupConfigure;
this._setupConfigure = function () {
setupConfigure.call(this, config);
};
},
attached: function () {
if (this._importsReady) {
this.render();
}
},
detached: function () {
this._removeChildren();
},
render: function () {
this._ensureReady();
if (!this._children) {
this._template = this;
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepConfigure();
this._prepBindings();
this._prepPropertyInfo();
Polymer.Base._initFeatures.call(this);
this._children = Polymer.TreeApi.arrayCopyChildNodes(this.root);
}
this._insertChildren();
if (!Polymer.Settings.suppressTemplateNotifications || this.notifyDomChange) {
this.fire('dom-change');
}
}
});
Polymer({
is: 'iron-media-query',
properties: {
queryMatches: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
query: {
type: String,
observer: 'queryChanged'
},
full: {
type: Boolean,
value: false
},
_boundMQHandler: {
value: function () {
return this.queryHandler.bind(this);
}
},
_mq: { value: null }
},
attached: function () {
this.style.display = 'none';
this.queryChanged();
},
detached: function () {
this._remove();
},
_add: function () {
if (this._mq) {
this._mq.addListener(this._boundMQHandler);
}
},
_remove: function () {
if (this._mq) {
this._mq.removeListener(this._boundMQHandler);
}
this._mq = null;
},
queryChanged: function () {
this._remove();
var query = this.query;
if (!query) {
return;
}
if (!this.full && query[0] !== '(') {
query = '(' + query + ')';
}
this._mq = window.matchMedia(query);
this._add();
this.queryHandler(this._mq);
},
queryHandler: function (mq) {
this._setQueryMatches(mq.matches);
}
});
Polymer.IronSelection = function (selectCallback) {
this.selection = [];
this.selectCallback = selectCallback;
};
Polymer.IronSelection.prototype = {
get: function () {
return this.multi ? this.selection.slice() : this.selection[0];
},
clear: function (excludes) {
this.selection.slice().forEach(function (item) {
if (!excludes || excludes.indexOf(item) < 0) {
this.setItemSelected(item, false);
}
}, this);
},
isSelected: function (item) {
return this.selection.indexOf(item) >= 0;
},
setItemSelected: function (item, isSelected) {
if (item != null) {
if (isSelected !== this.isSelected(item)) {
if (isSelected) {
this.selection.push(item);
} else {
var i = this.selection.indexOf(item);
if (i >= 0) {
this.selection.splice(i, 1);
}
}
if (this.selectCallback) {
this.selectCallback(item, isSelected);
}
}
}
},
select: function (item) {
if (this.multi) {
this.toggle(item);
} else if (this.get() !== item) {
this.setItemSelected(this.get(), false);
this.setItemSelected(item, true);
}
},
toggle: function (item) {
this.setItemSelected(item, !this.isSelected(item));
}
};
Polymer.IronSelectableBehavior = {
properties: {
attrForSelected: {
type: String,
value: null
},
selected: {
type: String,
notify: true
},
selectedItem: {
type: Object,
readOnly: true,
notify: true
},
activateEvent: {
type: String,
value: 'tap',
observer: '_activateEventChanged'
},
selectable: String,
selectedClass: {
type: String,
value: 'iron-selected'
},
selectedAttribute: {
type: String,
value: null
},
fallbackSelection: {
type: String,
value: null
},
items: {
type: Array,
readOnly: true,
notify: true,
value: function () {
return [];
}
},
_excludedLocalNames: {
type: Object,
value: function () {
return { 'template': 1 };
}
}
},
observers: [
'_updateAttrForSelected(attrForSelected)',
'_updateSelected(selected)',
'_checkFallback(fallbackSelection)'
],
created: function () {
this._bindFilterItem = this._filterItem.bind(this);
this._selection = new Polymer.IronSelection(this._applySelection.bind(this));
},
attached: function () {
this._observer = this._observeItems(this);
this._updateItems();
if (!this._shouldUpdateSelection) {
this._updateSelected();
}
this._addListener(this.activateEvent);
},
detached: function () {
if (this._observer) {
Polymer.dom(this).unobserveNodes(this._observer);
}
this._removeListener(this.activateEvent);
},
indexOf: function (item) {
return this.items.indexOf(item);
},
select: function (value) {
this.selected = value;
},
selectPrevious: function () {
var length = this.items.length;
var index = (Number(this._valueToIndex(this.selected)) - 1 + length) % length;
this.selected = this._indexToValue(index);
},
selectNext: function () {
var index = (Number(this._valueToIndex(this.selected)) + 1) % this.items.length;
this.selected = this._indexToValue(index);
},
selectIndex: function (index) {
this.select(this._indexToValue(index));
},
forceSynchronousItemUpdate: function () {
this._updateItems();
},
get _shouldUpdateSelection() {
return this.selected != null;
},
_checkFallback: function () {
if (this._shouldUpdateSelection) {
this._updateSelected();
}
},
_addListener: function (eventName) {
this.listen(this, eventName, '_activateHandler');
},
_removeListener: function (eventName) {
this.unlisten(this, eventName, '_activateHandler');
},
_activateEventChanged: function (eventName, old) {
this._removeListener(old);
this._addListener(eventName);
},
_updateItems: function () {
var nodes = Polymer.dom(this).queryDistributedElements(this.selectable || '*');
nodes = Array.prototype.filter.call(nodes, this._bindFilterItem);
this._setItems(nodes);
},
_updateAttrForSelected: function () {
if (this._shouldUpdateSelection) {
this.selected = this._indexToValue(this.indexOf(this.selectedItem));
}
},
_updateSelected: function () {
this._selectSelected(this.selected);
},
_selectSelected: function (selected) {
this._selection.select(this._valueToItem(this.selected));
if (this.fallbackSelection && this.items.length && this._selection.get() === undefined) {
this.selected = this.fallbackSelection;
}
},
_filterItem: function (node) {
return !this._excludedLocalNames[node.localName];
},
_valueToItem: function (value) {
return value == null ? null : this.items[this._valueToIndex(value)];
},
_valueToIndex: function (value) {
if (this.attrForSelected) {
for (var i = 0, item; item = this.items[i]; i++) {
if (this._valueForItem(item) == value) {
return i;
}
}
} else {
return Number(value);
}
},
_indexToValue: function (index) {
if (this.attrForSelected) {
var item = this.items[index];
if (item) {
return this._valueForItem(item);
}
} else {
return index;
}
},
_valueForItem: function (item) {
var propValue = item[Polymer.CaseMap.dashToCamelCase(this.attrForSelected)];
return propValue != undefined ? propValue : item.getAttribute(this.attrForSelected);
},
_applySelection: function (item, isSelected) {
if (this.selectedClass) {
this.toggleClass(this.selectedClass, isSelected, item);
}
if (this.selectedAttribute) {
this.toggleAttribute(this.selectedAttribute, isSelected, item);
}
this._selectionChange();
this.fire('iron-' + (isSelected ? 'select' : 'deselect'), { item: item });
},
_selectionChange: function () {
this._setSelectedItem(this._selection.get());
},
_observeItems: function (node) {
return Polymer.dom(node).observeNodes(function (mutation) {
this._updateItems();
if (this._shouldUpdateSelection) {
this._updateSelected();
}
this.fire('iron-items-changed', mutation, {
bubbles: false,
cancelable: false
});
});
},
_activateHandler: function (e) {
var t = e.target;
var items = this.items;
while (t && t != this) {
var i = items.indexOf(t);
if (i >= 0) {
var value = this._indexToValue(i);
this._itemActivate(value, t);
return;
}
t = t.parentNode;
}
},
_itemActivate: function (value, item) {
if (!this.fire('iron-activate', {
selected: value,
item: item
}, { cancelable: true }).defaultPrevented) {
this.select(value);
}
}
};
Polymer.IronMultiSelectableBehaviorImpl = {
properties: {
multi: {
type: Boolean,
value: false,
observer: 'multiChanged'
},
selectedValues: {
type: Array,
notify: true
},
selectedItems: {
type: Array,
readOnly: true,
notify: true
}
},
observers: ['_updateSelected(selectedValues.splices)'],
select: function (value) {
if (this.multi) {
if (this.selectedValues) {
this._toggleSelected(value);
} else {
this.selectedValues = [value];
}
} else {
this.selected = value;
}
},
multiChanged: function (multi) {
this._selection.multi = multi;
},
get _shouldUpdateSelection() {
return this.selected != null || this.selectedValues != null && this.selectedValues.length;
},
_updateAttrForSelected: function () {
if (!this.multi) {
Polymer.IronSelectableBehavior._updateAttrForSelected.apply(this);
} else if (this._shouldUpdateSelection) {
this.selectedValues = this.selectedItems.map(function (selectedItem) {
return this._indexToValue(this.indexOf(selectedItem));
}, this).filter(function (unfilteredValue) {
return unfilteredValue != null;
}, this);
}
},
_updateSelected: function () {
if (this.multi) {
this._selectMulti(this.selectedValues);
} else {
this._selectSelected(this.selected);
}
},
_selectMulti: function (values) {
if (values) {
var selectedItems = this._valuesToItems(values);
this._selection.clear(selectedItems);
for (var i = 0; i < selectedItems.length; i++) {
this._selection.setItemSelected(selectedItems[i], true);
}
if (this.fallbackSelection && this.items.length && !this._selection.get().length) {
var fallback = this._valueToItem(this.fallbackSelection);
if (fallback) {
this.selectedValues = [this.fallbackSelection];
}
}
} else {
this._selection.clear();
}
},
_selectionChange: function () {
var s = this._selection.get();
if (this.multi) {
this._setSelectedItems(s);
} else {
this._setSelectedItems([s]);
this._setSelectedItem(s);
}
},
_toggleSelected: function (value) {
var i = this.selectedValues.indexOf(value);
var unselected = i < 0;
if (unselected) {
this.push('selectedValues', value);
} else {
this.splice('selectedValues', i, 1);
}
},
_valuesToItems: function (values) {
return values == null ? null : values.map(function (value) {
return this._valueToItem(value);
}, this);
}
};
Polymer.IronMultiSelectableBehavior = [
Polymer.IronSelectableBehavior,
Polymer.IronMultiSelectableBehaviorImpl
];
Polymer({
is: 'iron-selector',
behaviors: [Polymer.IronMultiSelectableBehavior]
});
Polymer.IronResizableBehavior = {
properties: {
_parentResizable: {
type: Object,
observer: '_parentResizableChanged'
},
_notifyingDescendant: {
type: Boolean,
value: false
}
},
listeners: { 'iron-request-resize-notifications': '_onIronRequestResizeNotifications' },
created: function () {
this._interestedResizables = [];
this._boundNotifyResize = this.notifyResize.bind(this);
},
attached: function () {
this.fire('iron-request-resize-notifications', null, {
node: this,
bubbles: true,
cancelable: true
});
if (!this._parentResizable) {
window.addEventListener('resize', this._boundNotifyResize);
this.notifyResize();
}
},
detached: function () {
if (this._parentResizable) {
this._parentResizable.stopResizeNotificationsFor(this);
} else {
window.removeEventListener('resize', this._boundNotifyResize);
}
this._parentResizable = null;
},
notifyResize: function () {
if (!this.isAttached) {
return;
}
this._interestedResizables.forEach(function (resizable) {
if (this.resizerShouldNotify(resizable)) {
this._notifyDescendant(resizable);
}
}, this);
this._fireResize();
},
assignParentResizable: function (parentResizable) {
this._parentResizable = parentResizable;
},
stopResizeNotificationsFor: function (target) {
var index = this._interestedResizables.indexOf(target);
if (index > -1) {
this._interestedResizables.splice(index, 1);
this.unlisten(target, 'iron-resize', '_onDescendantIronResize');
}
},
resizerShouldNotify: function (element) {
return true;
},
_onDescendantIronResize: function (event) {
if (this._notifyingDescendant) {
event.stopPropagation();
return;
}
if (!Polymer.Settings.useShadow) {
this._fireResize();
}
},
_fireResize: function () {
this.fire('iron-resize', null, {
node: this,
bubbles: false
});
},
_onIronRequestResizeNotifications: function (event) {
var target = event.path ? event.path[0] : event.target;
if (target === this) {
return;
}
if (this._interestedResizables.indexOf(target) === -1) {
this._interestedResizables.push(target);
this.listen(target, 'iron-resize', '_onDescendantIronResize');
}
target.assignParentResizable(this);
this._notifyDescendant(target);
event.stopPropagation();
},
_parentResizableChanged: function (parentResizable) {
if (parentResizable) {
window.removeEventListener('resize', this._boundNotifyResize);
}
},
_notifyDescendant: function (descendant) {
if (!this.isAttached) {
return;
}
this._notifyingDescendant = true;
descendant.notifyResize();
this._notifyingDescendant = false;
}
};
(function () {
'use strict';
var sharedPanel = null;
function classNames(obj) {
var classes = [];
for (var key in obj) {
if (obj.hasOwnProperty(key) && obj[key]) {
classes.push(key);
}
}
return classes.join(' ');
}
Polymer({
is: 'paper-drawer-panel',
behaviors: [Polymer.IronResizableBehavior],
properties: {
defaultSelected: {
type: String,
value: 'main'
},
disableEdgeSwipe: {
type: Boolean,
value: false
},
disableSwipe: {
type: Boolean,
value: false
},
dragging: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
drawerWidth: {
type: String,
value: '256px'
},
edgeSwipeSensitivity: {
type: Number,
value: 30
},
forceNarrow: {
type: Boolean,
value: false
},
hasTransform: {
type: Boolean,
value: function () {
return 'transform' in this.style;
}
},
hasWillChange: {
type: Boolean,
value: function () {
return 'willChange' in this.style;
}
},
narrow: {
reflectToAttribute: true,
type: Boolean,
value: false,
readOnly: true,
notify: true
},
peeking: {
type: Boolean,
value: false,
readOnly: true,
notify: true
},
responsiveWidth: {
type: String,
value: '768px'
},
rightDrawer: {
type: Boolean,
value: false
},
selected: {
reflectToAttribute: true,
notify: true,
type: String,
value: null
},
drawerToggleAttribute: {
type: String,
value: 'paper-drawer-toggle'
},
drawerFocusSelector: {
type: String,
value: 'a[href]:not([tabindex="-1"]),' + 'area[href]:not([tabindex="-1"]),' + 'input:not([disabled]):not([tabindex="-1"]),' + 'select:not([disabled]):not([tabindex="-1"]),' + 'textarea:not([disabled]):not([tabindex="-1"]),' + 'button:not([disabled]):not([tabindex="-1"]),' + 'iframe:not([tabindex="-1"]),' + '[tabindex]:not([tabindex="-1"]),' + '[contentEditable=true]:not([tabindex="-1"])'
},
_transition: {
type: Boolean,
value: false
}
},
listeners: {
tap: '_onTap',
track: '_onTrack',
down: '_downHandler',
up: '_upHandler',
transitionend: '_onTransitionEnd'
},
observers: [
'_forceNarrowChanged(forceNarrow, defaultSelected)',
'_toggleFocusListener(selected)'
],
ready: function () {
this._transition = true;
this._boundFocusListener = this._didFocus.bind(this);
},
togglePanel: function () {
if (this._isMainSelected()) {
this.openDrawer();
} else {
this.closeDrawer();
}
},
openDrawer: function () {
requestAnimationFrame(function () {
this.toggleClass('transition-drawer', true, this.$.drawer);
this.selected = 'drawer';
}.bind(this));
},
closeDrawer: function () {
requestAnimationFrame(function () {
this.toggleClass('transition-drawer', true, this.$.drawer);
this.selected = 'main';
}.bind(this));
},
_onTransitionEnd: function (e) {
var target = Polymer.dom(e).localTarget;
if (target !== this) {
return;
}
if (e.propertyName === 'left' || e.propertyName === 'right') {
this.notifyResize();
}
if (e.propertyName === 'transform') {
requestAnimationFrame(function () {
this.toggleClass('transition-drawer', false, this.$.drawer);
}.bind(this));
if (this.selected === 'drawer') {
var focusedChild = this._getAutoFocusedNode();
focusedChild && focusedChild.focus();
}
}
},
_computeIronSelectorClass: function (narrow, transition, dragging, rightDrawer, peeking) {
return classNames({
dragging: dragging,
'narrow-layout': narrow,
'right-drawer': rightDrawer,
'left-drawer': !rightDrawer,
transition: transition,
peeking: peeking
});
},
_computeDrawerStyle: function (drawerWidth) {
return 'width:' + drawerWidth + ';';
},
_computeMainStyle: function (narrow, rightDrawer, drawerWidth) {
var style = '';
style += 'left:' + (narrow || rightDrawer ? '0' : drawerWidth) + ';';
if (rightDrawer) {
style += 'right:' + (narrow ? '' : drawerWidth) + ';';
}
return style;
},
_computeMediaQuery: function (forceNarrow, responsiveWidth) {
return forceNarrow ? '' : '(max-width: ' + responsiveWidth + ')';
},
_computeSwipeOverlayHidden: function (narrow, disableEdgeSwipe) {
return !narrow || disableEdgeSwipe;
},
_onTrack: function (event) {
if (sharedPanel && this !== sharedPanel) {
return;
}
switch (event.detail.state) {
case 'start':
this._trackStart(event);
break;
case 'track':
this._trackX(event);
break;
case 'end':
this._trackEnd(event);
break;
}
},
_responsiveChange: function (narrow) {
this._setNarrow(narrow);
this.selected = this.narrow ? this.defaultSelected : null;
this.setScrollDirection(this._swipeAllowed() ? 'y' : 'all');
this.fire('paper-responsive-change', { narrow: this.narrow });
},
_onQueryMatchesChanged: function (event) {
this._responsiveChange(event.detail.value);
},
_forceNarrowChanged: function () {
this._responsiveChange(this.forceNarrow || this.$.mq.queryMatches);
},
_swipeAllowed: function () {
return this.narrow && !this.disableSwipe;
},
_isMainSelected: function () {
return this.selected === 'main';
},
_startEdgePeek: function () {
this.width = this.$.drawer.offsetWidth;
this._moveDrawer(this._translateXForDeltaX(this.rightDrawer ? -this.edgeSwipeSensitivity : this.edgeSwipeSensitivity));
this._setPeeking(true);
},
_stopEdgePeek: function () {
if (this.peeking) {
this._setPeeking(false);
this._moveDrawer(null);
}
},
_downHandler: function (event) {
if (!this.dragging && this._isMainSelected() && this._isEdgeTouch(event) && !sharedPanel) {
this._startEdgePeek();
event.preventDefault();
sharedPanel = this;
}
},
_upHandler: function () {
this._stopEdgePeek();
sharedPanel = null;
},
_onTap: function (event) {
var targetElement = Polymer.dom(event).localTarget;
var isTargetToggleElement = targetElement && this.drawerToggleAttribute && targetElement.hasAttribute(this.drawerToggleAttribute);
if (isTargetToggleElement) {
this.togglePanel();
}
},
_isEdgeTouch: function (event) {
var x = event.detail.x;
return !this.disableEdgeSwipe && this._swipeAllowed() && (this.rightDrawer ? x >= this.offsetWidth - this.edgeSwipeSensitivity : x <= this.edgeSwipeSensitivity);
},
_trackStart: function (event) {
if (this._swipeAllowed()) {
sharedPanel = this;
this._setDragging(true);
if (this._isMainSelected()) {
this._setDragging(this.peeking || this._isEdgeTouch(event));
}
if (this.dragging) {
this.width = this.$.drawer.offsetWidth;
this._transition = false;
}
}
},
_translateXForDeltaX: function (deltaX) {
var isMain = this._isMainSelected();
if (this.rightDrawer) {
return Math.max(0, isMain ? this.width + deltaX : deltaX);
} else {
return Math.min(0, isMain ? deltaX - this.width : deltaX);
}
},
_trackX: function (event) {
if (this.dragging) {
var dx = event.detail.dx;
if (this.peeking) {
if (Math.abs(dx) <= this.edgeSwipeSensitivity) {
return;
}
this._setPeeking(false);
}
this._moveDrawer(this._translateXForDeltaX(dx));
}
},
_trackEnd: function (event) {
if (this.dragging) {
var xDirection = event.detail.dx > 0;
this._setDragging(false);
this._transition = true;
sharedPanel = null;
this._moveDrawer(null);
if (this.rightDrawer) {
this[xDirection ? 'closeDrawer' : 'openDrawer']();
} else {
this[xDirection ? 'openDrawer' : 'closeDrawer']();
}
}
},
_transformForTranslateX: function (translateX) {
if (translateX === null) {
return '';
}
return this.hasWillChange ? 'translateX(' + translateX + 'px)' : 'translate3d(' + translateX + 'px, 0, 0)';
},
_moveDrawer: function (translateX) {
this.transform(this._transformForTranslateX(translateX), this.$.drawer);
},
_getDrawerContent: function () {
return Polymer.dom(this.$.drawerContent).getDistributedNodes()[0];
},
_getAutoFocusedNode: function () {
var drawerContent = this._getDrawerContent();
return this.drawerFocusSelector ? Polymer.dom(drawerContent).querySelector(this.drawerFocusSelector) || drawerContent : null;
},
_toggleFocusListener: function (selected) {
if (selected === 'drawer') {
this.addEventListener('focus', this._boundFocusListener, true);
} else {
this.removeEventListener('focus', this._boundFocusListener, true);
}
},
_didFocus: function (event) {
var autoFocusedNode = this._getAutoFocusedNode();
if (!autoFocusedNode) {
return;
}
var path = Polymer.dom(event).path;
var focusedChild = path[0];
var drawerContent = this._getDrawerContent();
var focusedChildCameFromDrawer = path.indexOf(drawerContent) !== -1;
if (!focusedChildCameFromDrawer) {
event.stopPropagation();
autoFocusedNode.focus();
}
},
_isDrawerClosed: function (narrow, selected) {
return !narrow || selected !== 'drawer';
}
});
}());
function MakePromise(asap) {
function Promise(fn) {
if (typeof this !== 'object' || typeof fn !== 'function')
throw new TypeError();
this._state = null;
this._value = null;
this._deferreds = [];
doResolve(fn, resolve.bind(this), reject.bind(this));
}
function handle(deferred) {
var me = this;
if (this._state === null) {
this._deferreds.push(deferred);
return;
}
asap(function () {
var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
if (typeof cb !== 'function') {
(me._state ? deferred.resolve : deferred.reject)(me._value);
return;
}
var ret;
try {
ret = cb(me._value);
} catch (e) {
deferred.reject(e);
return;
}
deferred.resolve(ret);
});
}
function resolve(newValue) {
try {
if (newValue === this)
throw new TypeError();
if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
var then = newValue.then;
if (typeof then === 'function') {
doResolve(then.bind(newValue), resolve.bind(this), reject.bind(this));
return;
}
}
this._state = true;
this._value = newValue;
finale.call(this);
} catch (e) {
reject.call(this, e);
}
}
function reject(newValue) {
this._state = false;
this._value = newValue;
finale.call(this);
}
function finale() {
for (var i = 0, len = this._deferreds.length; i < len; i++) {
handle.call(this, this._deferreds[i]);
}
this._deferreds = null;
}
function doResolve(fn, onFulfilled, onRejected) {
var done = false;
try {
fn(function (value) {
if (done)
return;
done = true;
onFulfilled(value);
}, function (reason) {
if (done)
return;
done = true;
onRejected(reason);
});
} catch (ex) {
if (done)
return;
done = true;
onRejected(ex);
}
}
Promise.prototype['catch'] = function (onRejected) {
return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
var me = this;
return new Promise(function (resolve, reject) {
handle.call(me, {
onFulfilled: onFulfilled,
onRejected: onRejected,
resolve: resolve,
reject: reject
});
});
};
Promise.resolve = function (value) {
if (value && typeof value === 'object' && value.constructor === Promise) {
return value;
}
return new Promise(function (resolve) {
resolve(value);
});
};
Promise.reject = function (value) {
return new Promise(function (resolve, reject) {
reject(value);
});
};
return Promise;
}
if (typeof module !== 'undefined') {
module.exports = MakePromise;
};
if (!window.Promise) {
window.Promise = MakePromise(Polymer.Base.async);
};
'use strict';
Polymer({
is: 'iron-request',
hostAttributes: { hidden: true },
properties: {
xhr: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return new XMLHttpRequest();
}
},
response: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return null;
}
},
status: {
type: Number,
notify: true,
readOnly: true,
value: 0
},
statusText: {
type: String,
notify: true,
readOnly: true,
value: ''
},
completes: {
type: Object,
readOnly: true,
notify: true,
value: function () {
return new Promise(function (resolve, reject) {
this.resolveCompletes = resolve;
this.rejectCompletes = reject;
}.bind(this));
}
},
progress: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return {};
}
},
aborted: {
type: Boolean,
notify: true,
readOnly: true,
value: false
},
errored: {
type: Boolean,
notify: true,
readOnly: true,
value: false
},
timedOut: {
type: Boolean,
notify: true,
readOnly: true,
value: false
}
},
get succeeded() {
if (this.errored || this.aborted || this.timedOut) {
return false;
}
var status = this.xhr.status || 0;
return status === 0 || status >= 200 && status < 300;
},
send: function (options) {
var xhr = this.xhr;
if (xhr.readyState > 0) {
return null;
}
xhr.addEventListener('progress', function (progress) {
this._setProgress({
lengthComputable: progress.lengthComputable,
loaded: progress.loaded,
total: progress.total
});
}.bind(this));
xhr.addEventListener('error', function (error) {
this._setErrored(true);
this._updateStatus();
this.rejectCompletes(error);
}.bind(this));
xhr.addEventListener('timeout', function (error) {
this._setTimedOut(true);
this._updateStatus();
this.rejectCompletes(error);
}.bind(this));
xhr.addEventListener('abort', function () {
this._updateStatus();
this.rejectCompletes(new Error('Request aborted.'));
}.bind(this));
xhr.addEventListener('loadend', function () {
this._updateStatus();
this._setResponse(this.parseResponse());
if (!this.succeeded) {
this.rejectCompletes(new Error('The request failed with status code: ' + this.xhr.status));
return;
}
this.resolveCompletes(this);
}.bind(this));
this.url = options.url;
xhr.open(options.method || 'GET', options.url, options.async !== false);
var acceptType = {
'json': 'application/json',
'text': 'text/plain',
'html': 'text/html',
'xml': 'application/xml',
'arraybuffer': 'application/octet-stream'
}[options.handleAs];
var headers = options.headers || Object.create(null);
var newHeaders = Object.create(null);
for (var key in headers) {
newHeaders[key.toLowerCase()] = headers[key];
}
headers = newHeaders;
if (acceptType && !headers['accept']) {
headers['accept'] = acceptType;
}
Object.keys(headers).forEach(function (requestHeader) {
if (/[A-Z]/.test(requestHeader)) {
Polymer.Base._error('Headers must be lower case, got', requestHeader);
}
xhr.setRequestHeader(requestHeader, headers[requestHeader]);
}, this);
if (options.async !== false) {
if (options.async) {
xhr.timeout = options.timeout;
}
var handleAs = options.handleAs;
if (!!options.jsonPrefix || !handleAs) {
handleAs = 'text';
}
xhr.responseType = xhr._responseType = handleAs;
if (!!options.jsonPrefix) {
xhr._jsonPrefix = options.jsonPrefix;
}
}
xhr.withCredentials = !!options.withCredentials;
var body = this._encodeBodyObject(options.body, headers['content-type']);
xhr.send(body);
return this.completes;
},
parseResponse: function () {
var xhr = this.xhr;
var responseType = xhr.responseType || xhr._responseType;
var preferResponseText = !this.xhr.responseType;
var prefixLen = xhr._jsonPrefix && xhr._jsonPrefix.length || 0;
try {
switch (responseType) {
case 'json':
if (preferResponseText || xhr.response === undefined) {
try {
return JSON.parse(xhr.responseText);
} catch (_) {
return null;
}
}
return xhr.response;
case 'xml':
return xhr.responseXML;
case 'blob':
case 'document':
case 'arraybuffer':
return xhr.response;
case 'text':
default: {
if (prefixLen) {
try {
return JSON.parse(xhr.responseText.substring(prefixLen));
} catch (_) {
return null;
}
}
return xhr.responseText;
}
}
} catch (e) {
this.rejectCompletes(new Error('Could not parse response. ' + e.message));
}
},
abort: function () {
this._setAborted(true);
this.xhr.abort();
},
_encodeBodyObject: function (body, contentType) {
if (typeof body == 'string') {
return body;
}
var bodyObj = body;
switch (contentType) {
case 'application/json':
return JSON.stringify(bodyObj);
case 'application/x-www-form-urlencoded':
return this._wwwFormUrlEncode(bodyObj);
}
return body;
},
_wwwFormUrlEncode: function (object) {
if (!object) {
return '';
}
var pieces = [];
Object.keys(object).forEach(function (key) {
pieces.push(this._wwwFormUrlEncodePiece(key) + '=' + this._wwwFormUrlEncodePiece(object[key]));
}, this);
return pieces.join('&');
},
_wwwFormUrlEncodePiece: function (str) {
if (str === null) {
return '';
}
return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n')).replace(/%20/g, '+');
},
_updateStatus: function () {
this._setStatus(this.xhr.status);
this._setStatusText(this.xhr.statusText === undefined ? '' : this.xhr.statusText);
}
});
'use strict';
Polymer({
is: 'iron-ajax',
hostAttributes: { hidden: true },
properties: {
url: { type: String },
params: {
type: Object,
value: function () {
return {};
}
},
method: {
type: String,
value: 'GET'
},
headers: {
type: Object,
value: function () {
return {};
}
},
contentType: {
type: String,
value: null
},
body: {
type: Object,
value: null
},
sync: {
type: Boolean,
value: false
},
handleAs: {
type: String,
value: 'json'
},
withCredentials: {
type: Boolean,
value: false
},
timeout: {
type: Number,
value: 0
},
auto: {
type: Boolean,
value: false
},
verbose: {
type: Boolean,
value: false
},
lastRequest: {
type: Object,
notify: true,
readOnly: true
},
loading: {
type: Boolean,
notify: true,
readOnly: true
},
lastResponse: {
type: Object,
notify: true,
readOnly: true
},
lastError: {
type: Object,
notify: true,
readOnly: true
},
activeRequests: {
type: Array,
notify: true,
readOnly: true,
value: function () {
return [];
}
},
debounceDuration: {
type: Number,
value: 0,
notify: true
},
jsonPrefix: {
type: String,
value: ''
},
bubbles: {
type: Boolean,
value: false
},
_boundHandleResponse: {
type: Function,
value: function () {
return this._handleResponse.bind(this);
}
}
},
observers: ['_requestOptionsChanged(url, method, params.*, headers, contentType, ' + 'body, sync, handleAs, jsonPrefix, withCredentials, timeout, auto)'],
get queryString() {
var queryParts = [];
var param;
var value;
for (param in this.params) {
value = this.params[param];
param = window.encodeURIComponent(param);
if (Array.isArray(value)) {
for (var i = 0; i < value.length; i++) {
queryParts.push(param + '=' + window.encodeURIComponent(value[i]));
}
} else if (value !== null) {
queryParts.push(param + '=' + window.encodeURIComponent(value));
} else {
queryParts.push(param);
}
}
return queryParts.join('&');
},
get requestUrl() {
var queryString = this.queryString;
var url = this.url || '';
if (queryString) {
var bindingChar = url.indexOf('?') >= 0 ? '&' : '?';
return url + bindingChar + queryString;
}
return url;
},
get requestHeaders() {
var headers = {};
var contentType = this.contentType;
if (contentType == null && typeof this.body === 'string') {
contentType = 'application/x-www-form-urlencoded';
}
if (contentType) {
headers['content-type'] = contentType;
}
var header;
if (this.headers instanceof Object) {
for (header in this.headers) {
headers[header] = this.headers[header].toString();
}
}
return headers;
},
toRequestOptions: function () {
return {
url: this.requestUrl || '',
method: this.method,
headers: this.requestHeaders,
body: this.body,
async: !this.sync,
handleAs: this.handleAs,
jsonPrefix: this.jsonPrefix,
withCredentials: this.withCredentials,
timeout: this.timeout
};
},
generateRequest: function () {
var request = document.createElement('iron-request');
var requestOptions = this.toRequestOptions();
this.push('activeRequests', request);
request.completes.then(this._boundHandleResponse).catch(this._handleError.bind(this, request)).then(this._discardRequest.bind(this, request));
request.send(requestOptions);
this._setLastRequest(request);
this._setLoading(true);
this.fire('request', {
request: request,
options: requestOptions
}, { bubbles: this.bubbles });
this.fire('iron-ajax-request', {
request: request,
options: requestOptions
}, { bubbles: this.bubbles });
return request;
},
_handleResponse: function (request) {
if (request === this.lastRequest) {
this._setLastResponse(request.response);
this._setLastError(null);
this._setLoading(false);
}
this.fire('response', request, { bubbles: this.bubbles });
this.fire('iron-ajax-response', request, { bubbles: this.bubbles });
},
_handleError: function (request, error) {
if (this.verbose) {
Polymer.Base._error(error);
}
if (request === this.lastRequest) {
this._setLastError({
request: request,
error: error,
status: request.xhr.status,
statusText: request.xhr.statusText,
response: request.xhr.response
});
this._setLastResponse(null);
this._setLoading(false);
}
this.fire('iron-ajax-error', {
request: request,
error: error
}, { bubbles: this.bubbles });
this.fire('error', {
request: request,
error: error
}, { bubbles: this.bubbles });
},
_discardRequest: function (request) {
var requestIndex = this.activeRequests.indexOf(request);
if (requestIndex > -1) {
this.splice('activeRequests', requestIndex, 1);
}
},
_requestOptionsChanged: function () {
this.debounce('generate-request', function () {
if (this.url == null) {
return;
}
if (this.auto) {
this.generateRequest();
}
}, this.debounceDuration);
}
});
Polymer({
is: 'paper-toolbar',
hostAttributes: { 'role': 'toolbar' },
properties: {
bottomJustify: {
type: String,
value: ''
},
justify: {
type: String,
value: ''
},
middleJustify: {
type: String,
value: ''
}
},
attached: function () {
this._observer = this._observe(this);
this._updateAriaLabelledBy();
},
detached: function () {
if (this._observer) {
this._observer.disconnect();
}
},
_observe: function (node) {
var observer = new MutationObserver(function () {
this._updateAriaLabelledBy();
}.bind(this));
observer.observe(node, {
childList: true,
subtree: true
});
return observer;
},
_updateAriaLabelledBy: function () {
var labelledBy = [];
var contents = Polymer.dom(this.root).querySelectorAll('content');
for (var content, index = 0; content = contents[index]; index++) {
var nodes = Polymer.dom(content).getDistributedNodes();
for (var node, jndex = 0; node = nodes[jndex]; jndex++) {
if (node.classList && node.classList.contains('title')) {
if (node.id) {
labelledBy.push(node.id);
} else {
var id = 'paper-toolbar-label-' + Math.floor(Math.random() * 10000);
node.id = id;
labelledBy.push(id);
}
}
}
}
if (labelledBy.length > 0) {
this.setAttribute('aria-labelledby', labelledBy.join(' '));
}
},
_computeBarExtraClasses: function (barJustify) {
if (!barJustify)
return '';
return barJustify + (barJustify === 'justified' ? '' : '-justified');
}
});
(function () {
'use strict';
var KEY_IDENTIFIER = {
'U+0008': 'backspace',
'U+0009': 'tab',
'U+001B': 'esc',
'U+0020': 'space',
'U+007F': 'del'
};
var KEY_CODE = {
8: 'backspace',
9: 'tab',
13: 'enter',
27: 'esc',
33: 'pageup',
34: 'pagedown',
35: 'end',
36: 'home',
32: 'space',
37: 'left',
38: 'up',
39: 'right',
40: 'down',
46: 'del',
106: '*'
};
var MODIFIER_KEYS = {
'shift': 'shiftKey',
'ctrl': 'ctrlKey',
'alt': 'altKey',
'meta': 'metaKey'
};
var KEY_CHAR = /[a-z0-9*]/;
var IDENT_CHAR = /U\+/;
var ARROW_KEY = /^arrow/;
var SPACE_KEY = /^space(bar)?/;
var ESC_KEY = /^escape$/;
function transformKey(key, noSpecialChars) {
var validKey = '';
if (key) {
var lKey = key.toLowerCase();
if (lKey === ' ' || SPACE_KEY.test(lKey)) {
validKey = 'space';
} else if (ESC_KEY.test(lKey)) {
validKey = 'esc';
} else if (lKey.length == 1) {
if (!noSpecialChars || KEY_CHAR.test(lKey)) {
validKey = lKey;
}
} else if (ARROW_KEY.test(lKey)) {
validKey = lKey.replace('arrow', '');
} else if (lKey == 'multiply') {
validKey = '*';
} else {
validKey = lKey;
}
}
return validKey;
}
function transformKeyIdentifier(keyIdent) {
var validKey = '';
if (keyIdent) {
if (keyIdent in KEY_IDENTIFIER) {
validKey = KEY_IDENTIFIER[keyIdent];
} else if (IDENT_CHAR.test(keyIdent)) {
keyIdent = parseInt(keyIdent.replace('U+', '0x'), 16);
validKey = String.fromCharCode(keyIdent).toLowerCase();
} else {
validKey = keyIdent.toLowerCase();
}
}
return validKey;
}
function transformKeyCode(keyCode) {
var validKey = '';
if (Number(keyCode)) {
if (keyCode >= 65 && keyCode <= 90) {
validKey = String.fromCharCode(32 + keyCode);
} else if (keyCode >= 112 && keyCode <= 123) {
validKey = 'f' + (keyCode - 112);
} else if (keyCode >= 48 && keyCode <= 57) {
validKey = String(keyCode - 48);
} else if (keyCode >= 96 && keyCode <= 105) {
validKey = String(keyCode - 96);
} else {
validKey = KEY_CODE[keyCode];
}
}
return validKey;
}
function normalizedKeyForEvent(keyEvent, noSpecialChars) {
if (keyEvent.key) {
return transformKey(keyEvent.key, noSpecialChars);
}
if (keyEvent.detail && keyEvent.detail.key) {
return transformKey(keyEvent.detail.key, noSpecialChars);
}
return transformKeyIdentifier(keyEvent.keyIdentifier) || transformKeyCode(keyEvent.keyCode) || '';
}
function keyComboMatchesEvent(keyCombo, event) {
var keyEvent = normalizedKeyForEvent(event, keyCombo.hasModifiers);
return keyEvent === keyCombo.key && (!keyCombo.hasModifiers || !!event.shiftKey === !!keyCombo.shiftKey && !!event.ctrlKey === !!keyCombo.ctrlKey && !!event.altKey === !!keyCombo.altKey && !!event.metaKey === !!keyCombo.metaKey);
}
function parseKeyComboString(keyComboString) {
if (keyComboString.length === 1) {
return {
combo: keyComboString,
key: keyComboString,
event: 'keydown'
};
}
return keyComboString.split('+').reduce(function (parsedKeyCombo, keyComboPart) {
var eventParts = keyComboPart.split(':');
var keyName = eventParts[0];
var event = eventParts[1];
if (keyName in MODIFIER_KEYS) {
parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
parsedKeyCombo.hasModifiers = true;
} else {
parsedKeyCombo.key = keyName;
parsedKeyCombo.event = event || 'keydown';
}
return parsedKeyCombo;
}, { combo: keyComboString.split(':').shift() });
}
function parseEventString(eventString) {
return eventString.trim().split(' ').map(function (keyComboString) {
return parseKeyComboString(keyComboString);
});
}
Polymer.IronA11yKeysBehavior = {
properties: {
keyEventTarget: {
type: Object,
value: function () {
return this;
}
},
stopKeyboardEventPropagation: {
type: Boolean,
value: false
},
_boundKeyHandlers: {
type: Array,
value: function () {
return [];
}
},
_imperativeKeyBindings: {
type: Object,
value: function () {
return {};
}
}
},
observers: ['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],
keyBindings: {},
registered: function () {
this._prepKeyBindings();
},
attached: function () {
this._listenKeyEventListeners();
},
detached: function () {
this._unlistenKeyEventListeners();
},
addOwnKeyBinding: function (eventString, handlerName) {
this._imperativeKeyBindings[eventString] = handlerName;
this._prepKeyBindings();
this._resetKeyEventListeners();
},
removeOwnKeyBindings: function () {
this._imperativeKeyBindings = {};
this._prepKeyBindings();
this._resetKeyEventListeners();
},
keyboardEventMatchesKeys: function (event, eventString) {
var keyCombos = parseEventString(eventString);
for (var i = 0; i < keyCombos.length; ++i) {
if (keyComboMatchesEvent(keyCombos[i], event)) {
return true;
}
}
return false;
},
_collectKeyBindings: function () {
var keyBindings = this.behaviors.map(function (behavior) {
return behavior.keyBindings;
});
if (keyBindings.indexOf(this.keyBindings) === -1) {
keyBindings.push(this.keyBindings);
}
return keyBindings;
},
_prepKeyBindings: function () {
this._keyBindings = {};
this._collectKeyBindings().forEach(function (keyBindings) {
for (var eventString in keyBindings) {
this._addKeyBinding(eventString, keyBindings[eventString]);
}
}, this);
for (var eventString in this._imperativeKeyBindings) {
this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
}
for (var eventName in this._keyBindings) {
this._keyBindings[eventName].sort(function (kb1, kb2) {
var b1 = kb1[0].hasModifiers;
var b2 = kb2[0].hasModifiers;
return b1 === b2 ? 0 : b1 ? -1 : 1;
});
}
},
_addKeyBinding: function (eventString, handlerName) {
parseEventString(eventString).forEach(function (keyCombo) {
this._keyBindings[keyCombo.event] = this._keyBindings[keyCombo.event] || [];
this._keyBindings[keyCombo.event].push([
keyCombo,
handlerName
]);
}, this);
},
_resetKeyEventListeners: function () {
this._unlistenKeyEventListeners();
if (this.isAttached) {
this._listenKeyEventListeners();
}
},
_listenKeyEventListeners: function () {
if (!this.keyEventTarget) {
return;
}
Object.keys(this._keyBindings).forEach(function (eventName) {
var keyBindings = this._keyBindings[eventName];
var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);
this._boundKeyHandlers.push([
this.keyEventTarget,
eventName,
boundKeyHandler
]);
this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
}, this);
},
_unlistenKeyEventListeners: function () {
var keyHandlerTuple;
var keyEventTarget;
var eventName;
var boundKeyHandler;
while (this._boundKeyHandlers.length) {
keyHandlerTuple = this._boundKeyHandlers.pop();
keyEventTarget = keyHandlerTuple[0];
eventName = keyHandlerTuple[1];
boundKeyHandler = keyHandlerTuple[2];
keyEventTarget.removeEventListener(eventName, boundKeyHandler);
}
},
_onKeyBindingEvent: function (keyBindings, event) {
if (this.stopKeyboardEventPropagation) {
event.stopPropagation();
}
if (event.defaultPrevented) {
return;
}
for (var i = 0; i < keyBindings.length; i++) {
var keyCombo = keyBindings[i][0];
var handlerName = keyBindings[i][1];
if (keyComboMatchesEvent(keyCombo, event)) {
this._triggerKeyHandler(keyCombo, handlerName, event);
if (event.defaultPrevented) {
return;
}
}
}
},
_triggerKeyHandler: function (keyCombo, handlerName, keyboardEvent) {
var detail = Object.create(keyCombo);
detail.keyboardEvent = keyboardEvent;
var event = new CustomEvent(keyCombo.event, {
detail: detail,
cancelable: true
});
this[handlerName].call(this, event);
if (event.defaultPrevented) {
keyboardEvent.preventDefault();
}
}
};
}());
Polymer.IronControlState = {
properties: {
focused: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
disabled: {
type: Boolean,
value: false,
notify: true,
observer: '_disabledChanged',
reflectToAttribute: true
},
_oldTabIndex: { type: Number },
_boundFocusBlurHandler: {
type: Function,
value: function () {
return this._focusBlurHandler.bind(this);
}
}
},
observers: ['_changedControlState(focused, disabled)'],
ready: function () {
this.addEventListener('focus', this._boundFocusBlurHandler, true);
this.addEventListener('blur', this._boundFocusBlurHandler, true);
},
_focusBlurHandler: function (event) {
if (event.target === this) {
this._setFocused(event.type === 'focus');
} else if (!this.shadowRoot) {
var target = Polymer.dom(event).localTarget;
if (!this.isLightDescendant(target)) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
}
},
_disabledChanged: function (disabled, old) {
this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
this.style.pointerEvents = disabled ? 'none' : '';
if (disabled) {
this._oldTabIndex = this.tabIndex;
this._setFocused(false);
this.tabIndex = -1;
this.blur();
} else if (this._oldTabIndex !== undefined) {
this.tabIndex = this._oldTabIndex;
}
},
_changedControlState: function () {
if (this._controlStateChanged) {
this._controlStateChanged();
}
}
};
Polymer.IronButtonStateImpl = {
properties: {
pressed: {
type: Boolean,
readOnly: true,
value: false,
reflectToAttribute: true,
observer: '_pressedChanged'
},
toggles: {
type: Boolean,
value: false,
reflectToAttribute: true
},
active: {
type: Boolean,
value: false,
notify: true,
reflectToAttribute: true
},
pointerDown: {
type: Boolean,
readOnly: true,
value: false
},
receivedFocusFromKeyboard: {
type: Boolean,
readOnly: true
},
ariaActiveAttribute: {
type: String,
value: 'aria-pressed',
observer: '_ariaActiveAttributeChanged'
}
},
listeners: {
down: '_downHandler',
up: '_upHandler',
tap: '_tapHandler'
},
observers: [
'_focusChanged(focused)',
'_activeChanged(active, ariaActiveAttribute)'
],
keyBindings: {
'enter:keydown': '_asyncClick',
'space:keydown': '_spaceKeyDownHandler',
'space:keyup': '_spaceKeyUpHandler'
},
_mouseEventRe: /^mouse/,
_tapHandler: function () {
if (this.toggles) {
this._userActivate(!this.active);
} else {
this.active = false;
}
},
_focusChanged: function (focused) {
this._detectKeyboardFocus(focused);
if (!focused) {
this._setPressed(false);
}
},
_detectKeyboardFocus: function (focused) {
this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
},
_userActivate: function (active) {
if (this.active !== active) {
this.active = active;
this.fire('change');
}
},
_downHandler: function (event) {
this._setPointerDown(true);
this._setPressed(true);
this._setReceivedFocusFromKeyboard(false);
},
_upHandler: function () {
this._setPointerDown(false);
this._setPressed(false);
},
_spaceKeyDownHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
keyboardEvent.preventDefault();
keyboardEvent.stopImmediatePropagation();
this._setPressed(true);
},
_spaceKeyUpHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
if (this.pressed) {
this._asyncClick();
}
this._setPressed(false);
},
_asyncClick: function () {
this.async(function () {
this.click();
}, 1);
},
_pressedChanged: function (pressed) {
this._changedButtonState();
},
_ariaActiveAttributeChanged: function (value, oldValue) {
if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
this.removeAttribute(oldValue);
}
},
_activeChanged: function (active, ariaActiveAttribute) {
if (this.toggles) {
this.setAttribute(this.ariaActiveAttribute, active ? 'true' : 'false');
} else {
this.removeAttribute(this.ariaActiveAttribute);
}
this._changedButtonState();
},
_controlStateChanged: function () {
if (this.disabled) {
this._setPressed(false);
} else {
this._changedButtonState();
}
},
_changedButtonState: function () {
if (this._buttonStateChanged) {
this._buttonStateChanged();
}
}
};
Polymer.IronButtonState = [
Polymer.IronA11yKeysBehavior,
Polymer.IronButtonStateImpl
];
Polymer.PaperItemBehaviorImpl = {
hostAttributes: {
role: 'option',
tabindex: '0'
}
};
Polymer.PaperItemBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperItemBehaviorImpl
];
Polymer({
is: 'paper-item',
behaviors: [Polymer.PaperItemBehavior]
});
Polymer({ is: 'paper-item-body' });
Polymer.IronMenuBehaviorImpl = {
properties: {
focusedItem: {
observer: '_focusedItemChanged',
readOnly: true,
type: Object
},
attrForItemTitle: { type: String },
disabled: {
type: Boolean,
value: false,
observer: '_disabledChanged'
}
},
_SEARCH_RESET_TIMEOUT_MS: 1000,
_previousTabIndex: 0,
hostAttributes: { 'role': 'menu' },
observers: ['_updateMultiselectable(multi)'],
listeners: {
'focus': '_onFocus',
'keydown': '_onKeydown',
'iron-items-changed': '_onIronItemsChanged'
},
keyBindings: {
'up': '_onUpKey',
'down': '_onDownKey',
'esc': '_onEscKey',
'shift+tab:keydown': '_onShiftTabDown'
},
attached: function () {
this._resetTabindices();
},
select: function (value) {
if (this._defaultFocusAsync) {
this.cancelAsync(this._defaultFocusAsync);
this._defaultFocusAsync = null;
}
var item = this._valueToItem(value);
if (item && item.hasAttribute('disabled'))
return;
this._setFocusedItem(item);
Polymer.IronMultiSelectableBehaviorImpl.select.apply(this, arguments);
},
_resetTabindices: function () {
var selectedItem = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
this.items.forEach(function (item) {
item.setAttribute('tabindex', item === selectedItem ? '0' : '-1');
}, this);
},
_updateMultiselectable: function (multi) {
if (multi) {
this.setAttribute('aria-multiselectable', 'true');
} else {
this.removeAttribute('aria-multiselectable');
}
},
_focusWithKeyboardEvent: function (event) {
this.cancelDebouncer('_clearSearchText');
var searchText = this._searchText || '';
var key = event.key && event.key.length == 1 ? event.key : String.fromCharCode(event.keyCode);
searchText += key.toLocaleLowerCase();
var searchLength = searchText.length;
for (var i = 0, item; item = this.items[i]; i++) {
if (item.hasAttribute('disabled')) {
continue;
}
var attr = this.attrForItemTitle || 'textContent';
var title = (item[attr] || item.getAttribute(attr) || '').trim();
if (title.length < searchLength) {
continue;
}
if (title.slice(0, searchLength).toLocaleLowerCase() == searchText) {
this._setFocusedItem(item);
break;
}
}
this._searchText = searchText;
this.debounce('_clearSearchText', this._clearSearchText, this._SEARCH_RESET_TIMEOUT_MS);
},
_clearSearchText: function () {
this._searchText = '';
},
_focusPrevious: function () {
var length = this.items.length;
var curFocusIndex = Number(this.indexOf(this.focusedItem));
for (var i = 1; i < length + 1; i++) {
var item = this.items[(curFocusIndex - i + length) % length];
if (!item.hasAttribute('disabled')) {
var owner = Polymer.dom(item).getOwnerRoot() || document;
this._setFocusedItem(item);
if (Polymer.dom(owner).activeElement == item) {
return;
}
}
}
},
_focusNext: function () {
var length = this.items.length;
var curFocusIndex = Number(this.indexOf(this.focusedItem));
for (var i = 1; i < length + 1; i++) {
var item = this.items[(curFocusIndex + i) % length];
if (!item.hasAttribute('disabled')) {
var owner = Polymer.dom(item).getOwnerRoot() || document;
this._setFocusedItem(item);
if (Polymer.dom(owner).activeElement == item) {
return;
}
}
}
},
_applySelection: function (item, isSelected) {
if (isSelected) {
item.setAttribute('aria-selected', 'true');
} else {
item.removeAttribute('aria-selected');
}
Polymer.IronSelectableBehavior._applySelection.apply(this, arguments);
},
_focusedItemChanged: function (focusedItem, old) {
old && old.setAttribute('tabindex', '-1');
if (focusedItem && !focusedItem.hasAttribute('disabled') && !this.disabled) {
focusedItem.setAttribute('tabindex', '0');
focusedItem.focus();
}
},
_onIronItemsChanged: function (event) {
if (event.detail.addedNodes.length) {
this._resetTabindices();
}
},
_onShiftTabDown: function (event) {
var oldTabIndex = this.getAttribute('tabindex');
Polymer.IronMenuBehaviorImpl._shiftTabPressed = true;
this._setFocusedItem(null);
this.setAttribute('tabindex', '-1');
this.async(function () {
this.setAttribute('tabindex', oldTabIndex);
Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;
}, 1);
},
_onFocus: function (event) {
if (Polymer.IronMenuBehaviorImpl._shiftTabPressed) {
return;
}
var rootTarget = Polymer.dom(event).rootTarget;
if (rootTarget !== this && typeof rootTarget.tabIndex !== 'undefined' && !this.isLightDescendant(rootTarget)) {
return;
}
this._defaultFocusAsync = this.async(function () {
var selectedItem = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
this._setFocusedItem(null);
if (selectedItem) {
this._setFocusedItem(selectedItem);
} else if (this.items[0]) {
this._focusNext();
}
});
},
_onUpKey: function (event) {
this._focusPrevious();
event.detail.keyboardEvent.preventDefault();
},
_onDownKey: function (event) {
this._focusNext();
event.detail.keyboardEvent.preventDefault();
},
_onEscKey: function (event) {
this.focusedItem.blur();
},
_onKeydown: function (event) {
if (!this.keyboardEventMatchesKeys(event, 'up down esc')) {
this._focusWithKeyboardEvent(event);
}
event.stopPropagation();
},
_activateHandler: function (event) {
Polymer.IronSelectableBehavior._activateHandler.call(this, event);
event.stopPropagation();
},
_disabledChanged: function (disabled) {
if (disabled) {
this._previousTabIndex = this.hasAttribute('tabindex') ? this.tabIndex : 0;
this.removeAttribute('tabindex');
} else if (!this.hasAttribute('tabindex')) {
this.setAttribute('tabindex', this._previousTabIndex);
}
}
};
Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;
Polymer.IronMenuBehavior = [
Polymer.IronMultiSelectableBehavior,
Polymer.IronA11yKeysBehavior,
Polymer.IronMenuBehaviorImpl
];
(function () {
Polymer({
is: 'paper-menu',
behaviors: [Polymer.IronMenuBehavior]
});
}());
(function () {
var metaDatas = {};
var metaArrays = {};
var singleton = null;
Polymer.IronMeta = Polymer({
is: 'iron-meta',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
observer: '_valueChanged'
},
self: {
type: Boolean,
observer: '_selfChanged'
},
list: {
type: Array,
notify: true
}
},
hostAttributes: { hidden: true },
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
case 'value':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key, old) {
this._resetRegistration(old);
},
_valueChanged: function (value) {
this._resetRegistration(this.key);
},
_selfChanged: function (self) {
if (self) {
this.value = this;
}
},
_typeChanged: function (type) {
this._unregisterKey(this.key);
if (!metaDatas[type]) {
metaDatas[type] = {};
}
this._metaData = metaDatas[type];
if (!metaArrays[type]) {
metaArrays[type] = [];
}
this.list = metaArrays[type];
this._registerKeyValue(this.key, this.value);
},
byKey: function (key) {
return this._metaData && this._metaData[key];
},
_resetRegistration: function (oldKey) {
this._unregisterKey(oldKey);
this._registerKeyValue(this.key, this.value);
},
_unregisterKey: function (key) {
this._unregister(key, this._metaData, this.list);
},
_registerKeyValue: function (key, value) {
this._register(key, value, this._metaData, this.list);
},
_register: function (key, value, data, list) {
if (key && data && value !== undefined) {
data[key] = value;
list.push(value);
}
},
_unregister: function (key, data, list) {
if (key && data) {
if (key in data) {
var value = data[key];
delete data[key];
this.arrayDelete(list, value);
}
}
}
});
Polymer.IronMeta.getIronMeta = function getIronMeta() {
if (singleton === null) {
singleton = new Polymer.IronMeta();
}
return singleton;
};
Polymer.IronMetaQuery = Polymer({
is: 'iron-meta-query',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
readOnly: true
},
list: {
type: Array,
notify: true
}
},
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key) {
this._setValue(this._metaData && this._metaData[key]);
},
_typeChanged: function (type) {
this._metaData = metaDatas[type];
this.list = metaArrays[type];
if (this.key) {
this._keyChanged(this.key);
}
},
byKey: function (key) {
return this._metaData && this._metaData[key];
}
});
}());
Polymer({
is: 'iron-icon',
properties: {
icon: { type: String },
theme: { type: String },
src: { type: String },
_meta: { value: Polymer.Base.create('iron-meta', { type: 'iconset' }) }
},
observers: [
'_updateIcon(_meta, isAttached)',
'_updateIcon(theme, isAttached)',
'_srcChanged(src, isAttached)',
'_iconChanged(icon, isAttached)'
],
_DEFAULT_ICONSET: 'icons',
_iconChanged: function (icon) {
var parts = (icon || '').split(':');
this._iconName = parts.pop();
this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
this._updateIcon();
},
_srcChanged: function (src) {
this._updateIcon();
},
_usesIconset: function () {
return this.icon || !this.src;
},
_updateIcon: function () {
if (this._usesIconset()) {
if (this._img && this._img.parentNode) {
Polymer.dom(this.root).removeChild(this._img);
}
if (this._iconName === '') {
if (this._iconset) {
this._iconset.removeIcon(this);
}
} else if (this._iconsetName && this._meta) {
this._iconset = this._meta.byKey(this._iconsetName);
if (this._iconset) {
this._iconset.applyIcon(this, this._iconName, this.theme);
this.unlisten(window, 'iron-iconset-added', '_updateIcon');
} else {
this.listen(window, 'iron-iconset-added', '_updateIcon');
}
}
} else {
if (this._iconset) {
this._iconset.removeIcon(this);
}
if (!this._img) {
this._img = document.createElement('img');
this._img.style.width = '100%';
this._img.style.height = '100%';
this._img.draggable = false;
}
this._img.src = this.src;
Polymer.dom(this.root).appendChild(this._img);
}
}
});
Polymer({
is: 'iron-iconset-svg',
properties: {
name: {
type: String,
observer: '_nameChanged'
},
size: {
type: Number,
value: 24
},
rtlMirroring: {
type: Boolean,
value: false
}
},
attached: function () {
this.style.display = 'none';
},
getIconNames: function () {
this._icons = this._createIconMap();
return Object.keys(this._icons).map(function (n) {
return this.name + ':' + n;
}, this);
},
applyIcon: function (element, iconName) {
element = element.root || element;
this.removeIcon(element);
var svg = this._cloneIcon(iconName, this.rtlMirroring && this._targetIsRTL(element));
if (svg) {
var pde = Polymer.dom(element);
pde.insertBefore(svg, pde.childNodes[0]);
return element._svgIcon = svg;
}
return null;
},
removeIcon: function (element) {
element = element.root || element;
if (element._svgIcon) {
Polymer.dom(element).removeChild(element._svgIcon);
element._svgIcon = null;
}
},
_targetIsRTL: function (target) {
if (this.__targetIsRTL == null) {
if (target && target.nodeType !== Node.ELEMENT_NODE) {
target = target.host;
}
this.__targetIsRTL = target && window.getComputedStyle(target)['direction'] === 'rtl';
}
return this.__targetIsRTL;
},
_nameChanged: function () {
new Polymer.IronMeta({
type: 'iconset',
key: this.name,
value: this
});
this.async(function () {
this.fire('iron-iconset-added', this, { node: window });
});
},
_createIconMap: function () {
var icons = Object.create(null);
Polymer.dom(this).querySelectorAll('[id]').forEach(function (icon) {
icons[icon.id] = icon;
});
return icons;
},
_cloneIcon: function (id, mirrorAllowed) {
this._icons = this._icons || this._createIconMap();
return this._prepareSvgClone(this._icons[id], this.size, mirrorAllowed);
},
_prepareSvgClone: function (sourceSvg, size, mirrorAllowed) {
if (sourceSvg) {
var content = sourceSvg.cloneNode(true), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), viewBox = content.getAttribute('viewBox') || '0 0 ' + size + ' ' + size, cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';
if (mirrorAllowed && content.hasAttribute('mirror-in-rtl')) {
cssText += '-webkit-transform:scale(-1,1);transform:scale(-1,1);';
}
svg.setAttribute('viewBox', viewBox);
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
svg.setAttribute('focusable', 'false');
svg.style.cssText = cssText;
svg.appendChild(content).removeAttribute('id');
return svg;
}
return null;
}
});
Polymer({
is: 'paper-badge',
hostAttributes: {
role: 'status',
tabindex: 0
},
behaviors: [Polymer.IronResizableBehavior],
listeners: { 'iron-resize': 'updatePosition' },
properties: {
for: {
type: String,
observer: '_forChanged'
},
label: {
type: String,
observer: '_labelChanged'
},
icon: {
type: String,
value: ''
}
},
attached: function () {
this._updateTarget();
},
attributeChanged: function (name) {
if (name === 'hidden') {
this.updatePosition();
}
},
_forChanged: function () {
if (!this.isAttached) {
return;
}
this._updateTarget();
},
_labelChanged: function () {
this.setAttribute('aria-label', this.label);
},
_updateTarget: function () {
this._target = this.target;
this.async(this.notifyResize, 1);
},
_computeIsIconBadge: function (icon) {
return icon.length > 0;
},
get target() {
var parentNode = Polymer.dom(this).parentNode;
var ownerRoot = Polymer.dom(this).getOwnerRoot();
var target;
if (this.for) {
target = Polymer.dom(ownerRoot).querySelector('#' + this.for);
} else {
target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ? ownerRoot.host : parentNode;
}
return target;
},
updatePosition: function () {
if (!this._target)
return;
if (!this.offsetParent)
return;
var parentRect = this.offsetParent.getBoundingClientRect();
var targetRect = this._target.getBoundingClientRect();
var thisRect = this.getBoundingClientRect();
this.style.left = targetRect.left - parentRect.left + (targetRect.width - thisRect.width / 2) + 'px';
this.style.top = targetRect.top - parentRect.top - thisRect.height / 2 + 'px';
}
});
Polymer({
is: 'chat-thread-list',
properties: {
user: Object,
threads: {
type: Array,
observer: '_threadsChanged'
},
_selectedIndex: { observer: '_selectedIndexChanged' },
selectedThread: { notify: true }
},
_threadsChanged: function () {
this._selectedIndex = 0;
},
_selectedIndexChanged: function (idx) {
this.$.selector.select(this.threads[idx]);
},
_computeUnreadCount: function (lastReadMessageInfo, threadsInfo) {
return threadsInfo.base.reduce(function (prev, thread) {
return prev + (lastReadMessageInfo.base[thread.id] == thread.messages.length ? 0 : 1);
}, 0);
},
_computeThreadRead: function (length, id, lastReadMessageInfo) {
return length == lastReadMessageInfo.base[id];
}
});
(function () {
var Utility = {
distance: function (x1, y1, x2, y2) {
var xDelta = x1 - x2;
var yDelta = y1 - y2;
return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
},
now: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : Date.now
};
function ElementMetrics(element) {
this.element = element;
this.width = this.boundingRect.width;
this.height = this.boundingRect.height;
this.size = Math.max(this.width, this.height);
}
ElementMetrics.prototype = {
get boundingRect() {
return this.element.getBoundingClientRect();
},
furthestCornerDistanceFrom: function (x, y) {
var topLeft = Utility.distance(x, y, 0, 0);
var topRight = Utility.distance(x, y, this.width, 0);
var bottomLeft = Utility.distance(x, y, 0, this.height);
var bottomRight = Utility.distance(x, y, this.width, this.height);
return Math.max(topLeft, topRight, bottomLeft, bottomRight);
}
};
function Ripple(element) {
this.element = element;
this.color = window.getComputedStyle(element).color;
this.wave = document.createElement('div');
this.waveContainer = document.createElement('div');
this.wave.style.backgroundColor = this.color;
this.wave.classList.add('wave');
this.waveContainer.classList.add('wave-container');
Polymer.dom(this.waveContainer).appendChild(this.wave);
this.resetInteractionState();
}
Ripple.MAX_RADIUS = 300;
Ripple.prototype = {
get recenters() {
return this.element.recenters;
},
get center() {
return this.element.center;
},
get mouseDownElapsed() {
var elapsed;
if (!this.mouseDownStart) {
return 0;
}
elapsed = Utility.now() - this.mouseDownStart;
if (this.mouseUpStart) {
elapsed -= this.mouseUpElapsed;
}
return elapsed;
},
get mouseUpElapsed() {
return this.mouseUpStart ? Utility.now() - this.mouseUpStart : 0;
},
get mouseDownElapsedSeconds() {
return this.mouseDownElapsed / 1000;
},
get mouseUpElapsedSeconds() {
return this.mouseUpElapsed / 1000;
},
get mouseInteractionSeconds() {
return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
},
get initialOpacity() {
return this.element.initialOpacity;
},
get opacityDecayVelocity() {
return this.element.opacityDecayVelocity;
},
get radius() {
var width2 = this.containerMetrics.width * this.containerMetrics.width;
var height2 = this.containerMetrics.height * this.containerMetrics.height;
var waveRadius = Math.min(Math.sqrt(width2 + height2), Ripple.MAX_RADIUS) * 1.1 + 5;
var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
var timeNow = this.mouseInteractionSeconds / duration;
var size = waveRadius * (1 - Math.pow(80, -timeNow));
return Math.abs(size);
},
get opacity() {
if (!this.mouseUpStart) {
return this.initialOpacity;
}
return Math.max(0, this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity);
},
get outerOpacity() {
var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
var waveOpacity = this.opacity;
return Math.max(0, Math.min(outerOpacity, waveOpacity));
},
get isOpacityFullyDecayed() {
return this.opacity < 0.01 && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isRestingAtMaxRadius() {
return this.opacity >= this.initialOpacity && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isAnimationComplete() {
return this.mouseUpStart ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
},
get translationFraction() {
return Math.min(1, this.radius / this.containerMetrics.size * 2 / Math.sqrt(2));
},
get xNow() {
if (this.xEnd) {
return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
}
return this.xStart;
},
get yNow() {
if (this.yEnd) {
return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
}
return this.yStart;
},
get isMouseDown() {
return this.mouseDownStart && !this.mouseUpStart;
},
resetInteractionState: function () {
this.maxRadius = 0;
this.mouseDownStart = 0;
this.mouseUpStart = 0;
this.xStart = 0;
this.yStart = 0;
this.xEnd = 0;
this.yEnd = 0;
this.slideDistance = 0;
this.containerMetrics = new ElementMetrics(this.element);
},
draw: function () {
var scale;
var translateString;
var dx;
var dy;
this.wave.style.opacity = this.opacity;
scale = this.radius / (this.containerMetrics.size / 2);
dx = this.xNow - this.containerMetrics.width / 2;
dy = this.yNow - this.containerMetrics.height / 2;
this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
},
downAction: function (event) {
var xCenter = this.containerMetrics.width / 2;
var yCenter = this.containerMetrics.height / 2;
this.resetInteractionState();
this.mouseDownStart = Utility.now();
if (this.center) {
this.xStart = xCenter;
this.yStart = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
} else {
this.xStart = event ? event.detail.x - this.containerMetrics.boundingRect.left : this.containerMetrics.width / 2;
this.yStart = event ? event.detail.y - this.containerMetrics.boundingRect.top : this.containerMetrics.height / 2;
}
if (this.recenters) {
this.xEnd = xCenter;
this.yEnd = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
}
this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(this.xStart, this.yStart);
this.waveContainer.style.top = (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.left = (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.width = this.containerMetrics.size + 'px';
this.waveContainer.style.height = this.containerMetrics.size + 'px';
},
upAction: function (event) {
if (!this.isMouseDown) {
return;
}
this.mouseUpStart = Utility.now();
},
remove: function () {
Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer);
}
};
Polymer({
is: 'paper-ripple',
behaviors: [Polymer.IronA11yKeysBehavior],
properties: {
initialOpacity: {
type: Number,
value: 0.25
},
opacityDecayVelocity: {
type: Number,
value: 0.8
},
recenters: {
type: Boolean,
value: false
},
center: {
type: Boolean,
value: false
},
ripples: {
type: Array,
value: function () {
return [];
}
},
animating: {
type: Boolean,
readOnly: true,
reflectToAttribute: true,
value: false
},
holdDown: {
type: Boolean,
value: false,
observer: '_holdDownChanged'
},
noink: {
type: Boolean,
value: false
},
_animating: { type: Boolean },
_boundAnimate: {
type: Function,
value: function () {
return this.animate.bind(this);
}
}
},
get target() {
return this.keyEventTarget;
},
keyBindings: {
'enter:keydown': '_onEnterKeydown',
'space:keydown': '_onSpaceKeydown',
'space:keyup': '_onSpaceKeyup'
},
attached: function () {
if (this.parentNode.nodeType == 11) {
this.keyEventTarget = Polymer.dom(this).getOwnerRoot().host;
} else {
this.keyEventTarget = this.parentNode;
}
var keyEventTarget = this.keyEventTarget;
this.listen(keyEventTarget, 'up', 'uiUpAction');
this.listen(keyEventTarget, 'down', 'uiDownAction');
},
detached: function () {
this.unlisten(this.keyEventTarget, 'up', 'uiUpAction');
this.unlisten(this.keyEventTarget, 'down', 'uiDownAction');
this.keyEventTarget = null;
},
get shouldKeepAnimating() {
for (var index = 0; index < this.ripples.length; ++index) {
if (!this.ripples[index].isAnimationComplete) {
return true;
}
}
return false;
},
simulatedRipple: function () {
this.downAction(null);
this.async(function () {
this.upAction();
}, 1);
},
uiDownAction: function (event) {
if (!this.noink) {
this.downAction(event);
}
},
downAction: function (event) {
if (this.holdDown && this.ripples.length > 0) {
return;
}
var ripple = this.addRipple();
ripple.downAction(event);
if (!this._animating) {
this._animating = true;
this.animate();
}
},
uiUpAction: function (event) {
if (!this.noink) {
this.upAction(event);
}
},
upAction: function (event) {
if (this.holdDown) {
return;
}
this.ripples.forEach(function (ripple) {
ripple.upAction(event);
});
this._animating = true;
this.animate();
},
onAnimationComplete: function () {
this._animating = false;
this.$.background.style.backgroundColor = null;
this.fire('transitionend');
},
addRipple: function () {
var ripple = new Ripple(this);
Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);
this.$.background.style.backgroundColor = ripple.color;
this.ripples.push(ripple);
this._setAnimating(true);
return ripple;
},
removeRipple: function (ripple) {
var rippleIndex = this.ripples.indexOf(ripple);
if (rippleIndex < 0) {
return;
}
this.ripples.splice(rippleIndex, 1);
ripple.remove();
if (!this.ripples.length) {
this._setAnimating(false);
}
},
animate: function () {
if (!this._animating) {
return;
}
var index;
var ripple;
for (index = 0; index < this.ripples.length; ++index) {
ripple = this.ripples[index];
ripple.draw();
this.$.background.style.opacity = ripple.outerOpacity;
if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
this.removeRipple(ripple);
}
}
if (!this.shouldKeepAnimating && this.ripples.length === 0) {
this.onAnimationComplete();
} else {
window.requestAnimationFrame(this._boundAnimate);
}
},
_onEnterKeydown: function () {
this.uiDownAction();
this.async(this.uiUpAction, 1);
},
_onSpaceKeydown: function () {
this.uiDownAction();
},
_onSpaceKeyup: function () {
this.uiUpAction();
},
_holdDownChanged: function (newVal, oldVal) {
if (oldVal === undefined) {
return;
}
if (newVal) {
this.downAction();
} else {
this.upAction();
}
}
});
}());
Polymer.PaperRippleBehavior = {
properties: {
noink: {
type: Boolean,
observer: '_noinkChanged'
},
_rippleContainer: { type: Object }
},
_buttonStateChanged: function () {
if (this.focused) {
this.ensureRipple();
}
},
_downHandler: function (event) {
Polymer.IronButtonStateImpl._downHandler.call(this, event);
if (this.pressed) {
this.ensureRipple(event);
}
},
ensureRipple: function (optTriggeringEvent) {
if (!this.hasRipple()) {
this._ripple = this._createRipple();
this._ripple.noink = this.noink;
var rippleContainer = this._rippleContainer || this.root;
if (rippleContainer) {
Polymer.dom(rippleContainer).appendChild(this._ripple);
}
if (optTriggeringEvent) {
var domContainer = Polymer.dom(this._rippleContainer || this);
var target = Polymer.dom(optTriggeringEvent).rootTarget;
if (domContainer.deepContains(target)) {
this._ripple.uiDownAction(optTriggeringEvent);
}
}
}
},
getRipple: function () {
this.ensureRipple();
return this._ripple;
},
hasRipple: function () {
return Boolean(this._ripple);
},
_createRipple: function () {
return document.createElement('paper-ripple');
},
_noinkChanged: function (noink) {
if (this.hasRipple()) {
this._ripple.noink = noink;
}
}
};
Polymer.PaperInkyFocusBehaviorImpl = {
observers: ['_focusedChanged(receivedFocusFromKeyboard)'],
_focusedChanged: function (receivedFocusFromKeyboard) {
if (receivedFocusFromKeyboard) {
this.ensureRipple();
}
if (this.hasRipple()) {
this._ripple.holdDown = receivedFocusFromKeyboard;
}
},
_createRipple: function () {
var ripple = Polymer.PaperRippleBehavior._createRipple();
ripple.id = 'ink';
ripple.setAttribute('center', '');
ripple.classList.add('circle');
return ripple;
}
};
Polymer.PaperInkyFocusBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperRippleBehavior,
Polymer.PaperInkyFocusBehaviorImpl
];
Polymer({
is: 'paper-icon-button',
hostAttributes: {
role: 'button',
tabindex: '0'
},
behaviors: [Polymer.PaperInkyFocusBehavior],
properties: {
src: { type: String },
icon: { type: String },
alt: {
type: String,
observer: '_altChanged'
}
},
_altChanged: function (newValue, oldValue) {
var label = this.getAttribute('aria-label');
if (!label || oldValue == label) {
this.setAttribute('aria-label', newValue);
}
}
});
Polymer.IronFitBehavior = {
properties: {
sizingTarget: {
type: Object,
value: function () {
return this;
}
},
fitInto: {
type: Object,
value: window
},
noOverlap: { type: Boolean },
positionTarget: { type: Element },
horizontalAlign: { type: String },
verticalAlign: { type: String },
dynamicAlign: { type: Boolean },
horizontalOffset: {
type: Number,
value: 0,
notify: true
},
verticalOffset: {
type: Number,
value: 0,
notify: true
},
autoFitOnAttach: {
type: Boolean,
value: false
},
_fitInfo: { type: Object }
},
get _fitWidth() {
var fitWidth;
if (this.fitInto === window) {
fitWidth = this.fitInto.innerWidth;
} else {
fitWidth = this.fitInto.getBoundingClientRect().width;
}
return fitWidth;
},
get _fitHeight() {
var fitHeight;
if (this.fitInto === window) {
fitHeight = this.fitInto.innerHeight;
} else {
fitHeight = this.fitInto.getBoundingClientRect().height;
}
return fitHeight;
},
get _fitLeft() {
var fitLeft;
if (this.fitInto === window) {
fitLeft = 0;
} else {
fitLeft = this.fitInto.getBoundingClientRect().left;
}
return fitLeft;
},
get _fitTop() {
var fitTop;
if (this.fitInto === window) {
fitTop = 0;
} else {
fitTop = this.fitInto.getBoundingClientRect().top;
}
return fitTop;
},
get _defaultPositionTarget() {
var parent = Polymer.dom(this).parentNode;
if (parent && parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
parent = parent.host;
}
return parent;
},
get _localeHorizontalAlign() {
if (this._isRTL) {
if (this.horizontalAlign === 'right') {
return 'left';
}
if (this.horizontalAlign === 'left') {
return 'right';
}
}
return this.horizontalAlign;
},
attached: function () {
if (typeof this._isRTL === 'undefined') {
this._isRTL = window.getComputedStyle(this).direction == 'rtl';
}
this.positionTarget = this.positionTarget || this._defaultPositionTarget;
if (this.autoFitOnAttach) {
if (window.getComputedStyle(this).display === 'none') {
setTimeout(function () {
this.fit();
}.bind(this));
} else {
this.fit();
}
}
},
fit: function () {
this.position();
this.constrain();
this.center();
},
_discoverInfo: function () {
if (this._fitInfo) {
return;
}
var target = window.getComputedStyle(this);
var sizer = window.getComputedStyle(this.sizingTarget);
this._fitInfo = {
inlineStyle: {
top: this.style.top || '',
left: this.style.left || '',
position: this.style.position || ''
},
sizerInlineStyle: {
maxWidth: this.sizingTarget.style.maxWidth || '',
maxHeight: this.sizingTarget.style.maxHeight || '',
boxSizing: this.sizingTarget.style.boxSizing || ''
},
positionedBy: {
vertically: target.top !== 'auto' ? 'top' : target.bottom !== 'auto' ? 'bottom' : null,
horizontally: target.left !== 'auto' ? 'left' : target.right !== 'auto' ? 'right' : null
},
sizedBy: {
height: sizer.maxHeight !== 'none',
width: sizer.maxWidth !== 'none',
minWidth: parseInt(sizer.minWidth, 10) || 0,
minHeight: parseInt(sizer.minHeight, 10) || 0
},
margin: {
top: parseInt(target.marginTop, 10) || 0,
right: parseInt(target.marginRight, 10) || 0,
bottom: parseInt(target.marginBottom, 10) || 0,
left: parseInt(target.marginLeft, 10) || 0
}
};
},
resetFit: function () {
var info = this._fitInfo || {};
for (var property in info.sizerInlineStyle) {
this.sizingTarget.style[property] = info.sizerInlineStyle[property];
}
for (var property in info.inlineStyle) {
this.style[property] = info.inlineStyle[property];
}
this._fitInfo = null;
},
refit: function () {
var scrollLeft = this.sizingTarget.scrollLeft;
var scrollTop = this.sizingTarget.scrollTop;
this.resetFit();
this.fit();
this.sizingTarget.scrollLeft = scrollLeft;
this.sizingTarget.scrollTop = scrollTop;
},
position: function () {
if (!this.horizontalAlign && !this.verticalAlign) {
return;
}
this._discoverInfo();
this.style.position = 'fixed';
this.sizingTarget.style.boxSizing = 'border-box';
this.style.left = '0px';
this.style.top = '0px';
var rect = this.getBoundingClientRect();
var positionRect = this.__getNormalizedRect(this.positionTarget);
var fitRect = this.__getNormalizedRect(this.fitInto);
var margin = this._fitInfo.margin;
var size = {
width: rect.width + margin.left + margin.right,
height: rect.height + margin.top + margin.bottom
};
var position = this.__getPosition(this._localeHorizontalAlign, this.verticalAlign, size, positionRect, fitRect);
var left = position.left + margin.left;
var top = position.top + margin.top;
var right = Math.min(fitRect.right - margin.right, left + rect.width);
var bottom = Math.min(fitRect.bottom - margin.bottom, top + rect.height);
left = Math.max(fitRect.left + margin.left, Math.min(left, right - this._fitInfo.sizedBy.minWidth));
top = Math.max(fitRect.top + margin.top, Math.min(top, bottom - this._fitInfo.sizedBy.minHeight));
this.sizingTarget.style.maxWidth = Math.max(right - left, this._fitInfo.sizedBy.minWidth) + 'px';
this.sizingTarget.style.maxHeight = Math.max(bottom - top, this._fitInfo.sizedBy.minHeight) + 'px';
this.style.left = left - rect.left + 'px';
this.style.top = top - rect.top + 'px';
},
constrain: function () {
if (this.horizontalAlign || this.verticalAlign) {
return;
}
this._discoverInfo();
var info = this._fitInfo;
if (!info.positionedBy.vertically) {
this.style.position = 'fixed';
this.style.top = '0px';
}
if (!info.positionedBy.horizontally) {
this.style.position = 'fixed';
this.style.left = '0px';
}
this.sizingTarget.style.boxSizing = 'border-box';
var rect = this.getBoundingClientRect();
if (!info.sizedBy.height) {
this.__sizeDimension(rect, info.positionedBy.vertically, 'top', 'bottom', 'Height');
}
if (!info.sizedBy.width) {
this.__sizeDimension(rect, info.positionedBy.horizontally, 'left', 'right', 'Width');
}
},
_sizeDimension: function (rect, positionedBy, start, end, extent) {
this.__sizeDimension(rect, positionedBy, start, end, extent);
},
__sizeDimension: function (rect, positionedBy, start, end, extent) {
var info = this._fitInfo;
var fitRect = this.__getNormalizedRect(this.fitInto);
var max = extent === 'Width' ? fitRect.width : fitRect.height;
var flip = positionedBy === end;
var offset = flip ? max - rect[end] : rect[start];
var margin = info.margin[flip ? start : end];
var offsetExtent = 'offset' + extent;
var sizingOffset = this[offsetExtent] - this.sizingTarget[offsetExtent];
this.sizingTarget.style['max' + extent] = max - margin - offset - sizingOffset + 'px';
},
center: function () {
if (this.horizontalAlign || this.verticalAlign) {
return;
}
this._discoverInfo();
var positionedBy = this._fitInfo.positionedBy;
if (positionedBy.vertically && positionedBy.horizontally) {
return;
}
this.style.position = 'fixed';
if (!positionedBy.vertically) {
this.style.top = '0px';
}
if (!positionedBy.horizontally) {
this.style.left = '0px';
}
var rect = this.getBoundingClientRect();
var fitRect = this.__getNormalizedRect(this.fitInto);
if (!positionedBy.vertically) {
var top = fitRect.top - rect.top + (fitRect.height - rect.height) / 2;
this.style.top = top + 'px';
}
if (!positionedBy.horizontally) {
var left = fitRect.left - rect.left + (fitRect.width - rect.width) / 2;
this.style.left = left + 'px';
}
},
__getNormalizedRect: function (target) {
if (target === document.documentElement || target === window) {
return {
top: 0,
left: 0,
width: window.innerWidth,
height: window.innerHeight,
right: window.innerWidth,
bottom: window.innerHeight
};
}
return target.getBoundingClientRect();
},
__getCroppedArea: function (position, size, fitRect) {
var verticalCrop = Math.min(0, position.top) + Math.min(0, fitRect.bottom - (position.top + size.height));
var horizontalCrop = Math.min(0, position.left) + Math.min(0, fitRect.right - (position.left + size.width));
return Math.abs(verticalCrop) * size.width + Math.abs(horizontalCrop) * size.height;
},
__getPosition: function (hAlign, vAlign, size, positionRect, fitRect) {
var positions = [
{
verticalAlign: 'top',
horizontalAlign: 'left',
top: positionRect.top + this.verticalOffset,
left: positionRect.left + this.horizontalOffset
},
{
verticalAlign: 'top',
horizontalAlign: 'right',
top: positionRect.top + this.verticalOffset,
left: positionRect.right - size.width - this.horizontalOffset
},
{
verticalAlign: 'bottom',
horizontalAlign: 'left',
top: positionRect.bottom - size.height - this.verticalOffset,
left: positionRect.left + this.horizontalOffset
},
{
verticalAlign: 'bottom',
horizontalAlign: 'right',
top: positionRect.bottom - size.height - this.verticalOffset,
left: positionRect.right - size.width - this.horizontalOffset
}
];
if (this.noOverlap) {
for (var i = 0, l = positions.length; i < l; i++) {
var copy = {};
for (var key in positions[i]) {
copy[key] = positions[i][key];
}
positions.push(copy);
}
positions[0].top = positions[1].top += positionRect.height;
positions[2].top = positions[3].top -= positionRect.height;
positions[4].left = positions[6].left += positionRect.width;
positions[5].left = positions[7].left -= positionRect.width;
}
vAlign = vAlign === 'auto' ? null : vAlign;
hAlign = hAlign === 'auto' ? null : hAlign;
var position;
for (var i = 0; i < positions.length; i++) {
var pos = positions[i];
if (!this.dynamicAlign && !this.noOverlap && pos.verticalAlign === vAlign && pos.horizontalAlign === hAlign) {
position = pos;
break;
}
var alignOk = (!vAlign || pos.verticalAlign === vAlign) && (!hAlign || pos.horizontalAlign === hAlign);
if (!this.dynamicAlign && !alignOk) {
continue;
}
position = position || pos;
pos.croppedArea = this.__getCroppedArea(pos, size, fitRect);
var diff = pos.croppedArea - position.croppedArea;
if (diff < 0 || diff === 0 && alignOk) {
position = pos;
}
if (position.croppedArea === 0 && alignOk) {
break;
}
}
return position;
}
};
(function () {
'use strict';
Polymer({
is: 'iron-overlay-backdrop',
properties: {
opened: {
reflectToAttribute: true,
type: Boolean,
value: false,
observer: '_openedChanged'
}
},
listeners: { 'transitionend': '_onTransitionend' },
created: function () {
this.__openedRaf = null;
},
attached: function () {
this.opened && this._openedChanged(this.opened);
},
prepare: function () {
if (this.opened && !this.parentNode) {
Polymer.dom(document.body).appendChild(this);
}
},
open: function () {
this.opened = true;
},
close: function () {
this.opened = false;
},
complete: function () {
if (!this.opened && this.parentNode === document.body) {
Polymer.dom(this.parentNode).removeChild(this);
}
},
_onTransitionend: function (event) {
if (event && event.target === this) {
this.complete();
}
},
_openedChanged: function (opened) {
if (opened) {
this.prepare();
} else {
var cs = window.getComputedStyle(this);
if (cs.transitionDuration === '0s' || cs.opacity == 0) {
this.complete();
}
}
if (!this.isAttached) {
return;
}
if (this.__openedRaf) {
window.cancelAnimationFrame(this.__openedRaf);
this.__openedRaf = null;
}
this.scrollTop = this.scrollTop;
this.__openedRaf = window.requestAnimationFrame(function () {
this.__openedRaf = null;
this.toggleClass('opened', this.opened);
}.bind(this));
}
});
}());
Polymer.IronOverlayManagerClass = function () {
this._overlays = [];
this._minimumZ = 101;
this._backdropElement = null;
Polymer.Gestures.add(document.documentElement, 'tap', null);
document.addEventListener('tap', this._onCaptureClick.bind(this), true);
document.addEventListener('focus', this._onCaptureFocus.bind(this), true);
document.addEventListener('keydown', this._onCaptureKeyDown.bind(this), true);
};
Polymer.IronOverlayManagerClass.prototype = {
constructor: Polymer.IronOverlayManagerClass,
get backdropElement() {
if (!this._backdropElement) {
this._backdropElement = document.createElement('iron-overlay-backdrop');
}
return this._backdropElement;
},
get deepActiveElement() {
var active = document.activeElement || document.body;
while (active.root && Polymer.dom(active.root).activeElement) {
active = Polymer.dom(active.root).activeElement;
}
return active;
},
_bringOverlayAtIndexToFront: function (i) {
var overlay = this._overlays[i];
if (!overlay) {
return;
}
var lastI = this._overlays.length - 1;
var currentOverlay = this._overlays[lastI];
if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
lastI--;
}
if (i >= lastI) {
return;
}
var minimumZ = Math.max(this.currentOverlayZ(), this._minimumZ);
if (this._getZ(overlay) <= minimumZ) {
this._applyOverlayZ(overlay, minimumZ);
}
while (i < lastI) {
this._overlays[i] = this._overlays[i + 1];
i++;
}
this._overlays[lastI] = overlay;
},
addOrRemoveOverlay: function (overlay) {
if (overlay.opened) {
this.addOverlay(overlay);
} else {
this.removeOverlay(overlay);
}
},
addOverlay: function (overlay) {
var i = this._overlays.indexOf(overlay);
if (i >= 0) {
this._bringOverlayAtIndexToFront(i);
this.trackBackdrop();
return;
}
var insertionIndex = this._overlays.length;
var currentOverlay = this._overlays[insertionIndex - 1];
var minimumZ = Math.max(this._getZ(currentOverlay), this._minimumZ);
var newZ = this._getZ(overlay);
if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
this._applyOverlayZ(currentOverlay, minimumZ);
insertionIndex--;
var previousOverlay = this._overlays[insertionIndex - 1];
minimumZ = Math.max(this._getZ(previousOverlay), this._minimumZ);
}
if (newZ <= minimumZ) {
this._applyOverlayZ(overlay, minimumZ);
}
this._overlays.splice(insertionIndex, 0, overlay);
this.trackBackdrop();
},
removeOverlay: function (overlay) {
var i = this._overlays.indexOf(overlay);
if (i === -1) {
return;
}
this._overlays.splice(i, 1);
this.trackBackdrop();
},
currentOverlay: function () {
var i = this._overlays.length - 1;
return this._overlays[i];
},
currentOverlayZ: function () {
return this._getZ(this.currentOverlay());
},
ensureMinimumZ: function (minimumZ) {
this._minimumZ = Math.max(this._minimumZ, minimumZ);
},
focusOverlay: function () {
var current = this.currentOverlay();
if (current) {
current._applyFocus();
}
},
trackBackdrop: function () {
var overlay = this._overlayWithBackdrop();
if (!overlay && !this._backdropElement) {
return;
}
this.backdropElement.style.zIndex = this._getZ(overlay) - 1;
this.backdropElement.opened = !!overlay;
},
getBackdrops: function () {
var backdrops = [];
for (var i = 0; i < this._overlays.length; i++) {
if (this._overlays[i].withBackdrop) {
backdrops.push(this._overlays[i]);
}
}
return backdrops;
},
backdropZ: function () {
return this._getZ(this._overlayWithBackdrop()) - 1;
},
_overlayWithBackdrop: function () {
for (var i = 0; i < this._overlays.length; i++) {
if (this._overlays[i].withBackdrop) {
return this._overlays[i];
}
}
},
_getZ: function (overlay) {
var z = this._minimumZ;
if (overlay) {
var z1 = Number(overlay.style.zIndex || window.getComputedStyle(overlay).zIndex);
if (z1 === z1) {
z = z1;
}
}
return z;
},
_setZ: function (element, z) {
element.style.zIndex = z;
},
_applyOverlayZ: function (overlay, aboveZ) {
this._setZ(overlay, aboveZ + 2);
},
_overlayInPath: function (path) {
path = path || [];
for (var i = 0; i < path.length; i++) {
if (path[i]._manager === this) {
return path[i];
}
}
},
_onCaptureClick: function (event) {
var overlay = this.currentOverlay();
if (overlay && this._overlayInPath(Polymer.dom(event).path) !== overlay) {
overlay._onCaptureClick(event);
}
},
_onCaptureFocus: function (event) {
var overlay = this.currentOverlay();
if (overlay) {
overlay._onCaptureFocus(event);
}
},
_onCaptureKeyDown: function (event) {
var overlay = this.currentOverlay();
if (overlay) {
if (Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'esc')) {
overlay._onCaptureEsc(event);
} else if (Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'tab')) {
overlay._onCaptureTab(event);
}
}
},
_shouldBeBehindOverlay: function (overlay1, overlay2) {
return !overlay1.alwaysOnTop && overlay2.alwaysOnTop;
}
};
Polymer.IronOverlayManager = new Polymer.IronOverlayManagerClass();
(function () {
'use strict';
var p = Element.prototype;
var matches = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
Polymer.IronFocusablesHelper = {
getTabbableNodes: function (node) {
var result = [];
var needsSortByTabIndex = this._collectTabbableNodes(node, result);
if (needsSortByTabIndex) {
return this._sortByTabIndex(result);
}
return result;
},
isFocusable: function (element) {
if (matches.call(element, 'input, select, textarea, button, object')) {
return matches.call(element, ':not([disabled])');
}
return matches.call(element, 'a[href], area[href], iframe, [tabindex], [contentEditable]');
},
isTabbable: function (element) {
return this.isFocusable(element) && matches.call(element, ':not([tabindex="-1"])') && this._isVisible(element);
},
_normalizedTabIndex: function (element) {
if (this.isFocusable(element)) {
var tabIndex = element.getAttribute('tabindex') || 0;
return Number(tabIndex);
}
return -1;
},
_collectTabbableNodes: function (node, result) {
if (node.nodeType !== Node.ELEMENT_NODE || !this._isVisible(node)) {
return false;
}
var element = node;
var tabIndex = this._normalizedTabIndex(element);
var needsSortByTabIndex = tabIndex > 0;
if (tabIndex >= 0) {
result.push(element);
}
var children;
if (element.localName === 'content') {
children = Polymer.dom(element).getDistributedNodes();
} else {
children = Polymer.dom(element.root || element).children;
}
for (var i = 0; i < children.length; i++) {
var needsSort = this._collectTabbableNodes(children[i], result);
needsSortByTabIndex = needsSortByTabIndex || needsSort;
}
return needsSortByTabIndex;
},
_isVisible: function (element) {
var style = element.style;
if (style.visibility !== 'hidden' && style.display !== 'none') {
style = window.getComputedStyle(element);
return style.visibility !== 'hidden' && style.display !== 'none';
}
return false;
},
_sortByTabIndex: function (tabbables) {
var len = tabbables.length;
if (len < 2) {
return tabbables;
}
var pivot = Math.ceil(len / 2);
var left = this._sortByTabIndex(tabbables.slice(0, pivot));
var right = this._sortByTabIndex(tabbables.slice(pivot));
return this._mergeSortByTabIndex(left, right);
},
_mergeSortByTabIndex: function (left, right) {
var result = [];
while (left.length > 0 && right.length > 0) {
if (this._hasLowerTabOrder(left[0], right[0])) {
result.push(right.shift());
} else {
result.push(left.shift());
}
}
return result.concat(left, right);
},
_hasLowerTabOrder: function (a, b) {
var ati = Math.max(a.tabIndex, 0);
var bti = Math.max(b.tabIndex, 0);
return ati === 0 || bti === 0 ? bti > ati : ati > bti;
}
};
}());
(function () {
'use strict';
Polymer.IronOverlayBehaviorImpl = {
properties: {
opened: {
observer: '_openedChanged',
type: Boolean,
value: false,
notify: true
},
canceled: {
observer: '_canceledChanged',
readOnly: true,
type: Boolean,
value: false
},
withBackdrop: {
observer: '_withBackdropChanged',
type: Boolean
},
noAutoFocus: {
type: Boolean,
value: false
},
noCancelOnEscKey: {
type: Boolean,
value: false
},
noCancelOnOutsideClick: {
type: Boolean,
value: false
},
closingReason: { type: Object },
restoreFocusOnClose: {
type: Boolean,
value: false
},
alwaysOnTop: { type: Boolean },
_manager: {
type: Object,
value: Polymer.IronOverlayManager
},
_focusedChild: { type: Object }
},
listeners: { 'iron-resize': '_onIronResize' },
get backdropElement() {
return this._manager.backdropElement;
},
get _focusNode() {
return this._focusedChild || Polymer.dom(this).querySelector('[autofocus]') || this;
},
get _focusableNodes() {
return Polymer.IronFocusablesHelper.getTabbableNodes(this);
},
ready: function () {
this.__isAnimating = false;
this.__shouldRemoveTabIndex = false;
this.__firstFocusableNode = this.__lastFocusableNode = null;
this.__raf = null;
this.__restoreFocusNode = null;
this._ensureSetup();
},
attached: function () {
if (this.opened) {
this._openedChanged(this.opened);
}
this._observer = Polymer.dom(this).observeNodes(this._onNodesChange);
},
detached: function () {
Polymer.dom(this).unobserveNodes(this._observer);
this._observer = null;
if (this.__raf) {
window.cancelAnimationFrame(this.__raf);
this.__raf = null;
}
this._manager.removeOverlay(this);
},
toggle: function () {
this._setCanceled(false);
this.opened = !this.opened;
},
open: function () {
this._setCanceled(false);
this.opened = true;
},
close: function () {
this._setCanceled(false);
this.opened = false;
},
cancel: function (event) {
var cancelEvent = this.fire('iron-overlay-canceled', event, { cancelable: true });
if (cancelEvent.defaultPrevented) {
return;
}
this._setCanceled(true);
this.opened = false;
},
invalidateTabbables: function () {
this.__firstFocusableNode = this.__lastFocusableNode = null;
},
_ensureSetup: function () {
if (this._overlaySetup) {
return;
}
this._overlaySetup = true;
this.style.outline = 'none';
this.style.display = 'none';
},
_openedChanged: function (opened) {
if (opened) {
this.removeAttribute('aria-hidden');
} else {
this.setAttribute('aria-hidden', 'true');
}
if (!this.isAttached) {
return;
}
this.__isAnimating = true;
this.__onNextAnimationFrame(this.__openedChanged);
},
_canceledChanged: function () {
this.closingReason = this.closingReason || {};
this.closingReason.canceled = this.canceled;
},
_withBackdropChanged: function () {
if (this.withBackdrop && !this.hasAttribute('tabindex')) {
this.setAttribute('tabindex', '-1');
this.__shouldRemoveTabIndex = true;
} else if (this.__shouldRemoveTabIndex) {
this.removeAttribute('tabindex');
this.__shouldRemoveTabIndex = false;
}
if (this.opened && this.isAttached) {
this._manager.trackBackdrop();
}
},
_prepareRenderOpened: function () {
this.__restoreFocusNode = this._manager.deepActiveElement;
this._preparePositioning();
this.refit();
this._finishPositioning();
if (this.noAutoFocus && document.activeElement === this._focusNode) {
this._focusNode.blur();
this.__restoreFocusNode.focus();
}
},
_renderOpened: function () {
this._finishRenderOpened();
},
_renderClosed: function () {
this._finishRenderClosed();
},
_finishRenderOpened: function () {
this.notifyResize();
this.__isAnimating = false;
this.fire('iron-overlay-opened');
},
_finishRenderClosed: function () {
this.style.display = 'none';
this.style.zIndex = '';
this.notifyResize();
this.__isAnimating = false;
this.fire('iron-overlay-closed', this.closingReason);
},
_preparePositioning: function () {
this.style.transition = this.style.webkitTransition = 'none';
this.style.transform = this.style.webkitTransform = 'none';
this.style.display = '';
},
_finishPositioning: function () {
this.style.display = 'none';
this.scrollTop = this.scrollTop;
this.style.transition = this.style.webkitTransition = '';
this.style.transform = this.style.webkitTransform = '';
this.style.display = '';
this.scrollTop = this.scrollTop;
},
_applyFocus: function () {
if (this.opened) {
if (!this.noAutoFocus) {
this._focusNode.focus();
}
} else {
this._focusNode.blur();
this._focusedChild = null;
if (this.restoreFocusOnClose && this.__restoreFocusNode) {
this.__restoreFocusNode.focus();
}
this.__restoreFocusNode = null;
var currentOverlay = this._manager.currentOverlay();
if (currentOverlay && this !== currentOverlay) {
currentOverlay._applyFocus();
}
}
},
_onCaptureClick: function (event) {
if (!this.noCancelOnOutsideClick) {
this.cancel(event);
}
},
_onCaptureFocus: function (event) {
if (!this.withBackdrop) {
return;
}
var path = Polymer.dom(event).path;
if (path.indexOf(this) === -1) {
event.stopPropagation();
this._applyFocus();
} else {
this._focusedChild = path[0];
}
},
_onCaptureEsc: function (event) {
if (!this.noCancelOnEscKey) {
this.cancel(event);
}
},
_onCaptureTab: function (event) {
if (!this.withBackdrop) {
return;
}
this.__ensureFirstLastFocusables();
var shift = event.shiftKey;
var nodeToCheck = shift ? this.__firstFocusableNode : this.__lastFocusableNode;
var nodeToSet = shift ? this.__lastFocusableNode : this.__firstFocusableNode;
var shouldWrap = false;
if (nodeToCheck === nodeToSet) {
shouldWrap = true;
} else {
var focusedNode = this._manager.deepActiveElement;
shouldWrap = focusedNode === nodeToCheck || focusedNode === this;
}
if (shouldWrap) {
event.preventDefault();
this._focusedChild = nodeToSet;
this._applyFocus();
}
},
_onIronResize: function () {
if (this.opened && !this.__isAnimating) {
this.__onNextAnimationFrame(this.refit);
}
},
_onNodesChange: function () {
if (this.opened && !this.__isAnimating) {
this.invalidateTabbables();
this.notifyResize();
}
},
__ensureFirstLastFocusables: function () {
if (!this.__firstFocusableNode || !this.__lastFocusableNode) {
var focusableNodes = this._focusableNodes;
this.__firstFocusableNode = focusableNodes[0];
this.__lastFocusableNode = focusableNodes[focusableNodes.length - 1];
}
},
__openedChanged: function () {
if (this.opened) {
this._prepareRenderOpened();
this._manager.addOverlay(this);
this._applyFocus();
this._renderOpened();
} else {
this._manager.removeOverlay(this);
this._applyFocus();
this._renderClosed();
}
},
__onNextAnimationFrame: function (callback) {
if (this.__raf) {
window.cancelAnimationFrame(this.__raf);
}
var self = this;
this.__raf = window.requestAnimationFrame(function nextAnimationFrame() {
self.__raf = null;
callback.call(self);
});
}
};
Polymer.IronOverlayBehavior = [
Polymer.IronFitBehavior,
Polymer.IronResizableBehavior,
Polymer.IronOverlayBehaviorImpl
];
}());
Polymer.NeonAnimatableBehavior = {
properties: {
animationConfig: { type: Object },
entryAnimation: {
observer: '_entryAnimationChanged',
type: String
},
exitAnimation: {
observer: '_exitAnimationChanged',
type: String
}
},
_entryAnimationChanged: function () {
this.animationConfig = this.animationConfig || {};
this.animationConfig['entry'] = [{
name: this.entryAnimation,
node: this
}];
},
_exitAnimationChanged: function () {
this.animationConfig = this.animationConfig || {};
this.animationConfig['exit'] = [{
name: this.exitAnimation,
node: this
}];
},
_copyProperties: function (config1, config2) {
for (var property in config2) {
config1[property] = config2[property];
}
},
_cloneConfig: function (config) {
var clone = { isClone: true };
this._copyProperties(clone, config);
return clone;
},
_getAnimationConfigRecursive: function (type, map, allConfigs) {
if (!this.animationConfig) {
return;
}
if (this.animationConfig.value && typeof this.animationConfig.value === 'function') {
this._warn(this._logf('playAnimation', 'Please put \'animationConfig\' inside of your components \'properties\' object instead of outside of it.'));
return;
}
var thisConfig;
if (type) {
thisConfig = this.animationConfig[type];
} else {
thisConfig = this.animationConfig;
}
if (!Array.isArray(thisConfig)) {
thisConfig = [thisConfig];
}
if (thisConfig) {
for (var config, index = 0; config = thisConfig[index]; index++) {
if (config.animatable) {
config.animatable._getAnimationConfigRecursive(config.type || type, map, allConfigs);
} else {
if (config.id) {
var cachedConfig = map[config.id];
if (cachedConfig) {
if (!cachedConfig.isClone) {
map[config.id] = this._cloneConfig(cachedConfig);
cachedConfig = map[config.id];
}
this._copyProperties(cachedConfig, config);
} else {
map[config.id] = config;
}
} else {
allConfigs.push(config);
}
}
}
}
},
getAnimationConfig: function (type) {
var map = {};
var allConfigs = [];
this._getAnimationConfigRecursive(type, map, allConfigs);
for (var key in map) {
allConfigs.push(map[key]);
}
return allConfigs;
}
};
Polymer.NeonAnimationRunnerBehaviorImpl = {
_configureAnimations: function (configs) {
var results = [];
if (configs.length > 0) {
for (var config, index = 0; config = configs[index]; index++) {
var neonAnimation = document.createElement(config.name);
if (neonAnimation.isNeonAnimation) {
var result = null;
try {
result = neonAnimation.configure(config);
if (typeof result.cancel != 'function') {
result = document.timeline.play(result);
}
} catch (e) {
result = null;
console.warn('Couldnt play', '(', config.name, ').', e);
}
if (result) {
results.push({
neonAnimation: neonAnimation,
config: config,
animation: result
});
}
} else {
console.warn(this.is + ':', config.name, 'not found!');
}
}
}
return results;
},
_shouldComplete: function (activeEntries) {
var finished = true;
for (var i = 0; i < activeEntries.length; i++) {
if (activeEntries[i].animation.playState != 'finished') {
finished = false;
break;
}
}
return finished;
},
_complete: function (activeEntries) {
for (var i = 0; i < activeEntries.length; i++) {
activeEntries[i].neonAnimation.complete(activeEntries[i].config);
}
for (var i = 0; i < activeEntries.length; i++) {
activeEntries[i].animation.cancel();
}
},
playAnimation: function (type, cookie) {
var configs = this.getAnimationConfig(type);
if (!configs) {
return;
}
this._active = this._active || {};
if (this._active[type]) {
this._complete(this._active[type]);
delete this._active[type];
}
var activeEntries = this._configureAnimations(configs);
if (activeEntries.length == 0) {
this.fire('neon-animation-finish', cookie, { bubbles: false });
return;
}
this._active[type] = activeEntries;
for (var i = 0; i < activeEntries.length; i++) {
activeEntries[i].animation.onfinish = function () {
if (this._shouldComplete(activeEntries)) {
this._complete(activeEntries);
delete this._active[type];
this.fire('neon-animation-finish', cookie, { bubbles: false });
}
}.bind(this);
}
},
cancelAnimation: function () {
for (var k in this._animations) {
this._animations[k].cancel();
}
this._animations = {};
}
};
Polymer.NeonAnimationRunnerBehavior = [
Polymer.NeonAnimatableBehavior,
Polymer.NeonAnimationRunnerBehaviorImpl
];
Polymer.NeonAnimationBehavior = {
properties: {
animationTiming: {
type: Object,
value: function () {
return {
duration: 500,
easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
fill: 'both'
};
}
}
},
isNeonAnimation: true,
timingFromConfig: function (config) {
if (config.timing) {
for (var property in config.timing) {
this.animationTiming[property] = config.timing[property];
}
}
return this.animationTiming;
},
setPrefixedProperty: function (node, property, value) {
var map = {
'transform': ['webkitTransform'],
'transformOrigin': [
'mozTransformOrigin',
'webkitTransformOrigin'
]
};
var prefixes = map[property];
for (var prefix, index = 0; prefix = prefixes[index]; index++) {
node.style[prefix] = value;
}
node.style[property] = value;
},
complete: function () {
}
};
!function (a, b) {
var c = {}, d = {}, e = {};
!function (a, b) {
function c(a) {
if ('number' == typeof a)
return a;
var b = {};
for (var c in a)
b[c] = a[c];
return b;
}
function d() {
this._delay = 0, this._endDelay = 0, this._fill = 'none', this._iterationStart = 0, this._iterations = 1, this._duration = 0, this._playbackRate = 1, this._direction = 'normal', this._easing = 'linear', this._easingFunction = x;
}
function e() {
return a.isDeprecated('Invalid timing inputs', '2016-03-02', 'TypeError exceptions will be thrown instead.', !0);
}
function f(b, c, e) {
var f = new d();
return c && (f.fill = 'both', f.duration = 'auto'), 'number' != typeof b || isNaN(b) ? void 0 !== b && Object.getOwnPropertyNames(b).forEach(function (c) {
if ('auto' != b[c]) {
if (('number' == typeof f[c] || 'duration' == c) && ('number' != typeof b[c] || isNaN(b[c])))
return;
if ('fill' == c && -1 == v.indexOf(b[c]))
return;
if ('direction' == c && -1 == w.indexOf(b[c]))
return;
if ('playbackRate' == c && 1 !== b[c] && a.isDeprecated('AnimationEffectTiming.playbackRate', '2014-11-28', 'Use Animation.playbackRate instead.'))
return;
f[c] = b[c];
}
}) : f.duration = b, f;
}
function g(a) {
return 'number' == typeof a && (a = isNaN(a) ? { duration: 0 } : { duration: a }), a;
}
function h(b, c) {
return b = a.numericTimingToObject(b), f(b, c);
}
function i(a, b, c, d) {
return a < 0 || a > 1 || c < 0 || c > 1 ? x : function (e) {
function f(a, b, c) {
return 3 * a * (1 - c) * (1 - c) * c + 3 * b * (1 - c) * c * c + c * c * c;
}
if (e <= 0) {
var g = 0;
return a > 0 ? g = b / a : !b && c > 0 && (g = d / c), g * e;
}
if (e >= 1) {
var h = 0;
return c < 1 ? h = (d - 1) / (c - 1) : 1 == c && a < 1 && (h = (b - 1) / (a - 1)), 1 + h * (e - 1);
}
for (var i = 0, j = 1; i < j;) {
var k = (i + j) / 2, l = f(a, c, k);
if (Math.abs(e - l) < 0.00001)
return f(b, d, k);
l < e ? i = k : j = k;
}
return f(b, d, k);
};
}
function j(a, b) {
return function (c) {
if (c >= 1)
return 1;
var d = 1 / a;
return (c += b * d) - c % d;
};
}
function k(a) {
C || (C = document.createElement('div').style), C.animationTimingFunction = '', C.animationTimingFunction = a;
var b = C.animationTimingFunction;
if ('' == b && e())
throw new TypeError(a + ' is not a valid value for easing');
return b;
}
function l(a) {
if ('linear' == a)
return x;
var b = E.exec(a);
if (b)
return i.apply(this, b.slice(1).map(Number));
var c = F.exec(a);
return c ? j(Number(c[1]), {
start: y,
middle: z,
end: A
}[c[2]]) : B[a] || x;
}
function m(a) {
return Math.abs(n(a) / a.playbackRate);
}
function n(a) {
return 0 === a.duration || 0 === a.iterations ? 0 : a.duration * a.iterations;
}
function o(a, b, c) {
if (null == b)
return G;
var d = c.delay + a + c.endDelay;
return b < Math.min(c.delay, d) ? H : b >= Math.min(c.delay + a, d) ? I : J;
}
function p(a, b, c, d, e) {
switch (d) {
case H:
return 'backwards' == b || 'both' == b ? 0 : null;
case J:
return c - e;
case I:
return 'forwards' == b || 'both' == b ? a : null;
case G:
return null;
}
}
function q(a, b, c, d, e) {
var f = e;
return 0 === a ? b !== H && (f += c) : f += d / a, f;
}
function r(a, b, c, d, e, f) {
var g = a === 1 / 0 ? b % 1 : a % 1;
return 0 !== g || c !== I || 0 === d || 0 === e && 0 !== f || (g = 1), g;
}
function s(a, b, c, d) {
return a === I && b === 1 / 0 ? 1 / 0 : 1 === c ? Math.floor(d) - 1 : Math.floor(d);
}
function t(a, b, c) {
var d = a;
if ('normal' !== a && 'reverse' !== a) {
var e = b;
'alternate-reverse' === a && (e += 1), d = 'normal', e !== 1 / 0 && e % 2 != 0 && (d = 'reverse');
}
return 'normal' === d ? c : 1 - c;
}
function u(a, b, c) {
var d = o(a, b, c), e = p(a, c.fill, b, d, c.delay);
if (null === e)
return null;
var f = q(c.duration, d, c.iterations, e, c.iterationStart), g = r(f, c.iterationStart, d, c.iterations, e, c.duration), h = s(d, c.iterations, g, f), i = t(c.direction, h, g);
return c._easingFunction(i);
}
var v = 'backwards|forwards|both|none'.split('|'), w = 'reverse|alternate|alternate-reverse'.split('|'), x = function (a) {
return a;
};
d.prototype = {
_setMember: function (b, c) {
this['_' + b] = c, this._effect && (this._effect._timingInput[b] = c, this._effect._timing = a.normalizeTimingInput(this._effect._timingInput), this._effect.activeDuration = a.calculateActiveDuration(this._effect._timing), this._effect._animation && this._effect._animation._rebuildUnderlyingAnimation());
},
get playbackRate() {
return this._playbackRate;
},
set delay(a) {
this._setMember('delay', a);
},
get delay() {
return this._delay;
},
set endDelay(a) {
this._setMember('endDelay', a);
},
get endDelay() {
return this._endDelay;
},
set fill(a) {
this._setMember('fill', a);
},
get fill() {
return this._fill;
},
set iterationStart(a) {
if ((isNaN(a) || a < 0) && e())
throw new TypeError('iterationStart must be a non-negative number, received: ' + timing.iterationStart);
this._setMember('iterationStart', a);
},
get iterationStart() {
return this._iterationStart;
},
set duration(a) {
if ('auto' != a && (isNaN(a) || a < 0) && e())
throw new TypeError('duration must be non-negative or auto, received: ' + a);
this._setMember('duration', a);
},
get duration() {
return this._duration;
},
set direction(a) {
this._setMember('direction', a);
},
get direction() {
return this._direction;
},
set easing(a) {
this._easingFunction = l(k(a)), this._setMember('easing', a);
},
get easing() {
return this._easing;
},
set iterations(a) {
if ((isNaN(a) || a < 0) && e())
throw new TypeError('iterations must be non-negative, received: ' + a);
this._setMember('iterations', a);
},
get iterations() {
return this._iterations;
}
};
var y = 1, z = 0.5, A = 0, B = {
ease: i(0.25, 0.1, 0.25, 1),
'ease-in': i(0.42, 0, 1, 1),
'ease-out': i(0, 0, 0.58, 1),
'ease-in-out': i(0.42, 0, 0.58, 1),
'step-start': j(1, y),
'step-middle': j(1, z),
'step-end': j(1, A)
}, C = null, D = '\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*', E = new RegExp('cubic-bezier\\(' + D + ',' + D + ',' + D + ',' + D + '\\)'), F = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/, G = 0, H = 1, I = 2, J = 3;
a.cloneTimingInput = c, a.makeTiming = f, a.numericTimingToObject = g, a.normalizeTimingInput = h, a.calculateActiveDuration = m, a.calculateIterationProgress = u, a.calculatePhase = o, a.normalizeEasing = k, a.parseEasingFunction = l;
}(c), function (a, b) {
function c(a, b) {
return a in k ? k[a][b] || b : b;
}
function d(a) {
return 'display' === a || 0 === a.lastIndexOf('animation', 0) || 0 === a.lastIndexOf('transition', 0);
}
function e(a, b, e) {
if (!d(a)) {
var f = h[a];
if (f) {
i.style[a] = b;
for (var g in f) {
var j = f[g], k = i.style[j];
e[j] = c(j, k);
}
} else
e[a] = c(a, b);
}
}
function f(a) {
var b = [];
for (var c in a)
if (!(c in [
'easing',
'offset',
'composite'
])) {
var d = a[c];
Array.isArray(d) || (d = [d]);
for (var e, f = d.length, g = 0; g < f; g++)
e = {}, e.offset = 'offset' in a ? a.offset : 1 == f ? 1 : g / (f - 1), 'easing' in a && (e.easing = a.easing), 'composite' in a && (e.composite = a.composite), e[c] = d[g], b.push(e);
}
return b.sort(function (a, b) {
return a.offset - b.offset;
}), b;
}
function g(b) {
function c() {
var a = d.length;
null == d[a - 1].offset && (d[a - 1].offset = 1), a > 1 && null == d[0].offset && (d[0].offset = 0);
for (var b = 0, c = d[0].offset, e = 1; e < a; e++) {
var f = d[e].offset;
if (null != f) {
for (var g = 1; g < e - b; g++)
d[b + g].offset = c + (f - c) * g / (e - b);
b = e, c = f;
}
}
}
if (null == b)
return [];
window.Symbol && Symbol.iterator && Array.prototype.from && b[Symbol.iterator] && (b = Array.from(b)), Array.isArray(b) || (b = f(b));
for (var d = b.map(function (b) {
var c = {};
for (var d in b) {
var f = b[d];
if ('offset' == d) {
if (null != f) {
if (f = Number(f), !isFinite(f))
throw new TypeError('Keyframe offsets must be numbers.');
if (f < 0 || f > 1)
throw new TypeError('Keyframe offsets must be between 0 and 1.');
}
} else if ('composite' == d) {
if ('add' == f || 'accumulate' == f)
throw {
type: DOMException.NOT_SUPPORTED_ERR,
name: 'NotSupportedError',
message: 'add compositing is not supported'
};
if ('replace' != f)
throw new TypeError('Invalid composite mode ' + f + '.');
} else
f = 'easing' == d ? a.normalizeEasing(f) : '' + f;
e(d, f, c);
}
return void 0 == c.offset && (c.offset = null), void 0 == c.easing && (c.easing = 'linear'), c;
}), g = !0, h = -1 / 0, i = 0; i < d.length; i++) {
var j = d[i].offset;
if (null != j) {
if (j < h)
throw new TypeError('Keyframes are not loosely sorted by offset. Sort or specify offsets.');
h = j;
} else
g = !1;
}
return d = d.filter(function (a) {
return a.offset >= 0 && a.offset <= 1;
}), g || c(), d;
}
var h = {
background: [
'backgroundImage',
'backgroundPosition',
'backgroundSize',
'backgroundRepeat',
'backgroundAttachment',
'backgroundOrigin',
'backgroundClip',
'backgroundColor'
],
border: [
'borderTopColor',
'borderTopStyle',
'borderTopWidth',
'borderRightColor',
'borderRightStyle',
'borderRightWidth',
'borderBottomColor',
'borderBottomStyle',
'borderBottomWidth',
'borderLeftColor',
'borderLeftStyle',
'borderLeftWidth'
],
borderBottom: [
'borderBottomWidth',
'borderBottomStyle',
'borderBottomColor'
],
borderColor: [
'borderTopColor',
'borderRightColor',
'borderBottomColor',
'borderLeftColor'
],
borderLeft: [
'borderLeftWidth',
'borderLeftStyle',
'borderLeftColor'
],
borderRadius: [
'borderTopLeftRadius',
'borderTopRightRadius',
'borderBottomRightRadius',
'borderBottomLeftRadius'
],
borderRight: [
'borderRightWidth',
'borderRightStyle',
'borderRightColor'
],
borderTop: [
'borderTopWidth',
'borderTopStyle',
'borderTopColor'
],
borderWidth: [
'borderTopWidth',
'borderRightWidth',
'borderBottomWidth',
'borderLeftWidth'
],
flex: [
'flexGrow',
'flexShrink',
'flexBasis'
],
font: [
'fontFamily',
'fontSize',
'fontStyle',
'fontVariant',
'fontWeight',
'lineHeight'
],
margin: [
'marginTop',
'marginRight',
'marginBottom',
'marginLeft'
],
outline: [
'outlineColor',
'outlineStyle',
'outlineWidth'
],
padding: [
'paddingTop',
'paddingRight',
'paddingBottom',
'paddingLeft'
]
}, i = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'), j = {
thin: '1px',
medium: '3px',
thick: '5px'
}, k = {
borderBottomWidth: j,
borderLeftWidth: j,
borderRightWidth: j,
borderTopWidth: j,
fontSize: {
'xx-small': '60%',
'x-small': '75%',
small: '89%',
medium: '100%',
large: '120%',
'x-large': '150%',
'xx-large': '200%'
},
fontWeight: {
normal: '400',
bold: '700'
},
outlineWidth: j,
textShadow: { none: '0px 0px 0px transparent' },
boxShadow: { none: '0px 0px 0px 0px transparent' }
};
a.convertToArrayForm = f, a.normalizeKeyframes = g;
}(c), function (a) {
var b = {};
a.isDeprecated = function (a, c, d, e) {
var f = e ? 'are' : 'is', g = new Date(), h = new Date(c);
return h.setMonth(h.getMonth() + 3), !(g < h && (a in b || console.warn('Web Animations: ' + a + ' ' + f + ' deprecated and will stop working on ' + h.toDateString() + '. ' + d), b[a] = !0, 1));
}, a.deprecated = function (b, c, d, e) {
var f = e ? 'are' : 'is';
if (a.isDeprecated(b, c, d, e))
throw new Error(b + ' ' + f + ' no longer supported. ' + d);
};
}(c), function () {
if (document.documentElement.animate) {
var a = document.documentElement.animate([], 0), b = !0;
if (a && (b = !1, 'play|currentTime|pause|reverse|playbackRate|cancel|finish|startTime|playState'.split('|').forEach(function (c) {
void 0 === a[c] && (b = !0);
})), !b)
return;
}
!function (a, b, c) {
function d(a) {
for (var b = {}, c = 0; c < a.length; c++)
for (var d in a[c])
if ('offset' != d && 'easing' != d && 'composite' != d) {
var e = {
offset: a[c].offset,
easing: a[c].easing,
value: a[c][d]
};
b[d] = b[d] || [], b[d].push(e);
}
for (var f in b) {
var g = b[f];
if (0 != g[0].offset || 1 != g[g.length - 1].offset)
throw {
type: DOMException.NOT_SUPPORTED_ERR,
name: 'NotSupportedError',
message: 'Partial keyframes are not supported'
};
}
return b;
}
function e(c) {
var d = [];
for (var e in c)
for (var f = c[e], g = 0; g < f.length - 1; g++) {
var h = g, i = g + 1, j = f[h].offset, k = f[i].offset, l = j, m = k;
0 == g && (l = -1 / 0, 0 == k && (i = h)), g == f.length - 2 && (m = 1 / 0, 1 == j && (h = i)), d.push({
applyFrom: l,
applyTo: m,
startOffset: f[h].offset,
endOffset: f[i].offset,
easingFunction: a.parseEasingFunction(f[h].easing),
property: e,
interpolation: b.propertyInterpolation(e, f[h].value, f[i].value)
});
}
return d.sort(function (a, b) {
return a.startOffset - b.startOffset;
}), d;
}
b.convertEffectInput = function (c) {
var f = a.normalizeKeyframes(c), g = d(f), h = e(g);
return function (a, c) {
if (null != c)
h.filter(function (a) {
return c >= a.applyFrom && c < a.applyTo;
}).forEach(function (d) {
var e = c - d.startOffset, f = d.endOffset - d.startOffset, g = 0 == f ? 0 : d.easingFunction(e / f);
b.apply(a, d.property, d.interpolation(g));
});
else
for (var d in g)
'offset' != d && 'easing' != d && 'composite' != d && b.clear(a, d);
};
};
}(c, d), function (a, b, c) {
function d(a) {
return a.replace(/-(.)/g, function (a, b) {
return b.toUpperCase();
});
}
function e(a, b, c) {
h[c] = h[c] || [], h[c].push([
a,
b
]);
}
function f(a, b, c) {
for (var f = 0; f < c.length; f++) {
e(a, b, d(c[f]));
}
}
function g(c, e, f) {
var g = c;
/-/.test(c) && !a.isDeprecated('Hyphenated property names', '2016-03-22', 'Use camelCase instead.', !0) && (g = d(c)), 'initial' != e && 'initial' != f || ('initial' == e && (e = i[g]), 'initial' == f && (f = i[g]));
for (var j = e == f ? [] : h[g], k = 0; j && k < j.length; k++) {
var l = j[k][0](e), m = j[k][0](f);
if (void 0 !== l && void 0 !== m) {
var n = j[k][1](l, m);
if (n) {
var o = b.Interpolation.apply(null, n);
return function (a) {
return 0 == a ? e : 1 == a ? f : o(a);
};
}
}
}
return b.Interpolation(!1, !0, function (a) {
return a ? f : e;
});
}
var h = {};
b.addPropertiesHandler = f;
var i = {
backgroundColor: 'transparent',
backgroundPosition: '0% 0%',
borderBottomColor: 'currentColor',
borderBottomLeftRadius: '0px',
borderBottomRightRadius: '0px',
borderBottomWidth: '3px',
borderLeftColor: 'currentColor',
borderLeftWidth: '3px',
borderRightColor: 'currentColor',
borderRightWidth: '3px',
borderSpacing: '2px',
borderTopColor: 'currentColor',
borderTopLeftRadius: '0px',
borderTopRightRadius: '0px',
borderTopWidth: '3px',
bottom: 'auto',
clip: 'rect(0px, 0px, 0px, 0px)',
color: 'black',
fontSize: '100%',
fontWeight: '400',
height: 'auto',
left: 'auto',
letterSpacing: 'normal',
lineHeight: '120%',
marginBottom: '0px',
marginLeft: '0px',
marginRight: '0px',
marginTop: '0px',
maxHeight: 'none',
maxWidth: 'none',
minHeight: '0px',
minWidth: '0px',
opacity: '1.0',
outlineColor: 'invert',
outlineOffset: '0px',
outlineWidth: '3px',
paddingBottom: '0px',
paddingLeft: '0px',
paddingRight: '0px',
paddingTop: '0px',
right: 'auto',
strokeDasharray: 'none',
strokeDashoffset: '0px',
textIndent: '0px',
textShadow: '0px 0px 0px transparent',
top: 'auto',
transform: '',
verticalAlign: '0px',
visibility: 'visible',
width: 'auto',
wordSpacing: 'normal',
zIndex: 'auto'
};
b.propertyInterpolation = g;
}(c, d), function (a, b, c) {
function d(b) {
var c = a.calculateActiveDuration(b), d = function (d) {
return a.calculateIterationProgress(c, d, b);
};
return d._totalDuration = b.delay + c + b.endDelay, d;
}
b.KeyframeEffect = function (c, e, f, g) {
var h, i = d(a.normalizeTimingInput(f)), j = b.convertEffectInput(e), k = function () {
j(c, h);
};
return k._update = function (a) {
return null !== (h = i(a));
}, k._clear = function () {
j(c, null);
}, k._hasSameTarget = function (a) {
return c === a;
}, k._target = c, k._totalDuration = i._totalDuration, k._id = g, k;
};
}(c, d), function (a, b) {
a.apply = function (b, c, d) {
b.style[a.propertyName(c)] = d;
}, a.clear = function (b, c) {
b.style[a.propertyName(c)] = '';
};
}(d), function (a) {
window.Element.prototype.animate = function (b, c) {
var d = '';
return c && c.id && (d = c.id), a.timeline._play(a.KeyframeEffect(this, b, c, d));
};
}(d), function (a, b) {
function c(a, b, d) {
if ('number' == typeof a && 'number' == typeof b)
return a * (1 - d) + b * d;
if ('boolean' == typeof a && 'boolean' == typeof b)
return d < 0.5 ? a : b;
if (a.length == b.length) {
for (var e = [], f = 0; f < a.length; f++)
e.push(c(a[f], b[f], d));
return e;
}
throw 'Mismatched interpolation arguments ' + a + ':' + b;
}
a.Interpolation = function (a, b, d) {
return function (e) {
return d(c(a, b, e));
};
};
}(d), function (a, b, c) {
a.sequenceNumber = 0;
var d = function (a, b, c) {
this.target = a, this.currentTime = b, this.timelineTime = c, this.type = 'finish', this.bubbles = !1, this.cancelable = !1, this.currentTarget = a, this.defaultPrevented = !1, this.eventPhase = Event.AT_TARGET, this.timeStamp = Date.now();
};
b.Animation = function (b) {
this.id = '', b && b._id && (this.id = b._id), this._sequenceNumber = a.sequenceNumber++, this._currentTime = 0, this._startTime = null, this._paused = !1, this._playbackRate = 1, this._inTimeline = !0, this._finishedFlag = !0, this.onfinish = null, this._finishHandlers = [], this._effect = b, this._inEffect = this._effect._update(0), this._idle = !0, this._currentTimePending = !1;
}, b.Animation.prototype = {
_ensureAlive: function () {
this.playbackRate < 0 && 0 === this.currentTime ? this._inEffect = this._effect._update(-1) : this._inEffect = this._effect._update(this.currentTime), this._inTimeline || !this._inEffect && this._finishedFlag || (this._inTimeline = !0, b.timeline._animations.push(this));
},
_tickCurrentTime: function (a, b) {
a != this._currentTime && (this._currentTime = a, this._isFinished && !b && (this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0), this._ensureAlive());
},
get currentTime() {
return this._idle || this._currentTimePending ? null : this._currentTime;
},
set currentTime(a) {
a = +a, isNaN(a) || (b.restart(), this._paused || null == this._startTime || (this._startTime = this._timeline.currentTime - a / this._playbackRate), this._currentTimePending = !1, this._currentTime != a && (this._idle && (this._idle = !1, this._paused = !0), this._tickCurrentTime(a, !0), b.applyDirtiedAnimation(this)));
},
get startTime() {
return this._startTime;
},
set startTime(a) {
a = +a, isNaN(a) || this._paused || this._idle || (this._startTime = a, this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate), b.applyDirtiedAnimation(this));
},
get playbackRate() {
return this._playbackRate;
},
set playbackRate(a) {
if (a != this._playbackRate) {
var c = this.currentTime;
this._playbackRate = a, this._startTime = null, 'paused' != this.playState && 'idle' != this.playState && (this._finishedFlag = !1, this._idle = !1, this._ensureAlive(), b.applyDirtiedAnimation(this)), null != c && (this.currentTime = c);
}
},
get _isFinished() {
return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration || this._playbackRate < 0 && this._currentTime <= 0);
},
get _totalDuration() {
return this._effect._totalDuration;
},
get playState() {
return this._idle ? 'idle' : null == this._startTime && !this._paused && 0 != this.playbackRate || this._currentTimePending ? 'pending' : this._paused ? 'paused' : this._isFinished ? 'finished' : 'running';
},
_rewind: function () {
if (this._playbackRate >= 0)
this._currentTime = 0;
else {
if (!(this._totalDuration < 1 / 0))
throw new DOMException('Unable to rewind negative playback rate animation with infinite duration', 'InvalidStateError');
this._currentTime = this._totalDuration;
}
},
play: function () {
this._paused = !1, (this._isFinished || this._idle) && (this._rewind(), this._startTime = null), this._finishedFlag = !1, this._idle = !1, this._ensureAlive(), b.applyDirtiedAnimation(this);
},
pause: function () {
this._isFinished || this._paused || this._idle ? this._idle && (this._rewind(), this._idle = !1) : this._currentTimePending = !0, this._startTime = null, this._paused = !0;
},
finish: function () {
this._idle || (this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0, this._startTime = this._totalDuration - this.currentTime, this._currentTimePending = !1, b.applyDirtiedAnimation(this));
},
cancel: function () {
this._inEffect && (this._inEffect = !1, this._idle = !0, this._paused = !1, this._isFinished = !0, this._finishedFlag = !0, this._currentTime = 0, this._startTime = null, this._effect._update(null), b.applyDirtiedAnimation(this));
},
reverse: function () {
this.playbackRate *= -1, this.play();
},
addEventListener: function (a, b) {
'function' == typeof b && 'finish' == a && this._finishHandlers.push(b);
},
removeEventListener: function (a, b) {
if ('finish' == a) {
var c = this._finishHandlers.indexOf(b);
c >= 0 && this._finishHandlers.splice(c, 1);
}
},
_fireEvents: function (a) {
if (this._isFinished) {
if (!this._finishedFlag) {
var b = new d(this, this._currentTime, a), c = this._finishHandlers.concat(this.onfinish ? [this.onfinish] : []);
setTimeout(function () {
c.forEach(function (a) {
a.call(b.target, b);
});
}, 0), this._finishedFlag = !0;
}
} else
this._finishedFlag = !1;
},
_tick: function (a, b) {
this._idle || this._paused || (null == this._startTime ? b && (this.startTime = a - this._currentTime / this.playbackRate) : this._isFinished || this._tickCurrentTime((a - this._startTime) * this.playbackRate)), b && (this._currentTimePending = !1, this._fireEvents(a));
},
get _needsTick() {
return this.playState in {
pending: 1,
running: 1
} || !this._finishedFlag;
},
_targetAnimations: function () {
var a = this._effect._target;
return a._activeAnimations || (a._activeAnimations = []), a._activeAnimations;
},
_markTarget: function () {
var a = this._targetAnimations();
-1 === a.indexOf(this) && a.push(this);
},
_unmarkTarget: function () {
var a = this._targetAnimations(), b = a.indexOf(this);
-1 !== b && a.splice(b, 1);
}
};
}(c, d), function (a, b, c) {
function d(a) {
var b = j;
j = [], a < q.currentTime && (a = q.currentTime), q._animations.sort(e), q._animations = h(a, !0, q._animations)[0], b.forEach(function (b) {
b[1](a);
}), g(), l = void 0;
}
function e(a, b) {
return a._sequenceNumber - b._sequenceNumber;
}
function f() {
this._animations = [], this.currentTime = window.performance && performance.now ? performance.now() : 0;
}
function g() {
o.forEach(function (a) {
a();
}), o.length = 0;
}
function h(a, c, d) {
p = !0, n = !1, b.timeline.currentTime = a, m = !1;
var e = [], f = [], g = [], h = [];
return d.forEach(function (b) {
b._tick(a, c), b._inEffect ? (f.push(b._effect), b._markTarget()) : (e.push(b._effect), b._unmarkTarget()), b._needsTick && (m = !0);
var d = b._inEffect || b._needsTick;
b._inTimeline = d, d ? g.push(b) : h.push(b);
}), o.push.apply(o, e), o.push.apply(o, f), m && requestAnimationFrame(function () {
}), p = !1, [
g,
h
];
}
var i = window.requestAnimationFrame, j = [], k = 0;
window.requestAnimationFrame = function (a) {
var b = k++;
return 0 == j.length && i(d), j.push([
b,
a
]), b;
}, window.cancelAnimationFrame = function (a) {
j.forEach(function (b) {
b[0] == a && (b[1] = function () {
});
});
}, f.prototype = {
_play: function (c) {
c._timing = a.normalizeTimingInput(c.timing);
var d = new b.Animation(c);
return d._idle = !1, d._timeline = this, this._animations.push(d), b.restart(), b.applyDirtiedAnimation(d), d;
}
};
var l = void 0, m = !1, n = !1;
b.restart = function () {
return m || (m = !0, requestAnimationFrame(function () {
}), n = !0), n;
}, b.applyDirtiedAnimation = function (a) {
if (!p) {
a._markTarget();
var c = a._targetAnimations();
c.sort(e), h(b.timeline.currentTime, !1, c.slice())[1].forEach(function (a) {
var b = q._animations.indexOf(a);
-1 !== b && q._animations.splice(b, 1);
}), g();
}
};
var o = [], p = !1, q = new f();
b.timeline = q;
}(c, d), function (a) {
function b(a, b) {
var c = a.exec(b);
if (c)
return c = a.ignoreCase ? c[0].toLowerCase() : c[0], [
c,
b.substr(c.length)
];
}
function c(a, b) {
b = b.replace(/^\s*/, '');
var c = a(b);
if (c)
return [
c[0],
c[1].replace(/^\s*/, '')
];
}
function d(a, d, e) {
a = c.bind(null, a);
for (var f = [];;) {
var g = a(e);
if (!g)
return [
f,
e
];
if (f.push(g[0]), e = g[1], !(g = b(d, e)) || '' == g[1])
return [
f,
e
];
e = g[1];
}
}
function e(a, b) {
for (var c = 0, d = 0; d < b.length && (!/\s|,/.test(b[d]) || 0 != c); d++)
if ('(' == b[d])
c++;
else if (')' == b[d] && (c--, 0 == c && d++, c <= 0))
break;
var e = a(b.substr(0, d));
return void 0 == e ? void 0 : [
e,
b.substr(d)
];
}
function f(a, b) {
for (var c = a, d = b; c && d;)
c > d ? c %= d : d %= c;
return c = a * b / (c + d);
}
function g(a) {
return function (b) {
var c = a(b);
return c && (c[0] = void 0), c;
};
}
function h(a, b) {
return function (c) {
return a(c) || [
b,
c
];
};
}
function i(b, c) {
for (var d = [], e = 0; e < b.length; e++) {
var f = a.consumeTrimmed(b[e], c);
if (!f || '' == f[0])
return;
void 0 !== f[0] && d.push(f[0]), c = f[1];
}
if ('' == c)
return d;
}
function j(a, b, c, d, e) {
for (var g = [], h = [], i = [], j = f(d.length, e.length), k = 0; k < j; k++) {
var l = b(d[k % d.length], e[k % e.length]);
if (!l)
return;
g.push(l[0]), h.push(l[1]), i.push(l[2]);
}
return [
g,
h,
function (b) {
var d = b.map(function (a, b) {
return i[b](a);
}).join(c);
return a ? a(d) : d;
}
];
}
function k(a, b, c) {
for (var d = [], e = [], f = [], g = 0, h = 0; h < c.length; h++)
if ('function' == typeof c[h]) {
var i = c[h](a[g], b[g++]);
d.push(i[0]), e.push(i[1]), f.push(i[2]);
} else
!function (a) {
d.push(!1), e.push(!1), f.push(function () {
return c[a];
});
}(h);
return [
d,
e,
function (a) {
for (var b = '', c = 0; c < a.length; c++)
b += f[c](a[c]);
return b;
}
];
}
a.consumeToken = b, a.consumeTrimmed = c, a.consumeRepeated = d, a.consumeParenthesised = e, a.ignore = g, a.optional = h, a.consumeList = i, a.mergeNestedRepeated = j.bind(null, null), a.mergeWrappedNestedRepeated = j, a.mergeList = k;
}(d), function (a) {
function b(b) {
function c(b) {
var c = a.consumeToken(/^inset/i, b);
if (c)
return d.inset = !0, c;
var c = a.consumeLengthOrPercent(b);
if (c)
return d.lengths.push(c[0]), c;
var c = a.consumeColor(b);
return c ? (d.color = c[0], c) : void 0;
}
var d = {
inset: !1,
lengths: [],
color: null
}, e = a.consumeRepeated(c, /^/, b);
if (e && e[0].length)
return [
d,
e[1]
];
}
function c(c) {
var d = a.consumeRepeated(b, /^,/, c);
if (d && '' == d[1])
return d[0];
}
function d(b, c) {
for (; b.lengths.length < Math.max(b.lengths.length, c.lengths.length);)
b.lengths.push({ px: 0 });
for (; c.lengths.length < Math.max(b.lengths.length, c.lengths.length);)
c.lengths.push({ px: 0 });
if (b.inset == c.inset && !!b.color == !!c.color) {
for (var d, e = [], f = [
[],
0
], g = [
[],
0
], h = 0; h < b.lengths.length; h++) {
var i = a.mergeDimensions(b.lengths[h], c.lengths[h], 2 == h);
f[0].push(i[0]), g[0].push(i[1]), e.push(i[2]);
}
if (b.color && c.color) {
var j = a.mergeColors(b.color, c.color);
f[1] = j[0], g[1] = j[1], d = j[2];
}
return [
f,
g,
function (a) {
for (var c = b.inset ? 'inset ' : ' ', f = 0; f < e.length; f++)
c += e[f](a[0][f]) + ' ';
return d && (c += d(a[1])), c;
}
];
}
}
function e(b, c, d, e) {
function f(a) {
return {
inset: a,
color: [
0,
0,
0,
0
],
lengths: [
{ px: 0 },
{ px: 0 },
{ px: 0 },
{ px: 0 }
]
};
}
for (var g = [], h = [], i = 0; i < d.length || i < e.length; i++) {
var j = d[i] || f(e[i].inset), k = e[i] || f(d[i].inset);
g.push(j), h.push(k);
}
return a.mergeNestedRepeated(b, c, g, h);
}
var f = e.bind(null, d, ', ');
a.addPropertiesHandler(c, f, [
'box-shadow',
'text-shadow'
]);
}(d), function (a, b) {
function c(a) {
return a.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
function d(a, b, c) {
return Math.min(b, Math.max(a, c));
}
function e(a) {
if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(a))
return Number(a);
}
function f(a, b) {
return [
a,
b,
c
];
}
function g(a, b) {
if (0 != a)
return i(0, 1 / 0)(a, b);
}
function h(a, b) {
return [
a,
b,
function (a) {
return Math.round(d(1, 1 / 0, a));
}
];
}
function i(a, b) {
return function (e, f) {
return [
e,
f,
function (e) {
return c(d(a, b, e));
}
];
};
}
function j(a) {
var b = a.trim().split(/\s*[\s,]\s*/);
if (0 !== b.length) {
for (var c = [], d = 0; d < b.length; d++) {
var f = e(b[d]);
if (void 0 === f)
return;
c.push(f);
}
return c;
}
}
function k(a, b) {
if (a.length == b.length)
return [
a,
b,
function (a) {
return a.map(c).join(' ');
}
];
}
function l(a, b) {
return [
a,
b,
Math.round
];
}
a.clamp = d, a.addPropertiesHandler(j, k, ['stroke-dasharray']), a.addPropertiesHandler(e, i(0, 1 / 0), [
'border-image-width',
'line-height'
]), a.addPropertiesHandler(e, i(0, 1), [
'opacity',
'shape-image-threshold'
]), a.addPropertiesHandler(e, g, [
'flex-grow',
'flex-shrink'
]), a.addPropertiesHandler(e, h, [
'orphans',
'widows'
]), a.addPropertiesHandler(e, l, ['z-index']), a.parseNumber = e, a.parseNumberList = j, a.mergeNumbers = f, a.numberToString = c;
}(d), function (a, b) {
function c(a, b) {
if ('visible' == a || 'visible' == b)
return [
0,
1,
function (c) {
return c <= 0 ? a : c >= 1 ? b : 'visible';
}
];
}
a.addPropertiesHandler(String, c, ['visibility']);
}(d), function (a, b) {
function c(a) {
a = a.trim(), f.fillStyle = '#000', f.fillStyle = a;
var b = f.fillStyle;
if (f.fillStyle = '#fff', f.fillStyle = a, b == f.fillStyle) {
f.fillRect(0, 0, 1, 1);
var c = f.getImageData(0, 0, 1, 1).data;
f.clearRect(0, 0, 1, 1);
var d = c[3] / 255;
return [
c[0] * d,
c[1] * d,
c[2] * d,
d
];
}
}
function d(b, c) {
return [
b,
c,
function (b) {
function c(a) {
return Math.max(0, Math.min(255, a));
}
if (b[3])
for (var d = 0; d < 3; d++)
b[d] = Math.round(c(b[d] / b[3]));
return b[3] = a.numberToString(a.clamp(0, 1, b[3])), 'rgba(' + b.join(',') + ')';
}
];
}
var e = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
e.width = e.height = 1;
var f = e.getContext('2d');
a.addPropertiesHandler(c, d, [
'background-color',
'border-bottom-color',
'border-left-color',
'border-right-color',
'border-top-color',
'color',
'fill',
'flood-color',
'lighting-color',
'outline-color',
'stop-color',
'stroke',
'text-decoration-color'
]), a.consumeColor = a.consumeParenthesised.bind(null, c), a.mergeColors = d;
}(d), function (a, b) {
function c(a) {
function b() {
var b = h.exec(a);
g = b ? b[0] : void 0;
}
function c() {
var a = Number(g);
return b(), a;
}
function d() {
if ('(' !== g)
return c();
b();
var a = f();
return ')' !== g ? NaN : (b(), a);
}
function e() {
for (var a = d(); '*' === g || '/' === g;) {
var c = g;
b();
var e = d();
'*' === c ? a *= e : a /= e;
}
return a;
}
function f() {
for (var a = e(); '+' === g || '-' === g;) {
var c = g;
b();
var d = e();
'+' === c ? a += d : a -= d;
}
return a;
}
var g, h = /([\+\-\w\.]+|[\(\)\*\/])/g;
return b(), f();
}
function d(a, b) {
if ('0' == (b = b.trim().toLowerCase()) && 'px'.search(a) >= 0)
return { px: 0 };
if (/^[^(]*$|^calc/.test(b)) {
b = b.replace(/calc\(/g, '(');
var d = {};
b = b.replace(a, function (a) {
return d[a] = null, 'U' + a;
});
for (var e = 'U(' + a.source + ')', f = b.replace(/[-+]?(\d*\.)?\d+([Ee][-+]?\d+)?/g, 'N').replace(new RegExp('N' + e, 'g'), 'D').replace(/\s[+-]\s/g, 'O').replace(/\s/g, ''), g = [
/N\*(D)/g,
/(N|D)[*\/]N/g,
/(N|D)O\1/g,
/\((N|D)\)/g
], h = 0; h < g.length;)
g[h].test(f) ? (f = f.replace(g[h], '$1'), h = 0) : h++;
if ('D' == f) {
for (var i in d) {
var j = c(b.replace(new RegExp('U' + i, 'g'), '').replace(new RegExp(e, 'g'), '*0'));
if (!isFinite(j))
return;
d[i] = j;
}
return d;
}
}
}
function e(a, b) {
return f(a, b, !0);
}
function f(b, c, d) {
var e, f = [];
for (e in b)
f.push(e);
for (e in c)
f.indexOf(e) < 0 && f.push(e);
return b = f.map(function (a) {
return b[a] || 0;
}), c = f.map(function (a) {
return c[a] || 0;
}), [
b,
c,
function (b) {
var c = b.map(function (c, e) {
return 1 == b.length && d && (c = Math.max(c, 0)), a.numberToString(c) + f[e];
}).join(' + ');
return b.length > 1 ? 'calc(' + c + ')' : c;
}
];
}
var g = 'px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc', h = d.bind(null, new RegExp(g, 'g')), i = d.bind(null, new RegExp(g + '|%', 'g')), j = d.bind(null, /deg|rad|grad|turn/g);
a.parseLength = h, a.parseLengthOrPercent = i, a.consumeLengthOrPercent = a.consumeParenthesised.bind(null, i), a.parseAngle = j, a.mergeDimensions = f;
var k = a.consumeParenthesised.bind(null, h), l = a.consumeRepeated.bind(void 0, k, /^/), m = a.consumeRepeated.bind(void 0, l, /^,/);
a.consumeSizePairList = m;
var n = function (a) {
var b = m(a);
if (b && '' == b[1])
return b[0];
}, o = a.mergeNestedRepeated.bind(void 0, e, ' '), p = a.mergeNestedRepeated.bind(void 0, o, ',');
a.mergeNonNegativeSizePair = o, a.addPropertiesHandler(n, p, ['background-size']), a.addPropertiesHandler(i, e, [
'border-bottom-width',
'border-image-width',
'border-left-width',
'border-right-width',
'border-top-width',
'flex-basis',
'font-size',
'height',
'line-height',
'max-height',
'max-width',
'outline-width',
'width'
]), a.addPropertiesHandler(i, f, [
'border-bottom-left-radius',
'border-bottom-right-radius',
'border-top-left-radius',
'border-top-right-radius',
'bottom',
'left',
'letter-spacing',
'margin-bottom',
'margin-left',
'margin-right',
'margin-top',
'min-height',
'min-width',
'outline-offset',
'padding-bottom',
'padding-left',
'padding-right',
'padding-top',
'perspective',
'right',
'shape-margin',
'stroke-dashoffset',
'text-indent',
'top',
'vertical-align',
'word-spacing'
]);
}(d), function (a, b) {
function c(b) {
return a.consumeLengthOrPercent(b) || a.consumeToken(/^auto/, b);
}
function d(b) {
var d = a.consumeList([
a.ignore(a.consumeToken.bind(null, /^rect/)),
a.ignore(a.consumeToken.bind(null, /^\(/)),
a.consumeRepeated.bind(null, c, /^,/),
a.ignore(a.consumeToken.bind(null, /^\)/))
], b);
if (d && 4 == d[0].length)
return d[0];
}
function e(b, c) {
return 'auto' == b || 'auto' == c ? [
!0,
!1,
function (d) {
var e = d ? b : c;
if ('auto' == e)
return 'auto';
var f = a.mergeDimensions(e, e);
return f[2](f[0]);
}
] : a.mergeDimensions(b, c);
}
function f(a) {
return 'rect(' + a + ')';
}
var g = a.mergeWrappedNestedRepeated.bind(null, f, e, ', ');
a.parseBox = d, a.mergeBoxes = g, a.addPropertiesHandler(d, g, ['clip']);
}(d), function (a, b) {
function c(a) {
return function (b) {
var c = 0;
return a.map(function (a) {
return a === k ? b[c++] : a;
});
};
}
function d(a) {
return a;
}
function e(b) {
if ('none' == (b = b.toLowerCase().trim()))
return [];
for (var c, d = /\s*(\w+)\(([^)]*)\)/g, e = [], f = 0; c = d.exec(b);) {
if (c.index != f)
return;
f = c.index + c[0].length;
var g = c[1], h = n[g];
if (!h)
return;
var i = c[2].split(','), j = h[0];
if (j.length < i.length)
return;
for (var k = [], o = 0; o < j.length; o++) {
var p, q = i[o], r = j[o];
if (void 0 === (p = q ? {
A: function (b) {
return '0' == b.trim() ? m : a.parseAngle(b);
},
N: a.parseNumber,
T: a.parseLengthOrPercent,
L: a.parseLength
}[r.toUpperCase()](q) : {
a: m,
n: k[0],
t: l
}[r]))
return;
k.push(p);
}
if (e.push({
t: g,
d: k
}), d.lastIndex == b.length)
return e;
}
}
function f(a) {
return a.toFixed(6).replace('.000000', '');
}
function g(b, c) {
if (b.decompositionPair !== c) {
b.decompositionPair = c;
var d = a.makeMatrixDecomposition(b);
}
if (c.decompositionPair !== b) {
c.decompositionPair = b;
var e = a.makeMatrixDecomposition(c);
}
return null == d[0] || null == e[0] ? [
[!1],
[!0],
function (a) {
return a ? c[0].d : b[0].d;
}
] : (d[0].push(0), e[0].push(1), [
d,
e,
function (b) {
var c = a.quat(d[0][3], e[0][3], b[5]);
return a.composeMatrix(b[0], b[1], b[2], c, b[4]).map(f).join(',');
}
]);
}
function h(a) {
return a.replace(/[xy]/, '');
}
function i(a) {
return a.replace(/(x|y|z|3d)?$/, '3d');
}
function j(b, c) {
var d = a.makeMatrixDecomposition && !0, e = !1;
if (!b.length || !c.length) {
b.length || (e = !0, b = c, c = []);
for (var f = 0; f < b.length; f++) {
var j = b[f].t, k = b[f].d, l = 'scale' == j.substr(0, 5) ? 1 : 0;
c.push({
t: j,
d: k.map(function (a) {
if ('number' == typeof a)
return l;
var b = {};
for (var c in a)
b[c] = l;
return b;
})
});
}
}
var m = function (a, b) {
return 'perspective' == a && 'perspective' == b || ('matrix' == a || 'matrix3d' == a) && ('matrix' == b || 'matrix3d' == b);
}, o = [], p = [], q = [];
if (b.length != c.length) {
if (!d)
return;
var r = g(b, c);
o = [r[0]], p = [r[1]], q = [[
'matrix',
[r[2]]
]];
} else
for (var f = 0; f < b.length; f++) {
var j, s = b[f].t, t = c[f].t, u = b[f].d, v = c[f].d, w = n[s], x = n[t];
if (m(s, t)) {
if (!d)
return;
var r = g([b[f]], [c[f]]);
o.push(r[0]), p.push(r[1]), q.push([
'matrix',
[r[2]]
]);
} else {
if (s == t)
j = s;
else if (w[2] && x[2] && h(s) == h(t))
j = h(s), u = w[2](u), v = x[2](v);
else {
if (!w[1] || !x[1] || i(s) != i(t)) {
if (!d)
return;
var r = g(b, c);
o = [r[0]], p = [r[1]], q = [[
'matrix',
[r[2]]
]];
break;
}
j = i(s), u = w[1](u), v = x[1](v);
}
for (var y = [], z = [], A = [], B = 0; B < u.length; B++) {
var C = 'number' == typeof u[B] ? a.mergeNumbers : a.mergeDimensions, r = C(u[B], v[B]);
y[B] = r[0], z[B] = r[1], A.push(r[2]);
}
o.push(y), p.push(z), q.push([
j,
A
]);
}
}
if (e) {
var D = o;
o = p, p = D;
}
return [
o,
p,
function (a) {
return a.map(function (a, b) {
var c = a.map(function (a, c) {
return q[b][1][c](a);
}).join(',');
return 'matrix' == q[b][0] && 16 == c.split(',').length && (q[b][0] = 'matrix3d'), q[b][0] + '(' + c + ')';
}).join(' ');
}
];
}
var k = null, l = { px: 0 }, m = { deg: 0 }, n = {
matrix: [
'NNNNNN',
[
k,
k,
0,
0,
k,
k,
0,
0,
0,
0,
1,
0,
k,
k,
0,
1
],
d
],
matrix3d: [
'NNNNNNNNNNNNNNNN',
d
],
rotate: ['A'],
rotatex: ['A'],
rotatey: ['A'],
rotatez: ['A'],
rotate3d: ['NNNA'],
perspective: ['L'],
scale: [
'Nn',
c([
k,
k,
1
]),
d
],
scalex: [
'N',
c([
k,
1,
1
]),
c([
k,
1
])
],
scaley: [
'N',
c([
1,
k,
1
]),
c([
1,
k
])
],
scalez: [
'N',
c([
1,
1,
k
])
],
scale3d: [
'NNN',
d
],
skew: [
'Aa',
null,
d
],
skewx: [
'A',
null,
c([
k,
m
])
],
skewy: [
'A',
null,
c([
m,
k
])
],
translate: [
'Tt',
c([
k,
k,
l
]),
d
],
translatex: [
'T',
c([
k,
l,
l
]),
c([
k,
l
])
],
translatey: [
'T',
c([
l,
k,
l
]),
c([
l,
k
])
],
translatez: [
'L',
c([
l,
l,
k
])
],
translate3d: [
'TTL',
d
]
};
a.addPropertiesHandler(e, j, ['transform']), a.transformToSvgMatrix = function (b) {
var c = a.transformListToMatrix(e(b));
return 'matrix(' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(c[4]) + ' ' + f(c[5]) + ' ' + f(c[12]) + ' ' + f(c[13]) + ')';
};
}(d), function (a, b) {
function c(a, b) {
b.concat([a]).forEach(function (b) {
b in document.documentElement.style && (d[a] = b), e[b] = a;
});
}
var d = {}, e = {};
c('transform', [
'webkitTransform',
'msTransform'
]), c('transformOrigin', ['webkitTransformOrigin']), c('perspective', ['webkitPerspective']), c('perspectiveOrigin', ['webkitPerspectiveOrigin']), a.propertyName = function (a) {
return d[a] || a;
}, a.unprefixedPropertyName = function (a) {
return e[a] || a;
};
}(d);
}(), function () {
if (void 0 === document.createElement('div').animate([]).oncancel) {
var a;
if (window.performance && performance.now)
var a = function () {
return performance.now();
};
else
var a = function () {
return Date.now();
};
var b = function (a, b, c) {
this.target = a, this.currentTime = b, this.timelineTime = c, this.type = 'cancel', this.bubbles = !1, this.cancelable = !1, this.currentTarget = a, this.defaultPrevented = !1, this.eventPhase = Event.AT_TARGET, this.timeStamp = Date.now();
}, c = window.Element.prototype.animate;
window.Element.prototype.animate = function (d, e) {
var f = c.call(this, d, e);
f._cancelHandlers = [], f.oncancel = null;
var g = f.cancel;
f.cancel = function () {
g.call(this);
var c = new b(this, null, a()), d = this._cancelHandlers.concat(this.oncancel ? [this.oncancel] : []);
setTimeout(function () {
d.forEach(function (a) {
a.call(c.target, c);
});
}, 0);
};
var h = f.addEventListener;
f.addEventListener = function (a, b) {
'function' == typeof b && 'cancel' == a ? this._cancelHandlers.push(b) : h.call(this, a, b);
};
var i = f.removeEventListener;
return f.removeEventListener = function (a, b) {
if ('cancel' == a) {
var c = this._cancelHandlers.indexOf(b);
c >= 0 && this._cancelHandlers.splice(c, 1);
} else
i.call(this, a, b);
}, f;
};
}
}(), function (a) {
var b = document.documentElement, c = null, d = !1;
try {
var e = getComputedStyle(b).getPropertyValue('opacity'), f = '0' == e ? '1' : '0';
c = b.animate({
opacity: [
f,
f
]
}, { duration: 1 }), c.currentTime = 0, d = getComputedStyle(b).getPropertyValue('opacity') == f;
} catch (a) {
} finally {
c && c.cancel();
}
if (!d) {
var g = window.Element.prototype.animate;
window.Element.prototype.animate = function (b, c) {
return window.Symbol && Symbol.iterator && Array.prototype.from && b[Symbol.iterator] && (b = Array.from(b)), Array.isArray(b) || null === b || (b = a.convertToArrayForm(b)), g.call(this, b, c);
};
}
}(c), function (a, b, c) {
function d(a) {
var c = b.timeline;
c.currentTime = a, c._discardAnimations(), 0 == c._animations.length ? f = !1 : requestAnimationFrame(d);
}
var e = window.requestAnimationFrame;
window.requestAnimationFrame = function (a) {
return e(function (c) {
b.timeline._updateAnimationsPromises(), a(c), b.timeline._updateAnimationsPromises();
});
}, b.AnimationTimeline = function () {
this._animations = [], this.currentTime = void 0;
}, b.AnimationTimeline.prototype = {
getAnimations: function () {
return this._discardAnimations(), this._animations.slice();
},
_updateAnimationsPromises: function () {
b.animationsWithPromises = b.animationsWithPromises.filter(function (a) {
return a._updatePromises();
});
},
_discardAnimations: function () {
this._updateAnimationsPromises(), this._animations = this._animations.filter(function (a) {
return 'finished' != a.playState && 'idle' != a.playState;
});
},
_play: function (a) {
var c = new b.Animation(a, this);
return this._animations.push(c), b.restartWebAnimationsNextTick(), c._updatePromises(), c._animation.play(), c._updatePromises(), c;
},
play: function (a) {
return a && a.remove(), this._play(a);
}
};
var f = !1;
b.restartWebAnimationsNextTick = function () {
f || (f = !0, requestAnimationFrame(d));
};
var g = new b.AnimationTimeline();
b.timeline = g;
try {
Object.defineProperty(window.document, 'timeline', {
configurable: !0,
get: function () {
return g;
}
});
} catch (a) {
}
try {
window.document.timeline = g;
} catch (a) {
}
}(0, e), function (a, b, c) {
b.animationsWithPromises = [], b.Animation = function (b, c) {
if (this.id = '', b && b._id && (this.id = b._id), this.effect = b, b && (b._animation = this), !c)
throw new Error('Animation with null timeline is not supported');
this._timeline = c, this._sequenceNumber = a.sequenceNumber++, this._holdTime = 0, this._paused = !1, this._isGroup = !1, this._animation = null, this._childAnimations = [], this._callback = null, this._oldPlayState = 'idle', this._rebuildUnderlyingAnimation(), this._animation.cancel(), this._updatePromises();
}, b.Animation.prototype = {
_updatePromises: function () {
var a = this._oldPlayState, b = this.playState;
return this._readyPromise && b !== a && ('idle' == b ? (this._rejectReadyPromise(), this._readyPromise = void 0) : 'pending' == a ? this._resolveReadyPromise() : 'pending' == b && (this._readyPromise = void 0)), this._finishedPromise && b !== a && ('idle' == b ? (this._rejectFinishedPromise(), this._finishedPromise = void 0) : 'finished' == b ? this._resolveFinishedPromise() : 'finished' == a && (this._finishedPromise = void 0)), this._oldPlayState = this.playState, this._readyPromise || this._finishedPromise;
},
_rebuildUnderlyingAnimation: function () {
this._updatePromises();
var a, c, d, e, f = !!this._animation;
f && (a = this.playbackRate, c = this._paused, d = this.startTime, e = this.currentTime, this._animation.cancel(), this._animation._wrapper = null, this._animation = null), (!this.effect || this.effect instanceof window.KeyframeEffect) && (this._animation = b.newUnderlyingAnimationForKeyframeEffect(this.effect), b.bindAnimationForKeyframeEffect(this)), (this.effect instanceof window.SequenceEffect || this.effect instanceof window.GroupEffect) && (this._animation = b.newUnderlyingAnimationForGroup(this.effect), b.bindAnimationForGroup(this)), this.effect && this.effect._onsample && b.bindAnimationForCustomEffect(this), f && (1 != a && (this.playbackRate = a), null !== d ? this.startTime = d : null !== e ? this.currentTime = e : null !== this._holdTime && (this.currentTime = this._holdTime), c && this.pause()), this._updatePromises();
},
_updateChildren: function () {
if (this.effect && 'idle' != this.playState) {
var a = this.effect._timing.delay;
this._childAnimations.forEach(function (c) {
this._arrangeChildren(c, a), this.effect instanceof window.SequenceEffect && (a += b.groupChildDuration(c.effect));
}.bind(this));
}
},
_setExternalAnimation: function (a) {
if (this.effect && this._isGroup)
for (var b = 0; b < this.effect.children.length; b++)
this.effect.children[b]._animation = a, this._childAnimations[b]._setExternalAnimation(a);
},
_constructChildAnimations: function () {
if (this.effect && this._isGroup) {
var a = this.effect._timing.delay;
this._removeChildAnimations(), this.effect.children.forEach(function (c) {
var d = b.timeline._play(c);
this._childAnimations.push(d), d.playbackRate = this.playbackRate, this._paused && d.pause(), c._animation = this.effect._animation, this._arrangeChildren(d, a), this.effect instanceof window.SequenceEffect && (a += b.groupChildDuration(c));
}.bind(this));
}
},
_arrangeChildren: function (a, b) {
null === this.startTime ? a.currentTime = this.currentTime - b / this.playbackRate : a.startTime !== this.startTime + b / this.playbackRate && (a.startTime = this.startTime + b / this.playbackRate);
},
get timeline() {
return this._timeline;
},
get playState() {
return this._animation ? this._animation.playState : 'idle';
},
get finished() {
return window.Promise ? (this._finishedPromise || (-1 == b.animationsWithPromises.indexOf(this) && b.animationsWithPromises.push(this), this._finishedPromise = new Promise(function (a, b) {
this._resolveFinishedPromise = function () {
a(this);
}, this._rejectFinishedPromise = function () {
b({
type: DOMException.ABORT_ERR,
name: 'AbortError'
});
};
}.bind(this)), 'finished' == this.playState && this._resolveFinishedPromise()), this._finishedPromise) : (console.warn('Animation Promises require JavaScript Promise constructor'), null);
},
get ready() {
return window.Promise ? (this._readyPromise || (-1 == b.animationsWithPromises.indexOf(this) && b.animationsWithPromises.push(this), this._readyPromise = new Promise(function (a, b) {
this._resolveReadyPromise = function () {
a(this);
}, this._rejectReadyPromise = function () {
b({
type: DOMException.ABORT_ERR,
name: 'AbortError'
});
};
}.bind(this)), 'pending' !== this.playState && this._resolveReadyPromise()), this._readyPromise) : (console.warn('Animation Promises require JavaScript Promise constructor'), null);
},
get onfinish() {
return this._animation.onfinish;
},
set onfinish(a) {
this._animation.onfinish = 'function' == typeof a ? function (b) {
b.target = this, a.call(this, b);
}.bind(this) : a;
},
get oncancel() {
return this._animation.oncancel;
},
set oncancel(a) {
this._animation.oncancel = 'function' == typeof a ? function (b) {
b.target = this, a.call(this, b);
}.bind(this) : a;
},
get currentTime() {
this._updatePromises();
var a = this._animation.currentTime;
return this._updatePromises(), a;
},
set currentTime(a) {
this._updatePromises(), this._animation.currentTime = isFinite(a) ? a : Math.sign(a) * Number.MAX_VALUE, this._register(), this._forEachChild(function (b, c) {
b.currentTime = a - c;
}), this._updatePromises();
},
get startTime() {
return this._animation.startTime;
},
set startTime(a) {
this._updatePromises(), this._animation.startTime = isFinite(a) ? a : Math.sign(a) * Number.MAX_VALUE, this._register(), this._forEachChild(function (b, c) {
b.startTime = a + c;
}), this._updatePromises();
},
get playbackRate() {
return this._animation.playbackRate;
},
set playbackRate(a) {
this._updatePromises();
var b = this.currentTime;
this._animation.playbackRate = a, this._forEachChild(function (b) {
b.playbackRate = a;
}), null !== b && (this.currentTime = b), this._updatePromises();
},
play: function () {
this._updatePromises(), this._paused = !1, this._animation.play(), -1 == this._timeline._animations.indexOf(this) && this._timeline._animations.push(this), this._register(), b.awaitStartTime(this), this._forEachChild(function (a) {
var b = a.currentTime;
a.play(), a.currentTime = b;
}), this._updatePromises();
},
pause: function () {
this._updatePromises(), this.currentTime && (this._holdTime = this.currentTime), this._animation.pause(), this._register(), this._forEachChild(function (a) {
a.pause();
}), this._paused = !0, this._updatePromises();
},
finish: function () {
this._updatePromises(), this._animation.finish(), this._register(), this._updatePromises();
},
cancel: function () {
this._updatePromises(), this._animation.cancel(), this._register(), this._removeChildAnimations(), this._updatePromises();
},
reverse: function () {
this._updatePromises();
var a = this.currentTime;
this._animation.reverse(), this._forEachChild(function (a) {
a.reverse();
}), null !== a && (this.currentTime = a), this._updatePromises();
},
addEventListener: function (a, b) {
var c = b;
'function' == typeof b && (c = function (a) {
a.target = this, b.call(this, a);
}.bind(this), b._wrapper = c), this._animation.addEventListener(a, c);
},
removeEventListener: function (a, b) {
this._animation.removeEventListener(a, b && b._wrapper || b);
},
_removeChildAnimations: function () {
for (; this._childAnimations.length;)
this._childAnimations.pop().cancel();
},
_forEachChild: function (b) {
var c = 0;
if (this.effect.children && this._childAnimations.length < this.effect.children.length && this._constructChildAnimations(), this._childAnimations.forEach(function (a) {
b.call(this, a, c), this.effect instanceof window.SequenceEffect && (c += a.effect.activeDuration);
}.bind(this)), 'pending' != this.playState) {
var d = this.effect._timing, e = this.currentTime;
null !== e && (e = a.calculateIterationProgress(a.calculateActiveDuration(d), e, d)), (null == e || isNaN(e)) && this._removeChildAnimations();
}
}
}, window.Animation = b.Animation;
}(c, e), function (a, b, c) {
function d(b) {
this._frames = a.normalizeKeyframes(b);
}
function e() {
for (var a = !1; i.length;)
i.shift()._updateChildren(), a = !0;
return a;
}
var f = function (a) {
if (a._animation = void 0, a instanceof window.SequenceEffect || a instanceof window.GroupEffect)
for (var b = 0; b < a.children.length; b++)
f(a.children[b]);
};
b.removeMulti = function (a) {
for (var b = [], c = 0; c < a.length; c++) {
var d = a[c];
d._parent ? (-1 == b.indexOf(d._parent) && b.push(d._parent), d._parent.children.splice(d._parent.children.indexOf(d), 1), d._parent = null, f(d)) : d._animation && d._animation.effect == d && (d._animation.cancel(), d._animation.effect = new KeyframeEffect(null, []), d._animation._callback && (d._animation._callback._animation = null), d._animation._rebuildUnderlyingAnimation(), f(d));
}
for (c = 0; c < b.length; c++)
b[c]._rebuild();
}, b.KeyframeEffect = function (b, c, e, f) {
return this.target = b, this._parent = null, e = a.numericTimingToObject(e), this._timingInput = a.cloneTimingInput(e), this._timing = a.normalizeTimingInput(e), this.timing = a.makeTiming(e, !1, this), this.timing._effect = this, 'function' == typeof c ? (a.deprecated('Custom KeyframeEffect', '2015-06-22', 'Use KeyframeEffect.onsample instead.'), this._normalizedKeyframes = c) : this._normalizedKeyframes = new d(c), this._keyframes = c, this.activeDuration = a.calculateActiveDuration(this._timing), this._id = f, this;
}, b.KeyframeEffect.prototype = {
getFrames: function () {
return 'function' == typeof this._normalizedKeyframes ? this._normalizedKeyframes : this._normalizedKeyframes._frames;
},
set onsample(a) {
if ('function' == typeof this.getFrames())
throw new Error('Setting onsample on custom effect KeyframeEffect is not supported.');
this._onsample = a, this._animation && this._animation._rebuildUnderlyingAnimation();
},
get parent() {
return this._parent;
},
clone: function () {
if ('function' == typeof this.getFrames())
throw new Error('Cloning custom effects is not supported.');
var b = new KeyframeEffect(this.target, [], a.cloneTimingInput(this._timingInput), this._id);
return b._normalizedKeyframes = this._normalizedKeyframes, b._keyframes = this._keyframes, b;
},
remove: function () {
b.removeMulti([this]);
}
};
var g = Element.prototype.animate;
Element.prototype.animate = function (a, c) {
var d = '';
return c && c.id && (d = c.id), b.timeline._play(new b.KeyframeEffect(this, a, c, d));
};
var h = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
b.newUnderlyingAnimationForKeyframeEffect = function (a) {
if (a) {
var b = a.target || h, c = a._keyframes;
'function' == typeof c && (c = []);
var d = a._timingInput;
d.id = a._id;
} else
var b = h, c = [], d = 0;
return g.apply(b, [
c,
d
]);
}, b.bindAnimationForKeyframeEffect = function (a) {
a.effect && 'function' == typeof a.effect._normalizedKeyframes && b.bindAnimationForCustomEffect(a);
};
var i = [];
b.awaitStartTime = function (a) {
null === a.startTime && a._isGroup && (0 == i.length && requestAnimationFrame(e), i.push(a));
};
var j = window.getComputedStyle;
Object.defineProperty(window, 'getComputedStyle', {
configurable: !0,
enumerable: !0,
value: function () {
b.timeline._updateAnimationsPromises();
var a = j.apply(this, arguments);
return e() && (a = j.apply(this, arguments)), b.timeline._updateAnimationsPromises(), a;
}
}), window.KeyframeEffect = b.KeyframeEffect, window.Element.prototype.getAnimations = function () {
return document.timeline.getAnimations().filter(function (a) {
return null !== a.effect && a.effect.target == this;
}.bind(this));
};
}(c, e), function (a, b, c) {
function d(a) {
a._registered || (a._registered = !0, g.push(a), h || (h = !0, requestAnimationFrame(e)));
}
function e(a) {
var b = g;
g = [], b.sort(function (a, b) {
return a._sequenceNumber - b._sequenceNumber;
}), b = b.filter(function (a) {
a();
var b = a._animation ? a._animation.playState : 'idle';
return 'running' != b && 'pending' != b && (a._registered = !1), a._registered;
}), g.push.apply(g, b), g.length ? (h = !0, requestAnimationFrame(e)) : h = !1;
}
var f = (document.createElementNS('http://www.w3.org/1999/xhtml', 'div'), 0);
b.bindAnimationForCustomEffect = function (b) {
var c, e = b.effect.target, g = 'function' == typeof b.effect.getFrames();
c = g ? b.effect.getFrames() : b.effect._onsample;
var h = b.effect.timing, i = null;
h = a.normalizeTimingInput(h);
var j = function () {
var d = j._animation ? j._animation.currentTime : null;
null !== d && (d = a.calculateIterationProgress(a.calculateActiveDuration(h), d, h), isNaN(d) && (d = null)), d !== i && (g ? c(d, e, b.effect) : c(d, b.effect, b.effect._animation)), i = d;
};
j._animation = b, j._registered = !1, j._sequenceNumber = f++, b._callback = j, d(j);
};
var g = [], h = !1;
b.Animation.prototype._register = function () {
this._callback && d(this._callback);
};
}(c, e), function (a, b, c) {
function d(a) {
return a._timing.delay + a.activeDuration + a._timing.endDelay;
}
function e(b, c, d) {
this._id = d, this._parent = null, this.children = b || [], this._reparent(this.children), c = a.numericTimingToObject(c), this._timingInput = a.cloneTimingInput(c), this._timing = a.normalizeTimingInput(c, !0), this.timing = a.makeTiming(c, !0, this), this.timing._effect = this, 'auto' === this._timing.duration && (this._timing.duration = this.activeDuration);
}
window.SequenceEffect = function () {
e.apply(this, arguments);
}, window.GroupEffect = function () {
e.apply(this, arguments);
}, e.prototype = {
_isAncestor: function (a) {
for (var b = this; null !== b;) {
if (b == a)
return !0;
b = b._parent;
}
return !1;
},
_rebuild: function () {
for (var a = this; a;)
'auto' === a.timing.duration && (a._timing.duration = a.activeDuration), a = a._parent;
this._animation && this._animation._rebuildUnderlyingAnimation();
},
_reparent: function (a) {
b.removeMulti(a);
for (var c = 0; c < a.length; c++)
a[c]._parent = this;
},
_putChild: function (a, b) {
for (var c = b ? 'Cannot append an ancestor or self' : 'Cannot prepend an ancestor or self', d = 0; d < a.length; d++)
if (this._isAncestor(a[d]))
throw {
type: DOMException.HIERARCHY_REQUEST_ERR,
name: 'HierarchyRequestError',
message: c
};
for (var d = 0; d < a.length; d++)
b ? this.children.push(a[d]) : this.children.unshift(a[d]);
this._reparent(a), this._rebuild();
},
append: function () {
this._putChild(arguments, !0);
},
prepend: function () {
this._putChild(arguments, !1);
},
get parent() {
return this._parent;
},
get firstChild() {
return this.children.length ? this.children[0] : null;
},
get lastChild() {
return this.children.length ? this.children[this.children.length - 1] : null;
},
clone: function () {
for (var b = a.cloneTimingInput(this._timingInput), c = [], d = 0; d < this.children.length; d++)
c.push(this.children[d].clone());
return this instanceof GroupEffect ? new GroupEffect(c, b) : new SequenceEffect(c, b);
},
remove: function () {
b.removeMulti([this]);
}
}, window.SequenceEffect.prototype = Object.create(e.prototype), Object.defineProperty(window.SequenceEffect.prototype, 'activeDuration', {
get: function () {
var a = 0;
return this.children.forEach(function (b) {
a += d(b);
}), Math.max(a, 0);
}
}), window.GroupEffect.prototype = Object.create(e.prototype), Object.defineProperty(window.GroupEffect.prototype, 'activeDuration', {
get: function () {
var a = 0;
return this.children.forEach(function (b) {
a = Math.max(a, d(b));
}), a;
}
}), b.newUnderlyingAnimationForGroup = function (c) {
var d, e = null, f = function (b) {
var c = d._wrapper;
if (c && 'pending' != c.playState && c.effect)
return null == b ? void c._removeChildAnimations() : 0 == b && c.playbackRate < 0 && (e || (e = a.normalizeTimingInput(c.effect.timing)), b = a.calculateIterationProgress(a.calculateActiveDuration(e), -1, e), isNaN(b) || null == b) ? (c._forEachChild(function (a) {
a.currentTime = -1;
}), void c._removeChildAnimations()) : void 0;
}, g = new KeyframeEffect(null, [], c._timing, c._id);
return g.onsample = f, d = b.timeline._play(g);
}, b.bindAnimationForGroup = function (a) {
a._animation._wrapper = a, a._isGroup = !0, b.awaitStartTime(a), a._constructChildAnimations(), a._setExternalAnimation(a);
}, b.groupChildDuration = d;
}(c, e), b.true = a;
}({}, function () {
return this;
}());
Polymer({
is: 'opaque-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
this._effect = new KeyframeEffect(node, [
{ 'opacity': '1' },
{ 'opacity': '1' }
], this.timingFromConfig(config));
node.style.opacity = '0';
return this._effect;
},
complete: function (config) {
config.node.style.opacity = '';
}
});
(function () {
'use strict';
var lastTouchPosition = {
pageX: 0,
pageY: 0
};
var lastRootTarget = null;
var lastScrollableNodes = [];
var scrollEvents = [
'wheel',
'mousewheel',
'DOMMouseScroll',
'touchstart',
'touchmove'
];
Polymer.IronDropdownScrollManager = {
get currentLockingElement() {
return this._lockingElements[this._lockingElements.length - 1];
},
elementIsScrollLocked: function (element) {
var currentLockingElement = this.currentLockingElement;
if (currentLockingElement === undefined)
return false;
var scrollLocked;
if (this._hasCachedLockedElement(element)) {
return true;
}
if (this._hasCachedUnlockedElement(element)) {
return false;
}
scrollLocked = !!currentLockingElement && currentLockingElement !== element && !this._composedTreeContains(currentLockingElement, element);
if (scrollLocked) {
this._lockedElementCache.push(element);
} else {
this._unlockedElementCache.push(element);
}
return scrollLocked;
},
pushScrollLock: function (element) {
if (this._lockingElements.indexOf(element) >= 0) {
return;
}
if (this._lockingElements.length === 0) {
this._lockScrollInteractions();
}
this._lockingElements.push(element);
this._lockedElementCache = [];
this._unlockedElementCache = [];
},
removeScrollLock: function (element) {
var index = this._lockingElements.indexOf(element);
if (index === -1) {
return;
}
this._lockingElements.splice(index, 1);
this._lockedElementCache = [];
this._unlockedElementCache = [];
if (this._lockingElements.length === 0) {
this._unlockScrollInteractions();
}
},
_lockingElements: [],
_lockedElementCache: null,
_unlockedElementCache: null,
_hasCachedLockedElement: function (element) {
return this._lockedElementCache.indexOf(element) > -1;
},
_hasCachedUnlockedElement: function (element) {
return this._unlockedElementCache.indexOf(element) > -1;
},
_composedTreeContains: function (element, child) {
var contentElements;
var distributedNodes;
var contentIndex;
var nodeIndex;
if (element.contains(child)) {
return true;
}
contentElements = Polymer.dom(element).querySelectorAll('content');
for (contentIndex = 0; contentIndex < contentElements.length; ++contentIndex) {
distributedNodes = Polymer.dom(contentElements[contentIndex]).getDistributedNodes();
for (nodeIndex = 0; nodeIndex < distributedNodes.length; ++nodeIndex) {
if (this._composedTreeContains(distributedNodes[nodeIndex], child)) {
return true;
}
}
}
return false;
},
_scrollInteractionHandler: function (event) {
if (event.cancelable && this._shouldPreventScrolling(event)) {
event.preventDefault();
}
if (event.targetTouches) {
var touch = event.targetTouches[0];
lastTouchPosition.pageX = touch.pageX;
lastTouchPosition.pageY = touch.pageY;
}
},
_lockScrollInteractions: function () {
this._boundScrollHandler = this._boundScrollHandler || this._scrollInteractionHandler.bind(this);
for (var i = 0, l = scrollEvents.length; i < l; i++) {
document.addEventListener(scrollEvents[i], this._boundScrollHandler, {
capture: true,
passive: false
});
}
},
_unlockScrollInteractions: function () {
for (var i = 0, l = scrollEvents.length; i < l; i++) {
document.removeEventListener(scrollEvents[i], this._boundScrollHandler, {
capture: true,
passive: false
});
}
},
_shouldPreventScrolling: function (event) {
var target = Polymer.dom(event).rootTarget;
if (event.type !== 'touchmove' && lastRootTarget !== target) {
lastRootTarget = target;
lastScrollableNodes = this._getScrollableNodes(Polymer.dom(event).path);
}
if (!lastScrollableNodes.length) {
return true;
}
if (event.type === 'touchstart') {
return false;
}
var info = this._getScrollInfo(event);
return !this._getScrollingNode(lastScrollableNodes, info.deltaX, info.deltaY);
},
_getScrollableNodes: function (nodes) {
var scrollables = [];
var lockingIndex = nodes.indexOf(this.currentLockingElement);
for (var i = 0; i <= lockingIndex; i++) {
if (nodes[i].nodeType !== Node.ELEMENT_NODE) {
continue;
}
var node = nodes[i];
var style = node.style;
if (style.overflow !== 'scroll' && style.overflow !== 'auto') {
style = window.getComputedStyle(node);
}
if (style.overflow === 'scroll' || style.overflow === 'auto') {
scrollables.push(node);
}
}
return scrollables;
},
_getScrollingNode: function (nodes, deltaX, deltaY) {
if (!deltaX && !deltaY) {
return;
}
var verticalScroll = Math.abs(deltaY) >= Math.abs(deltaX);
for (var i = 0; i < nodes.length; i++) {
var node = nodes[i];
var canScroll = false;
if (verticalScroll) {
canScroll = deltaY < 0 ? node.scrollTop > 0 : node.scrollTop < node.scrollHeight - node.clientHeight;
} else {
canScroll = deltaX < 0 ? node.scrollLeft > 0 : node.scrollLeft < node.scrollWidth - node.clientWidth;
}
if (canScroll) {
return node;
}
}
},
_getScrollInfo: function (event) {
var info = {
deltaX: event.deltaX,
deltaY: event.deltaY
};
if ('deltaX' in event) {
} else if ('wheelDeltaX' in event) {
info.deltaX = -event.wheelDeltaX;
info.deltaY = -event.wheelDeltaY;
} else if ('axis' in event) {
info.deltaX = event.axis === 1 ? event.detail : 0;
info.deltaY = event.axis === 2 ? event.detail : 0;
} else if (event.targetTouches) {
var touch = event.targetTouches[0];
info.deltaX = lastTouchPosition.pageX - touch.pageX;
info.deltaY = lastTouchPosition.pageY - touch.pageY;
}
return info;
}
};
}());
(function () {
'use strict';
Polymer({
is: 'iron-dropdown',
behaviors: [
Polymer.IronControlState,
Polymer.IronA11yKeysBehavior,
Polymer.IronOverlayBehavior,
Polymer.NeonAnimationRunnerBehavior
],
properties: {
horizontalAlign: {
type: String,
value: 'left',
reflectToAttribute: true
},
verticalAlign: {
type: String,
value: 'top',
reflectToAttribute: true
},
openAnimationConfig: { type: Object },
closeAnimationConfig: { type: Object },
focusTarget: { type: Object },
noAnimations: {
type: Boolean,
value: false
},
allowOutsideScroll: {
type: Boolean,
value: false
},
_boundOnCaptureScroll: {
type: Function,
value: function () {
return this._onCaptureScroll.bind(this);
}
}
},
listeners: { 'neon-animation-finish': '_onNeonAnimationFinish' },
observers: ['_updateOverlayPosition(positionTarget, verticalAlign, horizontalAlign, verticalOffset, horizontalOffset)'],
get containedElement() {
return Polymer.dom(this.$.content).getDistributedNodes()[0];
},
get _focusTarget() {
return this.focusTarget || this.containedElement;
},
ready: function () {
this._scrollTop = 0;
this._scrollLeft = 0;
this._refitOnScrollRAF = null;
},
attached: function () {
if (!this.sizingTarget || this.sizingTarget === this) {
this.sizingTarget = this.containedElement || this;
}
},
detached: function () {
this.cancelAnimation();
document.removeEventListener('scroll', this._boundOnCaptureScroll);
Polymer.IronDropdownScrollManager.removeScrollLock(this);
},
_openedChanged: function () {
if (this.opened && this.disabled) {
this.cancel();
} else {
this.cancelAnimation();
this._updateAnimationConfig();
this._saveScrollPosition();
if (this.opened) {
document.addEventListener('scroll', this._boundOnCaptureScroll);
!this.allowOutsideScroll && Polymer.IronDropdownScrollManager.pushScrollLock(this);
} else {
document.removeEventListener('scroll', this._boundOnCaptureScroll);
Polymer.IronDropdownScrollManager.removeScrollLock(this);
}
Polymer.IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
}
},
_renderOpened: function () {
if (!this.noAnimations && this.animationConfig.open) {
this.$.contentWrapper.classList.add('animating');
this.playAnimation('open');
} else {
Polymer.IronOverlayBehaviorImpl._renderOpened.apply(this, arguments);
}
},
_renderClosed: function () {
if (!this.noAnimations && this.animationConfig.close) {
this.$.contentWrapper.classList.add('animating');
this.playAnimation('close');
} else {
Polymer.IronOverlayBehaviorImpl._renderClosed.apply(this, arguments);
}
},
_onNeonAnimationFinish: function () {
this.$.contentWrapper.classList.remove('animating');
if (this.opened) {
this._finishRenderOpened();
} else {
this._finishRenderClosed();
}
},
_onCaptureScroll: function () {
if (!this.allowOutsideScroll) {
this._restoreScrollPosition();
} else {
this._refitOnScrollRAF && window.cancelAnimationFrame(this._refitOnScrollRAF);
this._refitOnScrollRAF = window.requestAnimationFrame(this.refit.bind(this));
}
},
_saveScrollPosition: function () {
if (document.scrollingElement) {
this._scrollTop = document.scrollingElement.scrollTop;
this._scrollLeft = document.scrollingElement.scrollLeft;
} else {
this._scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
this._scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
}
},
_restoreScrollPosition: function () {
if (document.scrollingElement) {
document.scrollingElement.scrollTop = this._scrollTop;
document.scrollingElement.scrollLeft = this._scrollLeft;
} else {
document.documentElement.scrollTop = this._scrollTop;
document.documentElement.scrollLeft = this._scrollLeft;
document.body.scrollTop = this._scrollTop;
document.body.scrollLeft = this._scrollLeft;
}
},
_updateAnimationConfig: function () {
var animationNode = this.containedElement;
var animations = [].concat(this.openAnimationConfig || []).concat(this.closeAnimationConfig || []);
for (var i = 0; i < animations.length; i++) {
animations[i].node = animationNode;
}
this.animationConfig = {
open: this.openAnimationConfig,
close: this.closeAnimationConfig
};
},
_updateOverlayPosition: function () {
if (this.isAttached) {
this.notifyResize();
}
},
_applyFocus: function () {
var focusTarget = this.focusTarget || this.containedElement;
if (focusTarget && this.opened && !this.noAutoFocus) {
focusTarget.focus();
} else {
Polymer.IronOverlayBehaviorImpl._applyFocus.apply(this, arguments);
}
}
});
}());
Polymer({
is: 'fade-in-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
this._effect = new KeyframeEffect(node, [
{ 'opacity': '0' },
{ 'opacity': '1' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'fade-out-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
this._effect = new KeyframeEffect(node, [
{ 'opacity': '1' },
{ 'opacity': '0' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-grow-height-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var height = rect.height;
this._effect = new KeyframeEffect(node, [
{ height: height / 2 + 'px' },
{ height: height + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-grow-width-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var width = rect.width;
this._effect = new KeyframeEffect(node, [
{ width: width / 2 + 'px' },
{ width: width + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-shrink-width-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var width = rect.width;
this._effect = new KeyframeEffect(node, [
{ width: width + 'px' },
{ width: width - width / 20 + 'px' }
], this.timingFromConfig(config));
return this._effect;
}
});
Polymer({
is: 'paper-menu-shrink-height-animation',
behaviors: [Polymer.NeonAnimationBehavior],
configure: function (config) {
var node = config.node;
var rect = node.getBoundingClientRect();
var height = rect.height;
var top = rect.top;
this.setPrefixedProperty(node, 'transformOrigin', '0 0');
this._effect = new KeyframeEffect(node, [
{
height: height + 'px',
transform: 'translateY(0)'
},
{
height: height / 2 + 'px',
transform: 'translateY(-20px)'
}
], this.timingFromConfig(config));
return this._effect;
}
});
(function () {
'use strict';
var config = {
ANIMATION_CUBIC_BEZIER: 'cubic-bezier(.3,.95,.5,1)',
MAX_ANIMATION_TIME_MS: 400
};
var PaperMenuButton = Polymer({
is: 'paper-menu-button',
behaviors: [
Polymer.IronA11yKeysBehavior,
Polymer.IronControlState
],
properties: {
opened: {
type: Boolean,
value: false,
notify: true,
observer: '_openedChanged'
},
horizontalAlign: {
type: String,
value: 'left',
reflectToAttribute: true
},
verticalAlign: {
type: String,
value: 'top',
reflectToAttribute: true
},
dynamicAlign: { type: Boolean },
horizontalOffset: {
type: Number,
value: 0,
notify: true
},
verticalOffset: {
type: Number,
value: 0,
notify: true
},
noOverlap: { type: Boolean },
noAnimations: {
type: Boolean,
value: false
},
ignoreSelect: {
type: Boolean,
value: false
},
closeOnActivate: {
type: Boolean,
value: false
},
openAnimationConfig: {
type: Object,
value: function () {
return [
{
name: 'fade-in-animation',
timing: {
delay: 100,
duration: 200
}
},
{
name: 'paper-menu-grow-width-animation',
timing: {
delay: 100,
duration: 150,
easing: config.ANIMATION_CUBIC_BEZIER
}
},
{
name: 'paper-menu-grow-height-animation',
timing: {
delay: 100,
duration: 275,
easing: config.ANIMATION_CUBIC_BEZIER
}
}
];
}
},
closeAnimationConfig: {
type: Object,
value: function () {
return [
{
name: 'fade-out-animation',
timing: { duration: 150 }
},
{
name: 'paper-menu-shrink-width-animation',
timing: {
delay: 100,
duration: 50,
easing: config.ANIMATION_CUBIC_BEZIER
}
},
{
name: 'paper-menu-shrink-height-animation',
timing: {
duration: 200,
easing: 'ease-in'
}
}
];
}
},
allowOutsideScroll: {
type: Boolean,
value: false
},
restoreFocusOnClose: {
type: Boolean,
value: true
},
_dropdownContent: { type: Object }
},
hostAttributes: {
role: 'group',
'aria-haspopup': 'true'
},
listeners: {
'iron-activate': '_onIronActivate',
'iron-select': '_onIronSelect'
},
get contentElement() {
return Polymer.dom(this.$.content).getDistributedNodes()[0];
},
toggle: function () {
if (this.opened) {
this.close();
} else {
this.open();
}
},
open: function () {
if (this.disabled) {
return;
}
this.$.dropdown.open();
},
close: function () {
this.$.dropdown.close();
},
_onIronSelect: function (event) {
if (!this.ignoreSelect) {
this.close();
}
},
_onIronActivate: function (event) {
if (this.closeOnActivate) {
this.close();
}
},
_openedChanged: function (opened, oldOpened) {
if (opened) {
this._dropdownContent = this.contentElement;
this.fire('paper-dropdown-open');
} else if (oldOpened != null) {
this.fire('paper-dropdown-close');
}
},
_disabledChanged: function (disabled) {
Polymer.IronControlState._disabledChanged.apply(this, arguments);
if (disabled && this.opened) {
this.close();
}
},
__onIronOverlayCanceled: function (event) {
var uiEvent = event.detail;
var target = Polymer.dom(uiEvent).rootTarget;
var trigger = this.$.trigger;
var path = Polymer.dom(uiEvent).path;
if (path.indexOf(trigger) > -1) {
event.preventDefault();
}
}
});
Object.keys(config).forEach(function (key) {
PaperMenuButton[key] = config[key];
});
Polymer.PaperMenuButton = PaperMenuButton;
}());
Polymer.IronFormElementBehavior = {
properties: {
name: { type: String },
value: {
notify: true,
type: String
},
required: {
type: Boolean,
value: false
},
_parentForm: { type: Object }
},
attached: function () {
this.fire('iron-form-element-register');
},
detached: function () {
if (this._parentForm) {
this._parentForm.fire('iron-form-element-unregister', { target: this });
}
}
};
(function () {
'use strict';
Polymer.IronA11yAnnouncer = Polymer({
is: 'iron-a11y-announcer',
properties: {
mode: {
type: String,
value: 'polite'
},
_text: {
type: String,
value: ''
}
},
created: function () {
if (!Polymer.IronA11yAnnouncer.instance) {
Polymer.IronA11yAnnouncer.instance = this;
}
document.body.addEventListener('iron-announce', this._onIronAnnounce.bind(this));
},
announce: function (text) {
this._text = '';
this.async(function () {
this._text = text;
}, 100);
},
_onIronAnnounce: function (event) {
if (event.detail && event.detail.text) {
this.announce(event.detail.text);
}
}
});
Polymer.IronA11yAnnouncer.instance = null;
Polymer.IronA11yAnnouncer.requestAvailability = function () {
if (!Polymer.IronA11yAnnouncer.instance) {
Polymer.IronA11yAnnouncer.instance = document.createElement('iron-a11y-announcer');
}
document.body.appendChild(Polymer.IronA11yAnnouncer.instance);
};
}());
Polymer.IronValidatableBehaviorMeta = null;
Polymer.IronValidatableBehavior = {
properties: {
validator: { type: String },
invalid: {
notify: true,
reflectToAttribute: true,
type: Boolean,
value: false
},
_validatorMeta: { type: Object },
validatorType: {
type: String,
value: 'validator'
},
_validator: {
type: Object,
computed: '__computeValidator(validator)'
}
},
observers: ['_invalidChanged(invalid)'],
registered: function () {
Polymer.IronValidatableBehaviorMeta = new Polymer.IronMeta({ type: 'validator' });
},
_invalidChanged: function () {
if (this.invalid) {
this.setAttribute('aria-invalid', 'true');
} else {
this.removeAttribute('aria-invalid');
}
},
hasValidator: function () {
return this._validator != null;
},
validate: function (value) {
this.invalid = !this._getValidity(value);
return !this.invalid;
},
_getValidity: function (value) {
if (this.hasValidator()) {
return this._validator.validate(value);
}
return true;
},
__computeValidator: function () {
return Polymer.IronValidatableBehaviorMeta && Polymer.IronValidatableBehaviorMeta.byKey(this.validator);
}
};
Polymer({
is: 'iron-input',
extends: 'input',
behaviors: [Polymer.IronValidatableBehavior],
properties: {
bindValue: {
observer: '_bindValueChanged',
type: String
},
preventInvalidInput: { type: Boolean },
allowedPattern: {
type: String,
observer: '_allowedPatternChanged'
},
_previousValidInput: {
type: String,
value: ''
},
_patternAlreadyChecked: {
type: Boolean,
value: false
}
},
listeners: {
'input': '_onInput',
'keypress': '_onKeypress'
},
registered: function () {
if (!this._canDispatchEventOnDisabled()) {
this._origDispatchEvent = this.dispatchEvent;
this.dispatchEvent = this._dispatchEventFirefoxIE;
}
},
created: function () {
Polymer.IronA11yAnnouncer.requestAvailability();
},
_canDispatchEventOnDisabled: function () {
var input = document.createElement('input');
var canDispatch = false;
input.disabled = true;
input.addEventListener('feature-check-dispatch-event', function () {
canDispatch = true;
});
try {
input.dispatchEvent(new Event('feature-check-dispatch-event'));
} catch (e) {
}
return canDispatch;
},
_dispatchEventFirefoxIE: function (event) {
var disabled = this.disabled;
this.disabled = false;
var defaultPrevented = this._origDispatchEvent(event);
this.disabled = disabled;
return defaultPrevented;
},
get _patternRegExp() {
var pattern;
if (this.allowedPattern) {
pattern = new RegExp(this.allowedPattern);
} else {
switch (this.type) {
case 'number':
pattern = /[0-9.,e-]/;
break;
}
}
return pattern;
},
ready: function () {
this.bindValue = this.value;
},
_bindValueChanged: function () {
if (this.value !== this.bindValue) {
this.value = !(this.bindValue || this.bindValue === 0 || this.bindValue === false) ? '' : this.bindValue;
}
this.fire('bind-value-changed', { value: this.bindValue });
},
_allowedPatternChanged: function () {
this.preventInvalidInput = this.allowedPattern ? true : false;
},
_onInput: function () {
if (this.preventInvalidInput && !this._patternAlreadyChecked) {
var valid = this._checkPatternValidity();
if (!valid) {
this._announceInvalidCharacter('Invalid string of characters not entered.');
this.value = this._previousValidInput;
}
}
this.bindValue = this.value;
this._previousValidInput = this.value;
this._patternAlreadyChecked = false;
},
_isPrintable: function (event) {
var anyNonPrintable = event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 13 || event.keyCode == 27;
var mozNonPrintable = event.keyCode == 19 || event.keyCode == 20 || event.keyCode == 45 || event.keyCode == 46 || event.keyCode == 144 || event.keyCode == 145 || event.keyCode > 32 && event.keyCode < 41 || event.keyCode > 111 && event.keyCode < 124;
return !anyNonPrintable && !(event.charCode == 0 && mozNonPrintable);
},
_onKeypress: function (event) {
if (!this.preventInvalidInput && this.type !== 'number') {
return;
}
var regexp = this._patternRegExp;
if (!regexp) {
return;
}
if (event.metaKey || event.ctrlKey || event.altKey)
return;
this._patternAlreadyChecked = true;
var thisChar = String.fromCharCode(event.charCode);
if (this._isPrintable(event) && !regexp.test(thisChar)) {
event.preventDefault();
this._announceInvalidCharacter('Invalid character ' + thisChar + ' not entered.');
}
},
_checkPatternValidity: function () {
var regexp = this._patternRegExp;
if (!regexp) {
return true;
}
for (var i = 0; i < this.value.length; i++) {
if (!regexp.test(this.value[i])) {
return false;
}
}
return true;
},
validate: function () {
var valid = this.checkValidity();
if (valid) {
if (this.required && this.value === '') {
valid = false;
} else if (this.hasValidator()) {
valid = Polymer.IronValidatableBehavior.validate.call(this, this.value);
}
}
this.invalid = !valid;
this.fire('iron-input-validate');
return valid;
},
_announceInvalidCharacter: function (message) {
this.fire('iron-announce', { text: message });
}
});
Polymer.PaperInputHelper = {};
Polymer.PaperInputHelper.NextLabelID = 1;
Polymer.PaperInputHelper.NextAddonID = 1;
Polymer.PaperInputBehaviorImpl = {
properties: {
label: { type: String },
value: {
notify: true,
type: String
},
disabled: {
type: Boolean,
value: false
},
invalid: {
type: Boolean,
value: false,
notify: true
},
preventInvalidInput: { type: Boolean },
allowedPattern: { type: String },
type: { type: String },
list: { type: String },
pattern: { type: String },
required: {
type: Boolean,
value: false
},
errorMessage: { type: String },
charCounter: {
type: Boolean,
value: false
},
noLabelFloat: {
type: Boolean,
value: false
},
alwaysFloatLabel: {
type: Boolean,
value: false
},
autoValidate: {
type: Boolean,
value: false
},
validator: { type: String },
autocomplete: {
type: String,
value: 'off'
},
autofocus: {
type: Boolean,
observer: '_autofocusChanged'
},
inputmode: { type: String },
minlength: { type: Number },
maxlength: { type: Number },
min: { type: String },
max: { type: String },
step: { type: String },
name: { type: String },
placeholder: {
type: String,
value: ''
},
readonly: {
type: Boolean,
value: false
},
size: { type: Number },
autocapitalize: {
type: String,
value: 'none'
},
autocorrect: {
type: String,
value: 'off'
},
autosave: { type: String },
results: { type: Number },
accept: { type: String },
multiple: { type: Boolean },
_ariaDescribedBy: {
type: String,
value: ''
},
_ariaLabelledBy: {
type: String,
value: ''
}
},
listeners: { 'addon-attached': '_onAddonAttached' },
keyBindings: { 'shift+tab:keydown': '_onShiftTabDown' },
hostAttributes: { tabindex: 0 },
get inputElement() {
return this.$.input;
},
get _focusableElement() {
return this.inputElement;
},
registered: function () {
this._typesThatHaveText = [
'date',
'datetime',
'datetime-local',
'month',
'time',
'week',
'file'
];
},
attached: function () {
this._updateAriaLabelledBy();
if (this.inputElement && this._typesThatHaveText.indexOf(this.inputElement.type) !== -1) {
this.alwaysFloatLabel = true;
}
},
_appendStringWithSpace: function (str, more) {
if (str) {
str = str + ' ' + more;
} else {
str = more;
}
return str;
},
_onAddonAttached: function (event) {
var target = event.path ? event.path[0] : event.target;
if (target.id) {
this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, target.id);
} else {
var id = 'paper-input-add-on-' + Polymer.PaperInputHelper.NextAddonID++;
target.id = id;
this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, id);
}
},
validate: function () {
return this.inputElement.validate();
},
_focusBlurHandler: function (event) {
Polymer.IronControlState._focusBlurHandler.call(this, event);
if (this.focused && !this._shiftTabPressed)
this._focusableElement.focus();
},
_onShiftTabDown: function (event) {
var oldTabIndex = this.getAttribute('tabindex');
this._shiftTabPressed = true;
this.setAttribute('tabindex', '-1');
this.async(function () {
this.setAttribute('tabindex', oldTabIndex);
this._shiftTabPressed = false;
}, 1);
},
_handleAutoValidate: function () {
if (this.autoValidate)
this.validate();
},
updateValueAndPreserveCaret: function (newValue) {
try {
var start = this.inputElement.selectionStart;
this.value = newValue;
this.inputElement.selectionStart = start;
this.inputElement.selectionEnd = start;
} catch (e) {
this.value = newValue;
}
},
_computeAlwaysFloatLabel: function (alwaysFloatLabel, placeholder) {
return placeholder || alwaysFloatLabel;
},
_updateAriaLabelledBy: function () {
var label = Polymer.dom(this.root).querySelector('label');
if (!label) {
this._ariaLabelledBy = '';
return;
}
var labelledBy;
if (label.id) {
labelledBy = label.id;
} else {
labelledBy = 'paper-input-label-' + Polymer.PaperInputHelper.NextLabelID++;
label.id = labelledBy;
}
this._ariaLabelledBy = labelledBy;
},
_onChange: function (event) {
if (this.shadowRoot) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
},
_autofocusChanged: function () {
if (this.autofocus && this._focusableElement) {
var activeElement = document.activeElement;
var isActiveElementValid = activeElement instanceof HTMLElement;
var isSomeElementActive = isActiveElementValid && activeElement !== document.body && activeElement !== document.documentElement;
if (!isSomeElementActive) {
this._focusableElement.focus();
}
}
}
};
Polymer.PaperInputBehavior = [
Polymer.IronControlState,
Polymer.IronA11yKeysBehavior,
Polymer.PaperInputBehaviorImpl
];
Polymer.PaperInputAddonBehavior = {
hostAttributes: { 'add-on': '' },
attached: function () {
this.fire('addon-attached');
},
update: function (state) {
}
};
Polymer({
is: 'paper-input-char-counter',
behaviors: [Polymer.PaperInputAddonBehavior],
properties: {
_charCounterStr: {
type: String,
value: '0'
}
},
update: function (state) {
if (!state.inputElement) {
return;
}
state.value = state.value || '';
var counter = state.value.toString().length.toString();
if (state.inputElement.hasAttribute('maxlength')) {
counter += '/' + state.inputElement.getAttribute('maxlength');
}
this._charCounterStr = counter;
}
});
Polymer({
is: 'paper-input-container',
properties: {
noLabelFloat: {
type: Boolean,
value: false
},
alwaysFloatLabel: {
type: Boolean,
value: false
},
attrForValue: {
type: String,
value: 'bind-value'
},
autoValidate: {
type: Boolean,
value: false
},
invalid: {
observer: '_invalidChanged',
type: Boolean,
value: false
},
focused: {
readOnly: true,
type: Boolean,
value: false,
notify: true
},
_addons: { type: Array },
_inputHasContent: {
type: Boolean,
value: false
},
_inputSelector: {
type: String,
value: 'input,textarea,.paper-input-input'
},
_boundOnFocus: {
type: Function,
value: function () {
return this._onFocus.bind(this);
}
},
_boundOnBlur: {
type: Function,
value: function () {
return this._onBlur.bind(this);
}
},
_boundOnInput: {
type: Function,
value: function () {
return this._onInput.bind(this);
}
},
_boundValueChanged: {
type: Function,
value: function () {
return this._onValueChanged.bind(this);
}
}
},
listeners: {
'addon-attached': '_onAddonAttached',
'iron-input-validate': '_onIronInputValidate'
},
get _valueChangedEvent() {
return this.attrForValue + '-changed';
},
get _propertyForValue() {
return Polymer.CaseMap.dashToCamelCase(this.attrForValue);
},
get _inputElement() {
return Polymer.dom(this).querySelector(this._inputSelector);
},
get _inputElementValue() {
return this._inputElement[this._propertyForValue] || this._inputElement.value;
},
ready: function () {
if (!this._addons) {
this._addons = [];
}
this.addEventListener('focus', this._boundOnFocus, true);
this.addEventListener('blur', this._boundOnBlur, true);
},
attached: function () {
if (this.attrForValue) {
this._inputElement.addEventListener(this._valueChangedEvent, this._boundValueChanged);
} else {
this.addEventListener('input', this._onInput);
}
if (this._inputElementValue != '') {
this._handleValueAndAutoValidate(this._inputElement);
} else {
this._handleValue(this._inputElement);
}
},
_onAddonAttached: function (event) {
if (!this._addons) {
this._addons = [];
}
var target = event.target;
if (this._addons.indexOf(target) === -1) {
this._addons.push(target);
if (this.isAttached) {
this._handleValue(this._inputElement);
}
}
},
_onFocus: function () {
this._setFocused(true);
},
_onBlur: function () {
this._setFocused(false);
this._handleValueAndAutoValidate(this._inputElement);
},
_onInput: function (event) {
this._handleValueAndAutoValidate(event.target);
},
_onValueChanged: function (event) {
this._handleValueAndAutoValidate(event.target);
},
_handleValue: function (inputElement) {
var value = this._inputElementValue;
if (value || value === 0 || inputElement.type === 'number' && !inputElement.checkValidity()) {
this._inputHasContent = true;
} else {
this._inputHasContent = false;
}
this.updateAddons({
inputElement: inputElement,
value: value,
invalid: this.invalid
});
},
_handleValueAndAutoValidate: function (inputElement) {
if (this.autoValidate) {
var valid;
if (inputElement.validate) {
valid = inputElement.validate(this._inputElementValue);
} else {
valid = inputElement.checkValidity();
}
this.invalid = !valid;
}
this._handleValue(inputElement);
},
_onIronInputValidate: function (event) {
this.invalid = this._inputElement.invalid;
},
_invalidChanged: function () {
if (this._addons) {
this.updateAddons({ invalid: this.invalid });
}
},
updateAddons: function (state) {
for (var addon, index = 0; addon = this._addons[index]; index++) {
addon.update(state);
}
},
_computeInputContentClass: function (noLabelFloat, alwaysFloatLabel, focused, invalid, _inputHasContent) {
var cls = 'input-content';
if (!noLabelFloat) {
var label = this.querySelector('label');
if (alwaysFloatLabel || _inputHasContent) {
cls += ' label-is-floating';
this.$.labelAndInputContainer.style.position = 'static';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' label-is-highlighted';
}
} else {
if (label) {
this.$.labelAndInputContainer.style.position = 'relative';
}
if (invalid) {
cls += ' is-invalid';
}
}
} else {
if (_inputHasContent) {
cls += ' label-is-hidden';
}
if (invalid) {
cls += ' is-invalid';
}
}
if (focused) {
cls += ' focused';
}
return cls;
},
_computeUnderlineClass: function (focused, invalid) {
var cls = 'underline';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' is-highlighted';
}
return cls;
},
_computeAddOnContentClass: function (focused, invalid) {
var cls = 'add-on-content';
if (invalid) {
cls += ' is-invalid';
} else if (focused) {
cls += ' is-highlighted';
}
return cls;
}
});
Polymer({
is: 'paper-input-error',
behaviors: [Polymer.PaperInputAddonBehavior],
properties: {
invalid: {
readOnly: true,
reflectToAttribute: true,
type: Boolean
}
},
update: function (state) {
this._setInvalid(state.invalid);
}
});
Polymer({
is: 'paper-input',
behaviors: [
Polymer.IronFormElementBehavior,
Polymer.PaperInputBehavior
]
});
Polymer({
is: 'input-header',
properties: {
label: {
type: String,
notify: true
}
}
});
Polymer({
is: 'chat-thread-view',
properties: {
thread: Object,
user: Object
},
observers: ['_updateLastReadMessage(thread.id, thread.messages.length, user)'],
_updateLastReadMessage: function (id, length, user) {
this.set([
'user.lastReadMessage',
id
], length);
},
_handleInput: function (e) {
if (e.keyCode == 13) {
this.push('thread.messages', {
text: e.target.value,
user: this.user.name
});
this.set('thread.lastMessage', e.target.value);
e.target.value = '';
}
}
});
Polymer({
is: 'chat-view',
properties: {
user: {
value: function () {
return {
name: 'Kevin',
lastReadMessage: {}
};
}
}
}
});