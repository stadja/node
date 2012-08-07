var pool = require("./pool");
var RSS_read_Collection = [];
var rssRequests = [];
var FeedParser = require('feedparser');
var idflux_external = [];

function readRss(request, response) {
	
	var idFlux = request.params.rssId;
	console.log('On cherche le flux : '+request.params.rssId+' lastlyRead : '+request.params.lastlyRead);
	if ((request.session.start == undefined) || (request.session.start < 1)) {
		request.session.start = new Date().getTime();
                                pool.getSql().connect(function(error) {
                                        if (error) {
                                                return console.log('CONNECTION error: ' + error);
                                        }

                                        this.query().
                                        select('*').
                                        from('flux').
                                        where('idflux = ?', [ idFlux ]).
                                        order({'created': false}).
                                        execute(function(error, rows, cols) {
                                            if (error) {
                                                    console.log('ERROR: ' + error);
                                                    return;
                                            }
						
											if (rows[0]['external'] != 0) {
												idflux_external[rows[0]['external'].replace(/[^a-zA-Z 0-9]+/g,'')] = idFlux;
											}
                                         });
                                });
	}

	request.params.rssId = idFlux;
	rssRequests.push([request, response]);	

	if (request.params.otherName != undefined) {
		idFlux = request.params.otherName;
	}

	if (RSS_read_Collection[idFlux] == undefined) {
		RSS_read_Collection[idFlux] = [];
		RSS_read_Collection[idFlux]['lastUpdate'] = -1;
	}

	rssReading();

	return;
}

function rssReading() {

	rssRequestsTemp = [];

	while (rssRequests.length) {
		var data = rssRequests.shift();
		var request = data[0];
		var response = data[1];
		var rssid = request.params.rssId;
		
		setTimeout(function(rssid){
				pool.getSql().connect(function(error) {
					if (error) {
						return console.log('CONNECTION error: ' + error);
					}

					this.query().
					select('rss').
					from('flux').
					where('idflux = ?', [ rssid ]).
					order({'created': false}).
					execute(function(error, rows, cols) {  
						if (error) {
							console.log('ERROR: ' + error);
							return;
						}
						
						rssUrl = rows[0]['rss'];
						console.log(rssUrl);
						(new FeedParser()).parseFile(rssUrl, rssCallback);
					});
				})
		}, 500, rssid);	

		setTimeout(askingRSS, 1000, request, response);
	}
}

function rssCallback (error, meta, articles){
	if (error) {
		console.error(error);
	} else {
		articles.sort(article_sort);

		var newLastUpdate = 0;
		if(articles[0] == undefined) {
			return false;
		}
		var newLastUpdate = new Date(articles[0].date).getTime();
		
                idflux = (meta.title).replace(/[^a-zA-Z 0-9]+/g,'');
                if (idflux_external[idflux] != undefined) {
	                idflux = idflux_external[idflux];
                }
		if (RSS_read_Collection[idflux]['lastUpdate'] < newLastUpdate) {
			RSS_read_Collection[idflux]['lastUpdate'] = newLastUpdate+1;
			RSS_read_Collection[idflux]['articles'] = articles;
		}
	}
}

function askingRSS(request, response) {
        var idFlux = request.params.rssId;
	
        if (request.params.otherName != undefined) {
                idFlux = request.params.otherName;
        }

	var lastUpdate = RSS_read_Collection[idFlux]['lastUpdate'];

	if (lastUpdate < 1) {
		if (!testTimeout(request, response)) {
			setTimeout(readRss, 1000, request, response);
		}		
	}else if (request.params.lastlyRead == lastUpdate) {
		if (!testTimeout(request, response)) {
			setTimeout(readRss, 20000, request, response);
		}		
	} else {
		try {
			response.json({'articles' : RSS_read_Collection[idFlux]['articles'], 'lastUpdate' : lastUpdate});
		} catch(err) {
			console.log(err);
		}
	}	
}

var article_sort = function (article1, article2) {
	if (article1.date > article2.date) return -1;
	if (article1.date < article2.date) return 1;
	return 0;
};


function testTimeout (request, response) {
	// close out requests older than 30 seconds
	var expiration = new Date().getTime() - 30000;
	if (request.session.start < expiration) {
		response.json({'timeout': 1});
		return true;
	} 
	return false;
}

exports.readRss = readRss;

// Remplace toutes les occurences d'une chaine
function replaceAll(str, search, repl) {
 while (str.indexOf(search) != -1)
  str = str.replace(search, repl);
 return str;
}

// Remplace les caractères accentués
function AccentToNoAccent(str) {
 var norm = new Array('À','Á','Â','Ã','Ä','Å','Æ','Ç','È','É','Ê','Ë',
'Ì','Í','Î','Ï', 'Ð','Ñ','Ò','Ó','Ô','Õ','Ö','Ø','Ù','Ú','Û','Ü','Ý',
'Þ','ß', 'à','á','â','ã','ä','å','æ','ç','è','é','ê','ë','ì','í','î',
'ï','ð','ñ', 'ò','ó','ô','õ','ö','ø','ù','ú','û','ü','ý','ý','þ','ÿ');
var spec = new Array('A','A','A','A','A','A','A','C','E','E','E','E',
'I','I','I','I', 'D','N','O','O','O','0','O','O','U','U','U','U','Y',
'b','s', 'a','a','a','a','a','a','a','c','e','e','e','e','i','i','i',
'i','d','n', 'o','o','o','o','o','o','u','u','u','u','y','y','b','y');
 for (var i = 0; i < spec.length; i++)
  str = replaceAll(str, norm[i], spec[i]);
 return str;
 }


var utf = {
    a: ['á','à','ã','Á','À','Ã'],
    e: ['é','ê','É','È'],
    i: ['í','Í'],
    o: ['ó','õ','Ó','Õ'],
    u: ['ú','Ú'],
    c: ['ç','Ç']
};

var utfRegexes = {};

// Sadly javascript isn't C# so something that could be done in two lines
// of LINQ need to be unrolled.
for(var c in utf)
{
  console.log("in " + c);
  var chars = "[";
  for (var j = 0; j < utf[c].length; j++)
  {
    chars += utf[c][j];
  }
  chars += "]";
  utfRegexes[c] = new RegExp(chars, "g");
}

function doReplaceRegex(mystring)
{   
  for(var c in utfRegexes)
  {
      mystring = mystring.replace(utfRegexes[c], c);        
  }
  return mystring;
}

