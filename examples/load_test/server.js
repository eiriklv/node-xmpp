var http = require('http');
var xmpp = require('../../lib/node-xmpp');
var C2SStream = require('../../lib/xmpp/c2s').C2SStream;

var tcpClients = 0, boshClients = 0, authedClients = 0;

var sv = new xmpp.C2SServer({ port: 25222 });
sv.on('connect', function(svcl) {
    tcpClients++;
    svcl.on('close', function() {
	tcpClients--;
    });
    svcl.on('authenticate', function(opts, cb) {
	authedClients++;
	svcl.on('close', function() {
	    authedClients--;
	});
	cb();
    });
});

var bosh = new xmpp.BOSHServer();
http.createServer(function(req, res) {
    try {
	bosh.handleHTTP(req, res);
    } catch(e) {
	console.error(e.stack||e);
    }
}).listen(25280);
bosh.on('connect', function(svcl) {
    boshClients++;
    svcl.on('close', function() {
	boshClients--;
    });
    var c2s = new C2SStream({ connection: svcl });
    c2s.on('authenticate', function(opts, cb) {
	authedClients++;
	c2s.on('close', function() {
	    authedClients--;
	});
	cb();
    });
});

setInterval(function() {
    console.log(tcpClients, "TCP", boshClients, "BOSH", authedClients, "authed", Math.ceil(process.memoryUsage().rss / 1024 / 1024), "MB");
}, 1000);
