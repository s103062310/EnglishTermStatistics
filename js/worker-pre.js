/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
This file defined worker scripts (running in multi-thread)
for nlp preprocessing.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// imclude nlp module
self.importScripts('https://unpkg.com/compromise@13.11.4/builds/compromise.js');


/* ---
receive message from page
--- */
self.addEventListener('message', function($event) {
	var data = $event.data;
	[tokens, lemmatokens] = tokenize(data.text);
	self.postMessage({ docID: data.docID, tokens: tokens, lemmatokens: lemmatokens });
}, false);


/* ---
process input text into normalized tokens
INPUT: string, pure text
OUTPUT: 1) normal tokens
		2) tokens with lemmatization
--- */
function tokenize($text) {
	var tokens = [], lemmatokens = [];
	var doc = nlp($text);
	var sentences = doc.sentences().json();
	//console.log(sentences)

	// each sentence in semantic
	sentences.forEach(obj => {
		let sentence = obj.text.replace(/[.]/g, '');	// clear .
		let subsentences = sentence.split(/[,?!:;()\[\]"]/);

		// sub sentence (smallest unit for n-gram calculation)
		subsentences.forEach(value => {
			let subsentence = value.trim();
			if (subsentence === '') return;

			// normalize word
			let normsentence = normalize(subsentence);

			// lemmatization
			let lemmasubsentence = lemmatize(normsentence);

			// fin
			tokens.push(normsentence.split(' '));
			lemmatokens.push(lemmasubsentence.split(' '));
		});
	});

	//console.log(tokens);
	//console.log(lemmatokens);
	return [tokens, lemmatokens];
}


/* ---
normalization the input text (not clear may cause lemmatization regexp error)
INPUT: string, sentence text
OUTPUT: string, text after normalization
--- */
function normalize($text) {
	var wordArr = [], word;
	words = $text.split(/[\s]/g);
	words.forEach(w => {
		word = w.replace(/^'/, '').replace(/'$/, '');	// clear 'xxx'
		word = word.replace(/\*/g, '');					// clear *
		if (word !== '') wordArr.push(word);
	});
	return wordArr.join(' ');
}


/* ---
lemmatization for a sentence (use replace to prevent library's errors)
INPUT: string, sentence text
OUTPUT: string, text after lemmatization
--- */
function lemmatize($text) {
	var text = $text;
	var doc = nlp($text);
	var verbs = doc.verbs().json();
	var nouns = doc.nouns().json();
	var nouns_ori = doc.nouns().toSingular().json();

	// verb
	verbs.forEach(obj => {
		let now = obj.text;
		let to = obj.conjugations.Infinitive;

		// do not change
		if (now === to) return;
		if (now === '') return;		// e.g. there's will cause one empty entry
		if (now.indexOf("'") >= 0) return;	// e.g. didn't => not didn't

		// replace
		let re = new RegExp(now, 'g');
		text = text.replace(re, to);
	});

	// noun
	nouns.forEach((obj, i) => {
		let now = obj.text;
		let to = nouns_ori[i].text;

		// do not change
		if (now === to) return;

		// replace
		let re = new RegExp(now, 'g');
		text = text.replace(re, to);
	});

	return text;
}
