/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file is responsible for statistics processing.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/* ---
running analysis
--- */
function analyze() {

	// check data
	if (_data.length < 1) {
		alert(_text.loadCorpus[_language]);
		return;
	}

	// parameters
	var info = getAnalyzePara();
	if (!info) {
		alert(_text.paraError[_language]);
		return;
	}

	// initialize
	_results[_statID].push({ basicInfo: info });
	displayEmptyResult(info);

	// call python preprocessing
	processNextDoc(0);
}


/* ---
get analysis parameters according to statistics mode
OUTPUT: parameters (error will return false)
--- */
function getAnalyzePara() {

	if (_statID === 'termfreq') return { 
		ngramSize: parseInt($("#term-frequency-ngram-size").val(), 10),
		docRangeUserSet: parseDocRangeUserSet('#term-frequency-document-range-input'), 
		docRangeUserSetStr: $('#term-frequency-document-range-input').val().trim(),
		doRemoveStopwords: $('#term-frequency-remove-stopwords')[0].checked, 
		doUseLemmatization: $('#term-frequency-use-lemmatization')[0].checked,
		rankSize: 100
	};

	else if (_statID === 'termlist') return { 
		docRangeUserSet: parseDocRangeUserSet('#term-list-document-range-input'), 
		docRangeUserSetStr: $('#term-list-document-range-input').val().trim(),
		doUseLemmatization: $('#term-list-use-lemmatization')[0].checked,
		rankSize: -1
	};

	else if (_statID === 'tag') return { 
		docRangeUserSet: parseDocRangeUserSet('#tag-document-range-input'), 
		docRangeUserSetStr: $('#tag-document-range-input').val().trim(),
		tagUserSet: pickItemUserSet('taglist'),
		rankSize: -1
	};

	return false;
}


/* ---
get document range
INPUT: string, jquery selector
OUTPUT: array, selected pages
--- */
function parseDocRangeUserSet($selector) {
	var docRangeUserSet = [];
	var docRangeSource = $($selector).val().trim().split(',');

	// default: total docs
	if (docRangeSource.length === 1 && docRangeSource[0] == '') docRangeSource = ['1-' + _data.length.toString()];

	// parse
	for (let i = 0; i < docRangeSource.length; i++) {
		let regExp = /^[0-9]*$/;

		// just number
		if (regExp.test(docRangeSource[i])) {
			let docNumber = parseInt(docRangeSource[i], 10);
			if (1 <= docNumber && docNumber <= _data.length) {	// in the real limit range
				if (docRangeUserSet.indexOf(docNumber) < 0) docRangeUserSet.push(docNumber - 1);
			}

		// maybe like "1-10", "2-5", etc
		} else {
			let docNumbers = docRangeSource[i].split('-');
			if (docNumbers.length !== 2) {
				alert(_text.docRangeErrorDash[_language] + ' (' + (i+1).toString() + ')');
				continue;
			}

			// doc number string to int and default value, like "1-10", "1-", "-10"
			docNumbers[0] = (docNumbers[0] === '') ?1 :parseInt(docNumbers[0], 10);
			docNumbers[0] = (docNumbers[0] < 1) ?1 :docNumbers[0];
			docNumbers[1] = (docNumbers[1] === '') ?_data.length :parseInt(docNumbers[1], 10);
			docNumbers[1] = (docNumbers[1] > _data.length) ?_data.length :docNumbers[1];

			// for example, "10-1" does not make sense
			if (docNumbers[0] > docNumbers[1]) {
				alert(_text.docRangeErrorNum[_language] + ' (' + (i+1).toString() + ')');
				continue;
			}

			for (let j = docNumbers[0]; j <= docNumbers[1]; j++) {
				if (docRangeUserSet.indexOf(j) < 0) docRangeUserSet.push(j - 1);
			}
		}
	}

	return docRangeUserSet;
}


/* ---
running analysis for one document
INPUT: int, ith doc (docID)
--- */
function processNextDoc($i) {
	console.log('process - ' + $i.toString());
	
	// parameter
	var info = _results[_statID][_blockID].basicInfo;
	var ngramSize = info.ngramSize;
	var docRangeUserSet = info.docRangeUserSet;
	var doRemoveStopwords = info.doRemoveStopwords;
	var doUseLemmatization = info.doUseLemmatization;
	var tagUserSet = info.tagUserSet;

	// finish
	if ($i === docRangeUserSet.length) {
		summary();

		// display reault block
		displayResult();
		if (_statID === 'termfreq') displayRank();

	// process ith doc
	} else {

		// tag statistic
		if (_statID === 'tag') {
			let data = _data[docRangeUserSet[$i]].tag;
			stats(data, info, $i);

		// term statistic
		} else if (_statID === 'termfreq' || _statID === 'termlist') {
			let docID = docRangeUserSet[$i];
			let data;

			// wait for data
			if (!_data[docID].hasOwnProperty('tokens')) {
				if (!docInWorker(docID)) workers[docID % 10].postMessage({ text: _data[docID].fulltext, docID: docID });
				setTimeout(function() {
					processNextDoc($i);
				}, 1000);

			// call statistic functions
			} else {
				if (doUseLemmatization) data = _data[docID].lemmatokens;
				else data = _data[docID].tokens;
				stats(data, info, $i);
			}

			/*/ call python process
			$.ajax({
				url: 'http://127.0.0.1:5000/preprocess/',
				type: 'GET',
				data: { 'lemmatize': doUseLemmatization, 'content': _data[docRangeUserSet[$i]].fulltext }
			})
			.done(function($data) {		// success: call statistic functions
				let jsonData = JSON.parse($data);
				if (_statID === 'termfreq') nGram(jsonData, ngramSize, doRemoveStopwords, $i);
				else if (_statID === 'termlist') termStat(jsonData, $i);
				updateProgress($i, docRangeUserSet.length);
				processNextDoc($i + 1);
			})
			.fail(function($data) {		// fail: error msg
				alert(_text.backendError[_language] + ' (' + ($i+1).toString() + ')');
			});*/

		// error
		} else alert(_text.modeIDError[_language]);
	}
}


// * * * * * * * * * * * * * * * * statistics * * * * * * * * * * * * * * * * *


/* ---
call statistic worker
INPUT: 1) object, structured input string
	   2) object, analysis information
	   3) int, ith doc
--- */
function stats($data, $info, $i) {
	let statsWorker = new Worker('js/worker-stats.js');
	statsWorker.postMessage({ statID: _statID, info: $info, data: $data, stopwords: _stopwords, termlist: _termlist });
	statsWorker.addEventListener('message', function($event) {
		_results[_statID][_blockID]['doc' + $i.toString()] = $event.data;
		updateProgress($i, $info.docRangeUserSet.length);
		processNextDoc($i + 1);
	}, false);
}


/* ---
sum up all selected documents' results, and save result in global variable
--- */
function summary() {
	var summary = {}, sorted = [];
	var resultsObj = _results[_statID][_blockID];
	var docNum = resultsObj.basicInfo.docRangeUserSet.length;
	var rank = _results[_statID][_blockID].basicInfo.rankSize;

	// each doc result
	for (let i = 0; i < docNum; i++) {
		let docResult = resultsObj['doc' + i.toString()];

		// add all text freq
		$.each(docResult, function (text, freq) {
			let key = (_statID === 'tag') ?text.split('-')[0] :text;
			if (summary.hasOwnProperty(key)) summary[key] += freq;
			else summary[key] = freq;
		});
	}

	// sort by freq
	$.each(summary, function (text, freq) {
		sorted.push({ 'text': text, 'freq': freq });
	});

	sorted.sort(function(a, b){
		return b.freq - a.freq;
	});

	// log
	_results[_statID][_blockID]['summary'] = summary;
	_results[_statID][_blockID]['sorted'] = sorted;
	_results[_statID][_blockID].basicInfo.rankSize = (rank > sorted.length) ?sorted.length :rank;
}


