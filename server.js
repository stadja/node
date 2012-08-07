var pool = require("./pool");
pool = pool.getPool();

var RssWriter = require("./rssWriter");
var RssReader = require("./rssReader");

var express = require('express');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "Ninja Le monde est à toi !" }));

try {

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

