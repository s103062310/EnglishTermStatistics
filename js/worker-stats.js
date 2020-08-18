/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file defined worker scripts (running in multi-thread)
for statistics.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


var _stopwords = [];
var _termlist = [];


/* ---
receive message from page
--- */
self.addEventListener('message', function($event) {
	var result;
	var data = $event.data;
	_stopwords = data.stopwords;
	_termlist = data.termlist;
	
	if (data.statID === 'termfreq') result = nGram(data.data, data.info.ngramSize, data.info.doRemoveStopwords);
	else if (data.statID === 'termlist') result = termStat(data.data);
	else if (data.statID === 'tag') result = tagStat(data.data, data.info.tagUserSet);

	self.postMessage(result);
}, false);


/* ---
do n-gram calculation, and save result in global variable
INPUT: 1) object, 2d array, sentance # x word # in a sentance
	   2) int, 'n' gram
	   3) boolean, if use stopwords
--- */
function nGram($data, $n, $stopwords) {
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

	return tmpResult;
}


/* ---
calculating term frequency in list, and save result in global variable
INPUT: object, 2d array, sentance # x word # in a sentance
--- */
function termStat($data) {
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

	return tmpResult;
}


/* ---
calculating tag frequency selected, and save result in global variable
INPUT: 1) object, 2d array, sentance # x word # in a sentance
	   2) array, list of selected tags
--- */
function tagStat($data, $taglist) {
	var tmpResult = {};

	// each sentance
	for (let tagname in $data) {
		if ($taglist.indexOf(tagname) >= 0) {
			for (let text in $data[tagname]) {
				let keyStr = text + '-' + tagname;
				tmpResult[keyStr] = $data[tagname][text];
			}
		}
	}

	return tmpResult;
}
