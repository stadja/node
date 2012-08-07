var pool = require("./pool");
pool = pool.getPool();
var RssWriter = require("./rssWriter");
var RssReader = require("./rssReader");

// var FeedParser = require('feedparser');
// var parser = new FeedParser();

// var RSS = require('rss');
// var Backbone = require("backbone");

var url  = require("url");

var express = require('express');
// var app = express.createServer();
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "Ninja Le monde est à toi !" }));

try {
app.post('/changeFluxRights', function(request, response){

	var flux = request.body.flux;
	var cdcs = request.body.cdcs;
	var data = new Array();

	for (cdc in cdcs) {
		data.push( new Array(flux, cdcs[cdc]));
	}

	pool.acquire(function(err, db) {
		if (err) {
	        return res.end("CONNECTION error: " + err);
	    }
	    db.query().
	    delete().
	    from('flux_cdc').
	    where('flux = ?', [ flux ]).
	    execute(function(error, result) {
	        if (error) {
	            console.log('ERROR: ' + error);
	            return;
	        }
	       // console.log(result);
		});

	    if (cdcs != 'null') {
	    	db.query().
	        insert('flux_cdc',
	        	['flux', 'cdc' ],
	        	data).
	        execute(function(error, result) {
	            if (error) {
	                console.log('ERROR: ' + error);
	                return;
	            }
	            console.log(result);
	    	});
		}
		pool.release(db);
	});

	console.log(request.body);

	response.header('Content-Type', 'application/json; charset=UTF-8');
	response.header('Access-Control-Allow-Origin', '*');
	response.json({'result': 1});
	return;
});

 app.get('/rss/:flux.xml', function(request, response){
    response.contentType("rss");
	 setTimeout(function(req, res) {
                return RssWriter.getRss(req, res);
        }(request, response), 5000);
 });


app.get('/readRss/:rssId/:lastlyRead/:otherName?', function(request, response){
	response.header('Content-Type', 'application/json; charset=UTF-8');
	response.header('Access-Control-Allow-Origin', '*');
	setTimeout(function(req, res) {
		return RssReader.readRss(req, res);
	}(request, response), 500);
});

app.listen(8080);
} catch (err) {
	console.log('EXCEPTION : ' + err);
}


// var written = 0;

// app.get('/write', function(request, response){
// 	var uri = url.parse(request.url).pathname;  
// 	console.log("Request received : '" + uri + "'");
// 	written++;
// 	response.send("Merci d'avoir écrit !");
// 	return;
// });

// app.get('/trash', function(request, response){
// 	var uri = url.parse(request.url).pathname;  
// 	console.log("Request received : '" + uri + "'");
// 	written = 0;
// 	response.send("Vous avez effacé");
// 	return;
// });

// app.get('/read', function(request, response){
// 	var uri = url.parse(request.url).pathname;  
// 	console.log("Request received : '" + uri + "'");
// 	if (written > 0) {
// 		written--;
// 		response.send("On a lu !");
// 	} else {
// 		response.send("Rien à lire.");
// 	}
// 	return;
// });


// var spyingRequests = [];
// var spyingInterval = false;
// app.get('/spy/:alreadyReceived', function(request, response){
// 	var uri = url.parse(request.url).pathname;  
// 	console.log("Request received : '" + uri + "'");
// 	request.session.start = new Date().getTime();
// 	spyingRequests.push([request, response]);
// 	if (!spyingInterval) {
// 		spyingInterval = setInterval(spying, 2000);
// 	}
// 	return;
// });

// function spying () {
// 	spyingRequestsTemp = [];
// 	while (spyingRequests.length) {
// 		data = spyingRequests.shift();
// 		request = data[0];
// 		response = data[1];
// 		if (request.params.alreadyReceived != written) {
// 			response.header('Content-Type', 'application/json');
// 			response.header('Access-Control-Allow-Origin', '*');
// 			response.json({'written': written});
// 		} else {
// 			if (!testTimeout(request, response)) {
// 				spyingRequestsTemp.push([request, response]);
// 			}
// 		}
// 	}
// 	spyingRequests = spyingRequestsTemp;

// 	if (spyingRequests.length < 1) {
// 		clearInterval(spyingInterval);
// 		spyingInterval = false;
// 	}
// }

// function testTimeout (request, response) {
// 	// close out requests older than 30 seconds
// 	var expiration = new Date().getTime() - 20000;
// 		if (request.session.start < expiration) {
// 			response.header('Content-Type', 'application/json');
// 			response.header('Access-Control-Allow-Origin', '*');
// 			response.json({'timeout': 1});
// 			return true;
// 		} 
// 		return false;
// }
