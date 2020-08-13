/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file's functions:
1. defined all used global variables.
2. initialization of the program.
3. other small tools.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// * * * * * * * * * * * * * * * * variables * * * * * * * * * * * * * * * * *


// docusky
var _docuSkyObj = null;			// global variable for accessing widget
var _allDocList = [];			// all doc list in database

// data
var _data = [];
var _results = {
	'termfreq': [],
	'termlist': [],
	'tag': []
}

// json info
var _language = 'zh';
var _text;
var _metaSky2Spec;

// target
var _corpusName = "";
var _statID = "";
var _blockID = 0;

// stat tool
var _stopwords = [];
var _termlist = [];
var _taglist = [];
var _metadatalist = [];


// * * * * * * * * * * * * * * * * initialization * * * * * * * * * * * * * * * * *


/* ---
trigger initialization until finishing initialization when file is ready
--- */
$(document).ready(function() {
	setInterval(setDocuSkyObj, 1000);

	$.getJSON('json/text.json', function($result) {
		_text = $result;
		_text[true] = { "zh": "是", "en": "Yes" };
		_text[false] = { "zh": "否", "en": "No" };
	});

	// metadata information
	$.getJSON('json/meta.json', function($result) {
		_metaSky2Spec = $result['sky2meta'];
	});

	// stopwords list is from NTLK (natural language tool kit)
	$.getJSON('json/stopwords.json', function($result) {	
		_stopwords = $result;
	});

	// language choose - default chinese
	var url = new URL(window.location.href);
	if (url.searchParams.has('language')) {
		_language = url.searchParams.get('language');
		display();
	}
});


/* ---
initialization, get _docuSkyObj
--- */
function setDocuSkyObj() {

	if (docuskyGetDbCorpusDocumentsSimpleUI === null) {
		alert(_text.widgetNotReady[_language]);
	} else if (_docuSkyObj === null) {
		_docuSkyObj = docuskyGetDbCorpusDocumentsSimpleUI;
		//console.log(_docuSkyObj);
	}

	clearInterval(setDocuSkyObj);
}


// * * * * * * * * * * * * * * * * other small tools * * * * * * * * * * * * * * * * *


/* ---
toggle button, btn-outline-info represents NO, btn-info represents YES
INPUT: clicked html obj
--- */
function toggleBtn($this) {
	var type = $($this).attr('class');
	if (type === 'btn btn-outline-info') $($this).attr('class', 'btn btn-info');
	else if (type === 'btn btn-info') $($this).attr('class', 'btn btn-outline-info');
}


/* ---
select YES toggle buttons in specific area
INPUT: picked area id
--- */
function pickItemUserSet($id) {
	var list = [];
	var items = $('#' + $id + ' button');
	$.each(items, function(index, object) {
		if ($(items[index]).attr('class') === 'btn btn-info') list.push(items[index].innerText);
	})
	return list;
}


/* ---
pick top $num term in $table to a list
INPUT: 1) object, sorted (by frequency) table
	   2) int, pick top X
--- */
function getTermList($table, $num) {
	var list = [];
	for (let i = 0; i < $num; i++) list.push($table[i].text);
	return list;
}


/* ---
convert array to string (split by \n)
INPUT: array
--- */
function array2string($arr) {
	var str = "";
	$arr.forEach(item => {
		str += item + '\n';
	});
	return str;
}


/* ---
convert string to array (split by \n)
INPUT: string
--- */
function string2array($str) {
	var newArr = []
	var arr = $str.trim().split('\n');
	$.each(arr, function(index, value) {
		let item = value.trim().toLowerCase();
		if (item !== '') newArr.push(item);
	});
	return newArr;
}

