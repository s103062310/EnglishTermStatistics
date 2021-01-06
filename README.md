# EnglishTermStatistics
[Develop Weekly Progress](https://hackmd.io/@DocuSky/rkGzbFGGw)

> 2020.08.13 | v.1.0  
> 2020.08.18 | v.1.1 add: purejs nlp & worker  
> 2021.05.19 | v.1.2 fix: update new links  

## CSS Files
1. **main-style.css** => for whole tool architecture and load corpus block
2. **stat-style.css** => for statistics block

## Javascripts Files
1. **globalVar.js** =>
* defined all used global variables.
* initialization of the program.
* other small tools.
2. **fileLoading.js** => defined the functions that used to load files from computer and DocuSky
3. **dataPreProcess.js** => defined the functions that preprocessing the data from original files to this system's data structure.
4. **display.js** => defined the functions that used to display html page (UI display, used javascript to modify html dynamicly).
5. **toolFunc.js** => defined the common functions of statistics tool. (setting, viewing, downloading)
6. **statsTool.js** => defined the functions that is responsible for statistics processing.

## Json Files
1. **meta.json** => information of DocuSky defined metadata
2. **stopwords.json** => stopwords from NLTK
3. **text.json** => text used in tool (chinese, english)

## Python Files
1. **backend.py** => contact with js code through flask
2. **nlp.py** => NLP processing using NLTK