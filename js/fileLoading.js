/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file defined the functions that used to load files from
computer and DocuSky.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// * * * * * * * * * * * * * * * * DocuSky * * * * * * * * * * * * * * * * *


/* ---
load data from docusky
--- */
$("#getDocuSkyDocs").click(function($event) {
	_docuSkyObj.getDbCorpusDocuments('', '', '', $event, getEntireDbCorpusText);
});


/* ---
success callback function, called when click load button
get all documents in database
--- */
function getEntireDbCorpusText() {

	// get data
	_allDocList = _docuSkyObj.docList;
	let param = {target: _docuSkyObj.target, db: _docuSkyObj.db, corpus: _docuSkyObj.corpus};
	getNextPage(param, processDataFromDocusky);
}


/* ---
if not all documents are loaded, continue to load data
--- */
function  getNextPage(param, callback){
	let totalPages = Math.ceil(_docuSkyObj.totalFound / _docuSkyObj.pageSize);

	// not finished
	if (_docuSkyObj.page < totalPages) {
		param.page = _docuSkyObj.page + 1;
		_docuSkyObj.getQueryResultDocuments(param, null, function() {
			_allDocList = _allDocList.concat(_docuSkyObj.docList);
			getNextPage(param, callback);
		});

	// have loaded all data
	} else {
		if (typeof callback === "function") callback();
	}
}


/* ---
process document list from Docusky
--- */
function processDataFromDocusky() {
	parseDocInfo();
	toolSetting();
}


// * * * * * * * * * * * * * * * * local computer * * * * * * * * * * * * * * * * *


/* ---
define corpus name before loading data (for .TXT)
--- */
$('#modal-corpus-name-send').click(function() {
	_corpusName = $('#modal-corpus-name-input').val() || 'None';
	$('#uploadTXT').click();
});


// listener for loading files
document.getElementById('uploadXML').addEventListener('change', uploadXMLFile, false);
document.getElementById('uploadTXT').addEventListener('change', uploadTXTFile, false);
document.getElementById('uploadTermList').addEventListener('change', uploadTermListFile, false);


/* ---
trigger when user upload XML files by input element
extract uploaded files and update used input by new input
INPUT: event object
--- */
function uploadXMLFile($event) {

	// process for each xml
	var files = $event.target.files;
	for (let i = 0; i < files.length; i++) {
		let reader = new FileReader();
		reader.onload = processDataFromXML();
		reader.readAsText(files[i]);
	}

	// update input
	$('#uploadXML').replaceWith('<input id="uploadXML" type="file" accept=".xml" style="display: none;" multiple>');
	document.getElementById('uploadXML').addEventListener('change', uploadXMLFile, false);
}


/* ---
trigger when user upload TXT files by input element
extract uploaded files and update used input by new input
INPUT: event object
--- */
function uploadTXTFile($event) {

	// process for each txt
	var files = $event.target.files;
	for (let i = 0; i < files.length; i++) {
		let reader = new FileReader();
		reader.onload = processDataFromTXT(files[i].name);
		reader.readAsText(files[i]);
	}

	// update input
	$('#uploadTXT').replaceWith('<input id="uploadTXT" type="file" accept=".txt" style="display: none;" multiple>');
	document.getElementById('uploadTXT').addEventListener('change', uploadTXTFile, false);
}


/* ---
trigger when user upload term list TXT files by input element
extract uploaded files and update used input by new input
INPUT: event object
--- */
function uploadTermListFile($event) {

	// process for each txt
	var files = $event.target.files;
	for (let i = 0; i < files.length; i++) {
		let reader = new FileReader();
		reader.onload = updateTermList(files[i].name);
		reader.readAsText(files[i]);
	}

	// update input
	$('#uploadTermList').replaceWith('<input id="uploadTermList" type="file" accept=".txt" style="display: none;" multiple>');
	document.getElementById('uploadTermList').addEventListener('change', uploadTermListFile, false);

	// open modal
	$('#term-list-edit-button').click();
}


/* ---
process xml file from local computer
--- */
function processDataFromXML() {
	return function($event) {
		parseXML($event.target.result);
		toolSetting();
	}
}


/* ---
process txt file from local computer
INPUT: string, filename
--- */
function processDataFromTXT($filename) {
	return function($event) {
		parseTXT($event.target.result, $filename);
		toolSetting();
	}
}


/* ---
append list to modal textarea
--- */
function updateTermList() {
	return function($event) {
		var htmlCode = $('#modal-termlist-textarea').val() + $event.target.result;
		$('#modal-termlist-textarea').val(htmlCode);
	}
}