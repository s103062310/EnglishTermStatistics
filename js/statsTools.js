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
running analysis for one document
INPUT: int, ith doc (docID)
--- */
function processNextDoc($i) {
	
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
			tagStat(_data[docRangeUserSet[$i]].tag, tagUserSet, $i);
			updateProgress($i, docRangeUserSet.length);
			processNextDoc($i + 1);

		// term statistic
		} else if (_statID === 'termfreq' || _statID === 'termlist') {

			// call python process
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
			});

		// error
		} else alert(_text.modeIDError[_language]);
	}
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


// * * * * * * * * * * * * * * * * statistics * * * * * * * * * * * * * * * * *


/* ---
do n-gram calculation, and save result in global variable
INPUT: 1) object, 2d array, sentance # x word # in a sentance
	   2) int, 'n' gram
	   3) boolean, if use stopwords
	   4) int, ith doc
--- */
function nGram($data, $n, $stopwords, $docID) {
	var tmpResult = {};

	// each sentance
	for (let s = 0; s < $data.length; s++) {
		let sentance = $data[s];
		let ngramWord = [];

		// each word
		for (let w = 0; w < sentance.length; w++) {
			let word = sentance[w].toLowerCase();

			// filter uni-gram stopwords
			if ($stopwords && _stopwords.indexOf(word) >= 0) {
				ngramWord = [];
				continue;
			}

			// filter multi-gram stopwords
			ngramWord.push(word);
			if ($stopwords && _stopwords.indexOf(ngramWord.join(' ')) >= 0) {
				ngramWord = [];
				continue;
			}

			// n-gram
			if (ngramWord.length >= $n) {
				let ngramText = ngramWord.join(' ');
				if (tmpResult.hasOwnProperty(ngramText)) tmpResult[ngramText]++;
				else tmpResult[ngramText] = 1;
				ngramWord.shift();
			}
		}
	}

	_results.termfreq[_blockID]['doc' + $docID.toString()] = tmpResult;
}


/* ---
calculating term frequency in list, and save result in global variable
INPUT: 1) object, 2d array, sentance # x word # in a sentance
	   2) int, ith doc
--- */
function termStat($data, $docID) {
	var tmpResult = {};
	for (let i = 0; i < _termlist.length; i++) tmpResult[_termlist[i]] = 0;

	// each sentance
	for (let s = 0; s < $data.length; s++) {
		let sentance = $data[s].join(' ').toLowerCase();

		// each term
		for (let t = 0; t < _termlist.length; t++) {
			let index = sentance.indexOf(_termlist[t], 0);

			// search sentance until no term
			while (index >= 0) {
				tmpResult[_termlist[t]]++;
				index = sentance.indexOf(_termlist[t], index + 1);
			}
		}
	}

	_results.termlist[_blockID]['doc' + $docID.toString()] = tmpResult;
}


/* ---
calculating tag frequency selected, and save result in global variable
INPUT: 1) object, 2d array, sentance # x word # in a sentance
	   2) array, list of selected tags
	   3) int, ith doc
--- */
function tagStat($data, $taglist, $docID) {
	var tmpResult = {};

	// each sentance
	$.each($data, function(tagname, tagObj) {
		if ($taglist.indexOf(tagname) >= 0) {
			$.each(tagObj, function(text, freq) {
				let keyStr = text + '-' + tagname;
				tmpResult[keyStr] = freq;
			});
		}
	});

	_results.tag[_blockID]['doc' + $docID.toString()] = tmpResult;
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


