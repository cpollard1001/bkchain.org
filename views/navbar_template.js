function anonymous(it
/**/) {
var out='      <div class="navbar-header">\n        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#mainNav">\n          <span class="sr-only">Toggle navigation</span>\n          <span class="icon-bar"></span>\n          <span class="icon-bar"></span>\n          <span class="icon-bar"></span>\n        </button>\n        <a href="'+(it.script_name)+'" class="navbar-brand">Jack Cash</a>\n        <div class="navbar-main">\n          <ul class="nav nav-pills list-inline">\n            <li style="display:none;" class="dropdown" id="navbar_currency_dropdown">\n              <a href="'+(it.script_name)+'" class="dropdown-toggle" data-toggle="dropdown">'+(it.currency)+' <b class="caret"></b></a>\n              <ul class="dropdown-menu">\n                <li';if(''+(it.currency_short) == 'JCS'){out+=' class="active"';}out+='><a href="'+(it.script_name_base)+'/jcs">JackCash</a></li>\n              </ul>\n            </li>\n'; if (undefined) { out+='\n            <li><a href="#">Wallet</a></li>\n'; } else if (true) { out+='\n            <li><a href="wallet_'+(it.currency_short.toLowerCase())+'.html">Wallet</a></li>\n'; } else { out+='\n            <li><a href="'+(it.script_name)+'/wallet">Wallet</a></li>\n'; } out+='\n          </ul>\n        </div>\n      </div>\n      <div class="collapse navbar-collapse" id="mainNav">\n'; if (true) { out+='\n        <form class="navbar-form navbar-right form-inline" method="post" onsubmit="main_search(); return false;">\n'; } else { out+='\n        <form class="navbar-form navbar-right form-inline" method="get" action="'+(it.script_name)+'/search">\n'; } out+='\n          <div class="form-group"><input type="text" class="form-control" id="search" name="search" placeholder="block id, block hash, transaction hash or address ('+(it.currency_short)+')"/></div>\n          <button type="submit" class="btn btn-success">Search</button>\n        </form>\n      </div>\n';return out;
}