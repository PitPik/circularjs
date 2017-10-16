!(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else if (typeof define === 'function' && define.amd) {
		define('data.srv', [], function (root) {
				return factory(root);
			});
	} else {
		root.dataService = factory(root);
	}
}(this, function(window) {
	'use strict';

	function xmlToJson(xml) {
		var obj = {};
		var _undefined = "undefined";

		if (xml.nodeType === 1) { // element
			if (xml.attributes.length > 0) { // do attributes
				for (var i = 0; i < xml.attributes.length; i++) {
					var attribute = xml.attributes.item(i);

					obj[attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType === 3) { // text
			obj = xml.nodeValue;
		}

		if (xml.hasChildNodes()) { // do children
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var isText = item.nodeType === 3;
				var nodeName = isText ? 'value' : item.nodeName;
				var isSingle = xml.childNodes.length === 1;
				var hasSiblings = Object.keys(obj).length;

				if (isSingle && isText && !hasSiblings) {
					obj = xmlToJson(item);
				} else if (isText && +item.textContent === 0) {
					continue; // remove empty text string
				} else if (typeof obj[nodeName] === _undefined) {
					obj[nodeName] = xmlToJson(item);
				} else {
					if (typeof obj[nodeName].push === _undefined) {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(xmlToJson(item));
				}
			}
		}

		if (obj.type !== undefined && Object.keys(obj).length <= 2) {
			obj = restoreType(obj.value !== undefined ? obj.value : '', obj.type);
		}


		return obj;
	}

	function restoreType(value, type) {
		return type === 'boolean' ? value === 'true' :
			type === 'double' ? +value : value;
	}

	/**
	 * Special data processor for BB typical data structure
	 * make array out of single Object
	 * convert properties.property and tags.tag to properties and tags
	 */
	function processXHRData(data) {
		var newData = [];

		for (var item in data) {
			if (data[item].constructor === Array) {
				for (var n = data[item].length; n--; ) {
					data[item][n].type = item;
					newData.push(data[item][n]);
				}
			} else if (typeof data[item] !== 'string') {
				data[item].type = item;
				newData.push(data[item]);
			}

		}
		for (var n = newData.length; n--; ) {
			if (newData[n].properties) {
				var properties = newData[n].properties.property || [];

				properties = properties.constructor === Array ?
					properties : [properties];
				newData[n].properties = properties;
			}
			if (newData[n].tags) {
				var tags = newData[n].tags.tag || []; // TODO: see if array

				tags = tags.constructor === Array ? tags : [tags];
				newData[n].tags = tags;
			}

			if (newData[n].childNodes) { // TODO: see if this works...
				processXHRData(newData[n].childNodes);
			}
		}

		return newData;
	}

	return {
		xmlToJson: xmlToJson,
		processXHRData: processXHRData
	}

}));