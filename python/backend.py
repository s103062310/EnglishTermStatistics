from flask import Flask
from flask import request
from flask_cors import cross_origin
from distutils.util import strtobool
import json
import nlp	# self defined


app = Flask(__name__)


@app.route('/preprocess/')
@cross_origin()
def preprocess():

	# paras
	text = request.args.get('content')
	lemma = strtobool(request.args.get('lemmatize'))

	# nlp process
	sentances = nlp.tokenize(text)
	if lemma: sentances = nlp.lemmatize(sentances)

	return json.dumps(sentances)


if __name__ == '__main__':
	app.run()