/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file is responsible for UI display, used javascript to 
modify html dynamicly.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/* ---
show page with _language
--- */
function display() {

	// tool title
	$('head title').html(_text.toolName[_language]);
	$('.header h1').html(_text.toolName[_language]);

	// header btn
	$('#explain').html(_text.explain[_language]);
	$('#language').html(_text.language[_language]);

	// load
	$('#load h2').html(_text.load[_language]);
	$('#getDocuSkyDocs').html(_text.loadBtnDocuSky[_language]);
	$('#uploadXMLBtn').html(_text.loadBtnXML[_language]);
	$('#uploadTXTBtn').html(_text.loadBtnTXT[_language]);

	// load-modal
	$('#upload-txt-modal-label').html(_text.corpusName[_language]);
	$('#modal-corpus-name-send').html(_text.send[_language]);

	// metadata
	$('#metadata h2').html(_text.metadata[_language]);

	// stat
	$('#stat h2').html(_text.statistics[_language]);
	$($('.stat-controller span')[0]).html(_text.termfreq[_language]);
	$($('.stat-controller span')[1]).html(_text.termlist[_language]);
	$($('.stat-controller span')[2]).html(_text.tag[_language]);

	// stat-setting-termfreq
	$($('#termfreq .stat-setting-item > span')[0]).html(_text.ngramSize[_language]);
	$($('#termfreq .stat-setting-item > span')[1]).html(_text.stopwords[_language]);
	$($('#termfreq .stat-setting-item > span')[2]).html(_text.docRange[_language]);
	$($('#termfreq .stat-setting-item > span')[3]).html(_text.lemmatization[_language]);
	$('#term-frequency-edit-stopwords').html(_text.editStopwords[_language]);
	$('#stopwords-modal-label').html(_text.stopwordList[_language]);
	$('#stopwords-copyright').html(_text.stopwordsCopyright[_language]);
	$('#modal-stopwords-save').html(_text.save[_language]);
	$('#term-frequency-run-button').html(_text.run[_language]);

	// stat-setting-termlist
	$($('#termlist .stat-setting-item > span')[0]).html(_text.docRange[_language]);
	$($('#termlist .stat-setting-item > span')[1]).html(_text.lemmatization[_language]);
	$($('#termlist .stat-setting-item > span')[2]).html(_text.termlist[_language]);
	$('#term-list-edit-button').html(_text.editTermList[_language]);
	$('#term-list-upload-button').html(_text.uploadTermList[_language]);
	$('#termlist-modal-label').html(_text.termlist[_language]);
	$('#modal-termlist-clear').html(_text.clear[_language]);
	$('#modal-termlist-save').html(_text.save[_language]);
	$('#term-list-run-button').html(_text.run[_language]);

	// stat-setting-tag
	$($('#tag .stat-setting-item > span')[0]).html(_text.docRange[_language]);
	$($('#tag .stat-setting-item > span')[1]).html(_text.tag[_language]);
	$('#tag-run-button').html(_text.run[_language]);

	// result
	$('#result-modal-label').html(_text.result[_language]);
	$('#modal-result-copy').html(_text.copy[_language]);
	$('#modal-result-download').html(_text.downloadCSV[_language]);
}


// * * * * * * * * * * * * * * * * load * * * * * * * * * * * * * * * * *


/* ---
display data and statistics tool after loading finishing
--- */
function toolSetting() {
	paginationSetting();
	$('#metadata').css('display', 'block');
	$('#stat').css('display', 'block');
	displayList(_metadatalist, 'metadatalist');
	displayList(_taglist, 'taglist');
}


/* ---
display loading tool bar of data
--- */
function paginationSetting() {
	$('#corpus-tab-page-list-block').pagination({
		dataSource: _data,
		pageSize: 1,
		showGoInput: true,
		showGoButton: true,
		formatGoInput: 'go to the <%= input %> th document',
		
		callback: function($data, $pagination) {
			$("#corpus-tab-corpus-name").html($data[0].metadata.corpus);
			$("#corpus-tab-current-doc-name").html($data[0].metadata.filename);
			$("#corpus-tab-current-doc-content").html($data[0].fulltext.replace(/\n/g, '<br>'));
		}
	});
}


// * * * * * * * * * * * * * * * * statistic tool * * * * * * * * * * * * * * * * *


/* ---
display list of toggle buttons
INPUT: 1) array, displayed list content
	   2) string, displayed area id
--- */
function displayList($list, $id) {
	var htmlCode = "";
	$list.forEach(item => {
		htmlCode += `<button type="button" class="btn btn-outline-info" onclick="toggleBtn(this)">` + item + `</button>`;
	});
	$('#' + $id).html(htmlCode);
}


/* ---
display result block with out result content
INPUT: object, analysis information
--- */
function displayEmptyResult($info) {
	var info = "";
	
	if (_statID === 'termfreq') {
		info = `<ul>
					<li>` + _text.ngramSize[_language] + `：` + $info.ngramSize.toString() + `</li>
					<li>` + _text.docRange[_language] + `：` + $info.docRangeUserSetStr + `</li>
					<li>` + _text.stopwords[_language] + `：` + _text[$info.doRemoveStopwords][_language] + `</li>
					<li>` + _text.lemmatization[_language] + `：` + _text[$info.doUseLemmatization][_language] + `</li>
				</ul>`;
	
	} else if (_statID === 'termlist') {
		info = `<ul>
					<li>` + _text.docRange[_language] + `：` + $info.docRangeUserSetStr + `</li>
					<li>` + _text.lemmatization[_language] + `：` + _text[$info.doUseLemmatization][_language] + `</li>
				</ul>`;

	} else if (_statID === 'tag') {
		let tags = "";
		$.each($info.tagUserSet, function(index, value) {
			if (index > 0) tags += ", ";
			tags += value;
		});

		info = `<ul>
					<li>` + _text.docRange[_language] + `：` + $info.docRangeUserSetStr + `</li>
					<li>` + _text.tag[_language] + `：` + tags + `</li>
				</ul>`;
	}

	var block = `<div class="result-block" id="` + _statID + `-` + _blockID.toString() + `">
					<div class="block-toolbar">
						<i class="fa fa-info-circle" onclick="toggleResultInfo(this)"></i>
						<i class="fa fa-file-text" onclick="showResultModal(this)"></i>
						<i class="fa fa-trash" onclick="deleteResult(this)"></i>
					</div>
					<div class="block-info">` + info + `</div>
					<table style="table-layout: fixed; line-height: 1;">
						<thead>
							<tr>
								<th scope="col" width="50px">#</th>
								<th scope="col">Term</th>
								<th scope="col" width="80px">Freq</th>
							</tr>
						</thead>
						<tbody>
							<tr></tr><tr></tr>
							<tr><td colspan="3">計算中...</td></tr>
							<tr><td colspan="3">
								<div class="progress" style="margin: 0 5%;">
									<div class="progress-bar progress-bar-striped bg-info" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
								</div>
							</td></tr>
						</tbody>
					</table>
				</div>`;
	
	$('#' + _statID + ' .results').append(block);
}


/* ---
display result content
--- */
function displayResult() {
	var rank = _results[_statID][_blockID].basicInfo.rankSize;
	var data = _results[_statID][_blockID].sorted;
	var body = "";

	// have data
	if (rank !== 0 && data.length > 0)  {
		let freq = (rank > 0) ?data[rank-1].freq :data[data.length-1].freq;
		let i = 0;

		while (i < data.length && data[i].freq >= freq) {
			body += `<tr>
						<th scope="row">` + (i+1).toString() + `</th>
						<td>` + data[i].text + `</td>
						<td>` + data[i].freq + `</td>
					</tr>`;
			i++;
		}
	}

	$('#' + _statID + '-' + _blockID.toString() + ' tbody').html(body);
}


/* ---
display rank # setting
--- */
function displayRank() {
	var rank = _results[_statID][_blockID].basicInfo.rankSize;
	if (rank > 0) {
		let rankInfo = `<li>
							<span>` + _text.rank1[_language] + ` <input type="text" class="form-control" value="` + rank + `" style="margin: 5px;"> ` + _text.rank2[_language] + `</span>
							<button type="button" class="btn btn-info" onclick="refreshResult(this)" style="margin: 5px;">` + _text.refresh[_language] + `</button>
						</li>`;
		$('#' + _statID + '-' + _blockID.toString() + ' .block-info ul').append(rankInfo);
	}
}


/* ---
display result content
INPUT: 1) int, ith doc
	   3) int, total doc num
--- */
function updateProgress($i, $n) {
	var progressBar = $('#' + _statID + '-' + _blockID.toString() + ' .progress-bar');
	var progress = Math.round(($i+1) * 100 / $n).toString();
	$(progressBar).css('width', progress + '%');
	$(progressBar).attr('aria-valuenow', progress);
	$(progressBar).html(progress + '%');
}