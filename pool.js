var mysql = require('db-mysql');
var generic_pool = require('generic-pool');

var pool = generic_pool.Pool({
    name     : 'mysql',
    create   : function(callback) {
		new mysql.Database({
            hostname: 'localhost',
            user: 'root',
            password: '17061985',
            database: 'ninja',
    	    charset  : 'utf8'
        }).connect(function(err, server) {
            callback(err, this);
        });
	},
	destroy  : function(client) { client.disconnect(); },
	max      : 10,
	idleTimeoutMillis : 30000,
});

function getSql() {
    return new mysql.Database({
        hostname: 'localhost',
        user: 'root',
        password: '17061985',
        database: 'ninja',
	charset: 'utf8'
    }).on('error', function(error) {
        console.log('ERROR: ' + error);
    }).on('ready', function(server) {
        console.log('Connected to ' + server.hostname + ' (' + server.version + ')');
    });
}

function getPool() {
	return pool;
}

exports.getSql = getSql;
exports.getPool = getPool;
