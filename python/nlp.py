from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import wordnet
from nltk.stem import WordNetLemmatizer
import nltk


# variables
lemmatizer = WordNetLemmatizer()
sentSplitWords = [',', '.', ':', ';', '!', '?', '(', ')', '[', ']', '"', '“', '”', '...']
filterWords = ['``', '\'\'', '\'', '’', '-', '--', '—']
concatWords = ['\'s', 'n\'t', '\'ve', '\'re', '\'ll', '\'d', '\'m']
posDict = {
	'J': wordnet.ADJ,
	'N': wordnet.NOUN,
	'V': wordnet.VERB,
	'R': wordnet.ADV
}


def tokenize(text):
	sent = []
	sentances = []
	words = word_tokenize(text)

	# split sentances
	for w in words:
		if w in filterWords:
			continue
		elif w in concatWords:
			sent[len(sent)-1] += w
		elif w not in sentSplitWords: 
			sent.append(w)
		elif len(sent) > 0: 
			sentances.append(sent)
			sent = []

	# final sentance
	if len(sent) > 0: sentances.append(sent)
	return sentances


def lemmatize(sentances):
	stem_sentances = []

	# process each sentance
	for sentance in sentances:

		# pos tag
		pos = nltk.pos_tag(sentance)

		# lemmatize sentance
		stem_sentance = []
		for p in pos:
			stem_word = lemmatizer.lemmatize(p[0], getwordnetpos(p[1]))
			stem_sentance.append(stem_word)
		stem_sentances.append(stem_sentance)

	return stem_sentances


def getwordnetpos(pos):
	return posDict.get(pos[0].upper(), wordnet.NOUN)




