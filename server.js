/* 
1.  Load tested with siege : http://www.joedog.org/siege-home/ 
    If you want to load-test, install siege and set connection = keep-alive in siegerc 
    Find where siegerc is by doing running: (usually at /etc/siege/siegerc)
    > siege -c

2.  Node offers stateless HTTP by default, and managing sessions would have involved use of
    third-party libraries (Express etc), hence not implemented. So you have to provide api key in each API call

3.  I've use a hacky way to store api keys in Hash. More robust option would have been in file/database.

*/
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var querystring = require('querystring');
var sys = require(process.binding('natives').util ? 'util' : 'sys');

/* Setup API Key  */
var apiKeys = new Array();
var MAX = 999999;

var server = http.createServer(function(req, res){
    var path,mime;
    var parsedquery, result, response;
    var parsed = url.parse(req.url);        //Parse the requested URL
    path = parsed.pathname;                 // We need its pathname
    switch (path){                          
        case '/':                           
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write('<h1>Welcome. Check the <a href="/api">API</a>.</h1>');
            res.end();
            break;
        case '/api':
        case '/api/':
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write('But first, you might want to read the docs!<br/>');
            res.write('<p>All API requests are to be sent via HTTP GET.');
            res.write('<br/>The methods are as defined below: </p>');
            res.write('<ul><li><b>/api/new?email=john@doe.com</b> &nbsp;&nbsp; :  Register for a new api Key.. It is Mandatory that you do so!!<br/>');
            res.write('You will be returned a JSON object with the API Key, and further instructions')
            res.write('<li><b>/api/op?op=24*56&key=123593293283</b> &nbsp;&nbsp; :  Perform the operation. Only simple operations are allowerd - with 2 operands and one opeator<br/>');
            res.write('The application returns a JSON object with the result and with a 200 Header.</li></ul>');
            res.end();
            break;         
        case '/api/new':
        case '/api/new/':
            parsedquery = tryQueryString(parsed.query,res);
            if(!('email' in parsedquery) || (!validateEmail(parsedquery.email))) {
                res.writeHead(500, {'content-type': 'text/plain' });
                res.write('ERROR: Invalid (or blank)email address entered. Please try again!!\n');
                res.write('Try something like /api/new?email=john@doe.com ');
                res.end('\n');
            }
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            var generatedKey = createAPIKey();
            response = {
            	key: generatedKey,
                info: "Awesome! Now you can make API calls like so: /api/op?op=24+45&key="+generatedKey
            }
            res.write(JSON.stringify(response));
            res.end();
            break;
       case '/api/op':
       case '/api/op/':
            parsedquery = tryQueryString(parsed.query);
            parsedquery.op = parsedquery.op.replace(/ /g,'+'); // since + gets changed to space in URL querystring
            if(apiKeys.indexOf(parsedquery.key) == -1) {
                res.writeHead(500, {'content-type': 'text/plain' });
                res.write('ERROR: Get yourself an API key first by visiting /api/new, and include it as key=2345ex4mp13k3y in URL querystring');
                res.end('\n');
                break;
            }
            result = performOps(parsedquery.op,res);
            if(result==-1) {         
                res.writeHead(500, {'content-type': 'text/plain' });
                res.write('ERROR: Malformed query - Use this format : \n');
                res.write('(number)[+-*/](number)');
                res.end('\n');
                break;
            }
            response = {
                query: parsedquery.op,
                result: result
            }
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.write(JSON.stringify(response));
            res.end();
            break;
        default:
            send404(res);                      //End output
    }
});
server.listen(8000);                        //Server now listens at port 8000

validateEmail = function(email) { 
  // http://stackoverflow.com/a/46181/11236
  
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

tryQueryString = function(query,res) {
    try {
        var parsedquery = querystring.parse(query);
    } catch (e) {
        res.writeHead(500, {'content-type': 'text/plain' });
        res.write('ERROR:' + e);
        res.end('\n');
        return -1;
    }
    return parsedquery;
}

send404 = function(res){
    res.writeHead(404, {
        'Content-Type' : 'text/plain'
    });
    res.write('404:Not Found');
    res.end(); //End output
}


createAPIKey = function() {
    var rand = Math.floor(Math.random() * (MAX));
    key = crypto.createHash('md5').update(rand.toString()).digest("hex");
    apiKeys.push(key);
    console.log(apiKeys);
    return key;
}

performOps = function(opquery,res) {
    if(/([0-9\.]+)([\+/*-])([0-9\.]+)/.test(opquery)) {
        var op1 = parseFloat(RegExp.$1);
        var op = RegExp.$2;
        var op2 = parseFloat(RegExp.$3);
        switch(op) {
            case '+': return op1+op2;
            case '-': return op1-op2;
            case '*': return op1*op2;
            case '/': return op1/op2;
            default: return -1;
        }
    } else {
        // 500 ERROR: Malformed Query
        res.writeHead(500, {'content-type': 'text/plain' });
        res.write('ERROR: Malformed query - Use this format : \n');
        res.write('(number)[+-*/](number)');
        res.end('\n');
        return -1;
    }
}