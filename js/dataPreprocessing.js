/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file defined the functions that preprocessing the data from
original files to this system's data structure.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/* ---
parse data (docInfo) from docusky
--- */
function parseDocInfo() {

	// parse every document
	for (let i = 0; i < _allDocList.length; i++) {
		let allMeta = parseDocuMetadata(_allDocList[i].docInfo);
		let uniformedXML = uniformXML(_allDocList[i].docInfo.docContentXml);
		saveData2tool(allMeta, uniformedXML);
	}

	// console.log(_data);
}


/* ---
parse full xml string
INPUT: string, xml data
--- */
function parseXML($xml) {
	var docs = $xml.split('<document ');

	// parse every document
	for (let i = 1; i < docs.length; i++) {
		let content = docs[i].split('<doc_content>');
		let allMeta = parseXMLMetadata(content[0]);
		let uniformedXML = uniformXML(content[1].split('</doc_content>')[0]);
		saveData2tool(allMeta, uniformedXML);
	}

	// console.log(_data);
}


/* ---
parse full txt string (only doc_content in xml)
INPUT: 1) string, TXT data
	   2) string, TXT filename
--- */
function parseTXT($text, $filename) {
	let allMeta = { 'corpus': _corpusName, 'filename': $filename };
	let uniformedXML = uniformXML($text);
	saveData2tool(allMeta, uniformedXML);
}


/* ---
save document data to global variable
INPUT: 1) object, metadata
	   2) string, xml
--- */
function saveData2tool($allMeta, $uniformedXML) {
	var docID = _data.length;
	var wID = docID % 10;
	var tag = extractAllTag($uniformedXML);
	var pureText = clearAllTag($uniformedXML);

	// save
	saveList2tool($allMeta, _metadatalist);
	saveList2tool(tag, _taglist);
	_data.push({ 'metadata': $allMeta, 'fulltext': pureText, 'tag': tag });

	// call worker
	workers[wID].postMessage({ text: pureText, docID: docID });
	wManager[wID].push(docID);
}

/* ---
save list data to global variable (only save key of object to global array)
INPUT: 1) object, saved data
	   2) array, global variable
--- */
function saveList2tool($data, $container) {
	$.each($data, function(key) {
		if ($container.indexOf(key) < 0) $container.push(key);
	});
}


// * * * * * * * * * * * * * * * * metadata processing * * * * * * * * * * * * * * * * *


/* ---
extract metadata from document information to a list
INPUT: Object, document information from DocuSky
OUTPUT: array, all metadata, [for align, for system]
--- */
function parseDocuMetadata($docuInfo) {
	var parsed_meta = {};
	var skipData = ['docId', 'docTimeCreated', 'docXmlFormatSubname', 'xmlFormatName', 'srcFilename', 'docContentXml', 'docAttachmentType', 'doc_content', 'docAttachmentList'];

	// for each data
	for (let item in $docuInfo) {

		// skip
		if (skipData.indexOf(item) >= 0) continue;
		if (item.indexOf('Order') >= 0) continue;

		// metadata
		let meta = (item in _metaSky2Spec) ?_metaSky2Spec[item] :item;
		if (item === 'docTitleXml') parsed_meta[meta] = $docuInfo[item].substring(10, $docuInfo[item].length - 11);
		else if (item === 'docMetadataXml') Object.assign(parsed_meta, parseUdefMetadata($docuInfo[item]));
		else if (typeof $docuInfo[item] === 'object') Object.assign(parsed_meta, parseObjMetadata($docuInfo[item]));
		else parsed_meta[meta] = $docuInfo[item];
	}

	return parsed_meta;
}


/* ---
extract user defined metadata from document information
INPUT: string, user defined metadata tags
OUTPUT: array, all user defined metadata
--- */
function parseUdefMetadata($content) {

	// filter xml text
	var i = 0;
	var metadataList = {};
	var content = $content.substring(13, $content.length - 14);

	while (1) {
		let tagStartPos = content.indexOf('<', i);

		// no more metadata
		if (tagStartPos === -1) {
			break;

		// extract metadata
		} else {
			let tagEndPos = content.indexOf('>', tagStartPos);
			let tagName = content.substring(tagStartPos + 1, tagEndPos).trim();
			let valueEndPos = content.indexOf('/' + tagName, tagEndPos);
			let value = content.substring(tagEndPos + 1, valueEndPos - 1).trim();
			metadataList['Udef_' + tagName] = value;
			i = valueEndPos;
			// console.log(tagName, value, i);
		}
	}

	// console.log(metadataList);

	return metadataList;
}


/* ---
extract metadata in object format from document information
INPUT: object, small part of metadata list
OUTPUT: array, all metadata in object
--- */
function parseObjMetadata($content) {
	var metadataList = {};
	var skipData = ['timeseqNumber', 'timeseqType'];

	for (let item in $content) {
		if (skipData.indexOf(item) >= 0) continue;
		metadataList[_metaSky2Spec[item]] = $content[item];
	}

	return metadataList;
}


/* ---
parse document's metadata
INPUT: string, metadata in xml format
OUTPUT: object, metadata list
--- */
function parseXMLMetadata($xml) {
	var s = 0, e = 0;
	var metadataList = {};

	// get filename
	s = $xml.indexOf('"', e);
	e = $xml.indexOf('"', s + 1);
	metadataList['filename'] = $xml.substring(s + 1, e);

	s = e;
	while (true) {

		// get metadata name
		s = $xml.indexOf('<', s + 1);
		if (s < 0) break;
		e = $xml.indexOf('>', s + 1);
		let tag = $xml.substring(s + 1, e).trim();

		// single tag
		if (tag[tag.length-1] === '/') continue;

		// get metadata value
		s = $xml.indexOf('</' + tag + '>');
		let value = $xml.substring(e + 1, s).trim();
		if (tag === 'xml_metadata') Object.assign(metadataList, parseXMLUdefMetadata(value));
		else metadataList[tag] = value;
	}

	return metadataList;
}


/* ---
parse document's metadata
INPUT: string, xml_metadata
OUTPUT: object, metadata list
--- */
function parseXMLUdefMetadata($xml) {
	var s = 0, e = -1;
	var metadataList = {};

	while (true) {

		// get metadata name
		s = $xml.indexOf('<', e + 1);
		if (s < 0) break;
		e = $xml.indexOf('>', s + 1);
		let tag = $xml.substring(s + 1, e).trim();

		// get metadata value
		s = $xml.indexOf('</' + tag + '>');
		let value = $xml.substring(e + 1, s).trim();

		// metadata with link
		if (value.indexOf('<a ') >= 0) {
			let st = value.indexOf('>');
			let en = value.indexOf('<', st);
			value = value.substring(st + 1, en).trim();
		}

		metadataList[tag] = value;
	}

	return metadataList;
}


// * * * * * * * * * * * * * * * * doc_content processing * * * * * * * * * * * * * * * * *


/* ---
clear all <> tag in xml string
INPUT: string, xml data
OUTPUT: string, uniformed xml data
--- */
function uniformXML($xml) {
	var result = clearEmptyLine($xml);
	result = pickDocContent(result);
	result = uniformChar(result);
	return result;
}


/* ---
remove redundant \n in string
INPUT: string has multiple \n at the same time
OUTPUT: string has single \n at one time
--- */
function clearEmptyLine($text) {
	var lines = $text.split('\n');
	var arr = [];
	lines.forEach(item => {
		if (item) arr.push(item);
	});
	var text = arr.join('\n');
	return text;
}


/* ---
pick pure doc_content, remove metatags, comments, and events
INPUT: string, xml in doc_content
OUTPUT: string, pure doc_content
--- */
function pickDocContent($xml) {

	// detect tags
	var index = [];
	index.push($xml.indexOf('<MetaTags'));
	index.push($xml.indexOf('<Comments'));
	index.push($xml.indexOf('<Events'));

	// only doc_content
	if (index.reduce((a, b) => a + b, 0) === -3) return $xml;

	// pick doc_content
	var i = index.reduce(function(prev, element) {
		if (element !== -1 && element < prev) return element;
		else return prev;
	}, 10 ** 10);

	return $xml.substring(0, i);
}


/* ---
remove all <...> tag in xml string
INPUT: string, doc_content string
OUTPUT: string, with out tags
--- */
function clearAllTag($xml) {
	return $xml.replace(/<[\w\W]*?>/g, '');
}


/* ---
convert special char to normal char
INPUT: string, origin text
OUTPUT: string, uniform text
--- */
function uniformChar($text) {
	var text = $text.replace(/&amp;/g, '&');
	text = text.replace(/[“”]/g, '\"');
	text = text.replace(/[’]/g, '\'');
	text = text.replace(/[\s]{1,}/g, ' ');
	return text;
}


/* ---
extract all tag information
INPUT: string, doc_content string
OUTPUT: object, tag information
--- */
function extractAllTag($xml) {
	var s = 0, e = 0;
	var tag = {};
	var skipTags = ['Section', 'Content', 'Paragraph', 'Comment', 'CommentItem', 'span', 'AlignBegin', 'AlignEnd'];

	while (true) {

		// tag position
		s = $xml.indexOf('<', e);
		if (s < 0) break;
		e = $xml.indexOf('>', s);

		// parse tag
		let tagstr = $xml.substring(s + 1, e).trim();
		let tagname = tagstr.split(' ')[0];
		//console.log(s, e, tagstr);

		// skip tags
		if (tagstr[tagstr.length-1] === '/') continue;
		if (skipTags.indexOf(tagname) >= 0) continue;
		if (tagname[0] === '/' || tagname[0] === '!') continue;

		// add a new tag
		if (!tag.hasOwnProperty(tagname)) tag[tagname] = {};

		// parse tag value
		s = $xml.indexOf('/' + tagname, e);
		let tagvalue = $xml.substring(e + 1, s - 1).trim();
		//console.log(e, s, tagvalue);
		e = s;

		// count
		if (tag[tagname].hasOwnProperty(tagvalue)) tag[tagname][tagvalue] += 1;
		else tag[tagname][tagvalue] = 1;
	}

	return tag;
}


