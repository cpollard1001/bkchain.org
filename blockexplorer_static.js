var fs = require('fs');
var express = require('express'),
    doT = require('dot'),
    pub = __dirname + '/public',
    view =  __dirname + '/views';
    
var defs = {
    loadfile:function(path){return fs.readFileSync(__dirname + path, 'utf8');},
    savefile:function(path, data){return fs.writeFileSync(__dirname + path, data, 'utf8');},
    static: true,
};

doT.templateSettings.strip = false;

function generateTemplate(input, output, defs) {
  var template = doT.template(fs.readFileSync(__dirname + '/views/' + input, 'utf8'), null, defs);
  fs.writeFileSync(__dirname + '/views/' + output, template.toString());
}

function writeTemplate(input, output, defs, data) {
  var template = doT.template(fs.readFileSync(__dirname + '/views/' + input, 'utf8'), null, defs);
  fs.writeFileSync(__dirname + '/' + output, template(data));
}

// Generate dynamic website templates
generateTemplate('livetx.html', 'livetx.js', defs);
generateTemplate('liveblock.html', 'liveblock.js', defs);

// Generate dynamic parts templates
generateTemplate('navbar.html', 'navbar_template.js', defs);
generateTemplate('index_template.html', 'index_template.js', defs);
generateTemplate('block_template.html', 'block_template.js', defs);
generateTemplate('tx_template.html', 'tx_template.js', defs);
generateTemplate('address_template.html', 'address_template.js', defs);

// Include router.js content
eval(fs.readFileSync(__dirname + '/views/router.js') + '');

// Static block explorer
var data = { title_details: 'jackcash.info', script_name: '#/jcs', script_name_base: '#', source_base: '.', currency_short: 'JCS' };
writeTemplate('index_static.html', 'bkchain.html', defs, data);
defs.wallet = true;

// JCS Wallet
data['script_name_base'] = 'bkchain.html#';
route_prepare_data(data, 'bkchain.html#/', ['jcs']);
writeTemplate('wallet.html', 'wallet_jcs.html', defs, data);
