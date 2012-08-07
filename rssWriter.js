var RSS = require('rss');
var url  = require("url");
var RSS_Collection = new Object();
var pool = require("./pool");
pool = pool.getPool();

function flux_rss(idFlux) {
	this.expiration = 0;
	this.feed = new RSS({
	        title: idFlux,
	        description: idFlux,
	        feed_url: 'http://stadja.net:8080/rss/'+idFlux+'.xml',
	        site_url: 'http://ninja.stadja.net',
	        image_url: 'http://www.red-team-design.com/wp-content/uploads/2011/09/login-sprite.png',
	        author: 'http://ninja.stadja.net'
	    });

	this.isOld = function () {
//		return true;
		if (this.expiration < new Date().getTime()) {
			return true;
		}
		return false;
	}

	this.update = function (idFlux) {
		this.expiration = new Date().getTime() + (1000 * 10);
		var rows_query = 'test';
		pool.acquire(function(err, db) {    		
			if (err) {
		        return res.end("CONNECTION error: " + err);
		    }
		    var rows = new Array();
		    test = db.query(
		    	).
		    on('each', function(row, index, last){    
                        RSS_Collection[idFlux].feed.item({
                                             title:  row['title'],
                                             description: row['small_description'],
                                             url: 'http://ninja.stadja.net/news/'+row['idnews'],
                                             guid: row['idnews'], // optional - defa$
                                             author: row['author'], // optio$
                                             date: row['updated'], // any form$
                                             pubdate : row['created'] // any form$
                                         })

                        if(last) {
							this.expiration = new Date().getTime() + (1000 * 60 * 5);
							var temp = new Date();
							temp.setTime(this.expiration);
							//console.log(idFlux+' RSS will expire at '+(temp.toLocaleString()));
                        }

		    }).
		    select('*').
	        from('news').
	        where('idflux = ?', [ idFlux ]).
	        order({'created': false}).
	        execute(function(error, rows, cols) {
	                if (error) {
	                        console.log('ERROR: ' + error);
	                        return;
	                }
			},{async : false});
			pool.release(db);
		});
	} 
}

function getRss(request, response){
	
	var idFlux = request.params.flux;

	console.log('get RSS: '+idFlux);
	if ((RSS_Collection[idFlux] == undefined) || RSS_Collection[idFlux].isOld()) {
		RSS_Collection[idFlux] = new flux_rss(idFlux);
		RSS_Collection[idFlux].update(idFlux);
	}

	setTimeout(function(){
        	// cache the xml
        	var xml = RSS_Collection[idFlux].feed.xml();
        	response.contentType("rss");
		response.charset = 'utf8';		
  		response.send(xml);
	},500);

}

exports.getRss = getRss;



