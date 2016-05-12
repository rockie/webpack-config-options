var system = require('system');
var args = system.args;

var url = args[1];

var page = require('webpage').create();

page.open(url, function(status) {
    if (status !== 'success') {
        console.error('Unable to access network');
        phantom.exit(1);
    } else {
        var ua = page.evaluate(function() {
            return document.getElementsByTagName('body').item(0).textContent;
        });
        console.log(ua);
    }
    phantom.exit();
});