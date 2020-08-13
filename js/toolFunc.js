/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file is responsible for common functions of statistics 
tool. (setting, viewing, downloading)
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$('#language-button').click(function() {
	var lan = this.innerText;
	if (lan === '中文') _language = 'zh';
	else if (lan === 'English') _language = 'en';
	display();
});


/* ---
switch between different statistics tools
INPUT: 1) clicked html obj
	   2) string, switched tool id
--- */
function switchTool($this, $id) {

	// skip current tab
	if ($($this).attr('class') === 'target') return;

	// switch
	$('.target').removeClass('target');
	$('#' + $id).addClass('target');
	$($this).addClass('target');
}


// * * * * * * * * * * * * * * * * setting * * * * * * * * * * * * * * * * *


/* ---
termfreq - edit stopwords button
--- */
$('#term-frequency-edit-stopwords').click(function() {
	var htmlCode = array2string(_stopwords);
	$('#modal-stopwords-textarea').val(htmlCode);
});


/* ---
termfreq - save stopwords button (in modal)
--- */
$('#modal-stopwords-save').click(function() {
	var htmlCode = $('#modal-stopwords-textarea').val();
	_stopwords = string2array(htmlCode);
});


/* ---
termfreq - run button
--- */
$('#term-frequency-run-button').click(function() {
	_statID = 'termfreq';
	_blockID = _results.termfreq.length;
	analyze();
});


/* ---
term list - edit term list button
--- */
$('#term-list-edit-button').click(function() {
	var htmlCode = array2string(_termlist);
	$('#modal-termlist-textarea').val(htmlCode);
});


/* ---
term list - save term list button (in modal)
--- */
$('#modal-termlist-save').click(function() {
	var htmlCode = $('#modal-termlist-textarea').val();
	_termlist = string2array(htmlCode);
});


/* ---
term list - clear term list button (in modal)
--- */
$('#modal-termlist-clear').click(function() {
	$('#modal-termlist-textarea').val('');
});


/* ---
term list - run button
--- */
$('#term-list-run-button').click(function() {
	_statID = 'termlist';
	_blockID = _results.termlist.length;

	// check setting
	if (_termlist.length <= 0) {
		alert(_text.setTermList[_language]);
		return;
	}

	analyze();
});


/* ---
tag - run button
--- */
$('#tag-run-button').click(function() {
	_statID = 'tag';
	_blockID = _results.tag.length;

	// check setting
	if (pickItemUserSet('taglist').length <= 0) {
		alert(_text.setTag[_language]);
		return;
	}

	analyze();
});


// * * * * * * * * * * * * * * * * result tool bar * * * * * * * * * * * * * * * * *


/* ---
toggle result's information
INPUT: clicked html obj
--- */
function toggleResultInfo($this) {
	var block = $($this.parentElement.parentElement).find('.block-info');
	var status = $(block).css('display');

	// show
	if (status === 'none') {
		$(block).css('display', 'block');
		$($this).addClass('target');

	// hide
	} else {
		$(block).css('display', 'none');
		$($this).removeClass('target');
	} 
}


/* ---
show result's detail data (csv format)
INPUT: clicked html obj
--- */
function showResultModal($this) {
	var id = $($this.parentElement.parentElement).attr('id');
	_statID = id.split('-')[0];
	_blockID = parseInt(id.split('-')[1]);

	// csv string
	var str = generateResultStr();
	if (str === false) {
		alert(_text.csvStrError[_language]);
		return;
	}

	// show modal
	$('#modal-result-textarea').val(str);
	$('#modal-result-button').click();
}


/* ---
delete result block
INPUT: clicked html obj
--- */
function deleteResult($this) {
	$($this.parentElement.parentElement).remove();
}


/* ---
delete result block
INPUT: clicked html obj
--- */
function refreshResult($this) {
	var id = $($this.parentElement.parentElement.parentElement.parentElement).attr('id');
	_statID = id.split('-')[0];
	_blockID = parseInt(id.split('-')[1]);
	_results[_statID][_blockID].basicInfo.rankSize = $($this.parentElement).find('input').val();
	displayResult();
}


// * * * * * * * * * * * * * * * * result modal * * * * * * * * * * * * * * * * *


/* ---
copy result in csv string format to scrapbook
--- */
$('#modal-result-copy').click(function() {
	document.getElementById('modal-result-textarea').select();
	document.execCommand('copy');
	alert(_text.copied[_language]);
});


/* ---
download result.csv
--- */
$('#modal-result-download').click(function() {
	var fileName = "englishtermstats-download.csv";
	var data = $('#modal-result-textarea').val();
	var blob = new Blob(["\uFEFF" + data], {
		type : 'text/csv;charset=utf-8;'
	});
	var href = URL.createObjectURL(blob);
	var link = document.createElement("a");
	document.body.appendChild(link);
	link.href = href;
	link.download = fileName;
	link.click();
	document.body.removeChild(link);
});


/* ---
use result object to generate csv string
OUTPUT: string, result in csv format
--- */
function generateResultStr() {
	var result = _results[_statID][_blockID];
	var info = result.basicInfo;
	var metadatalist = pickItemUserSet('metadatalist');
	var str = "";

	// header - metadata
	metadatalist.forEach(item => {
		str += `"` + item + `",`;
	});

	// header - term
	if (_statID === 'termfreq' || _statID === 'termlist') str += `"term","frequency"\n`;
	else if (_statID === 'tag') str += `"tag","term","frequency"\n`;
	else return false;

	// each document
	for (let i = 0; i < info.docRangeUserSet.length; i++) {
		let docID = info.docRangeUserSet[i];
		let docData = result['doc' + i.toString()];
		let docMeta = _data[docID].metadata;
		let list = [];

		// get list (if need)
		if (_statID === 'termfreq') list = getTermList(result.sorted, info.rankSize);

		$.each(docData, function (text, freq) {
			let splitText = text.split('-');
			if (_statID === 'termfreq' && list.indexOf(text) < 0) return;
			if (_statID === 'termlist' && freq <= 0) return;

			// metadata
			metadatalist.forEach(item => {
				str += `"` + docMeta[item] + `",`;
			});

			// tag
			if (_statID === 'tag') str += `"` + splitText[1] + `",`;

			// term
			str += `"` + splitText[0] + `","` + freq.toString() + `"\n`;
		});
	}

	return str;
}