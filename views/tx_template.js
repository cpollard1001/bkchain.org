function anonymous(it
/**/) {
var out='<div class="row">\n<div class="col-md-5">\n<table class="table table-condensed table-striped">\n  <thead>\n    <th colspan=\'2\'>Transaction</th>\n  </thead>\n  <tbody>\n  <tr>\n    <td>Confirmations:</td>\n    <td>\n        ';if(it.transaction.blocks.length == 0){out+='<span class=\'neg\'>Unconfirmed</span>\n        ';}else if(!it.transaction.main_chain){out+='<span class=\'neg\'>Orphaned</span>\n        ';}else if(it.transaction.confirmed){out+='<span class=\'pos\'>'+( it.transaction.confirmations )+'</span>\n        ';}else{out+=( it.transaction.confirmations )+'\n        ';}out+='\n    </td>\n  </tr>\n  <tr>\n    <td>Size:</td>\n    <td>'+( it.transaction.size )+' bytes</td>\n  </tr>\n  <tr>\n    <td>Version:</td>\n    <td>'+( it.transaction.ver )+'</td>\n  </tr>\n  <tr>\n    <td>Time:</td>\n    <td>'+( it.transaction.time )+'</td>\n  </tr>\n  <tr>\n    <td>Input:</td>\n    <td>'+( it.transaction.in / it.coin_factor )+' '+(it.currency_short)+'</td>\n  </tr>\n  <tr>\n    <td>Output:</td>\n    <td>'+( it.transaction.out / it.coin_factor )+' '+(it.currency_short)+'</td>\n  </tr>\n  <tr>\n    <td>Fees:</td>\n    <td>';if((it.transaction.in - it.transaction.out > 0)){out+=' '+( (it.transaction.in - it.transaction.out) / it.coin_factor )+' ';}else{out+=' 0 ';}out+=' '+(it.currency_short)+'</td>\n  </tr>\n  <tr>\n    <td>Coin age destroyed:</td>\n    <td>'+( it.transaction.coinage_destroyed / it.coin_factor )+' '+(it.currency_short)+' days</td>\n  </tr>\n  </tbody>\n</table>\n</div>\n<div class="col-md-7">\n<table class="table table-condensed table-striped">\n  <thead>\n    <th colspan=\'2\'>Hashes</th>\n  </thead>\n  <tbody>\n  <tr>\n    <td>Hash:</td>\n    <td><div class="hash">'+( it.transaction.hash )+'</div></td>\n  </tr>\n  <tr>\n    <td>Block(s):</td>\n    <td>\n';var arr1=it.transaction.blocks;if(arr1){var block,index=-1,l1=arr1.length-1;while(index<l1){block=arr1[index+=1];out+='\n      <a class="hash" href=\''+(it.script_name)+'/block/'+( block )+'\'>'+( block )+'</a>\n';} } out+='\n    </td>\n  </tr>\n  </tbody>\n</table>\n</div>\n</div>\n\n<p style=\'clear:both;\'/>\n<div class=\'tx-list\'>\n    <div class=\'tx-sm\'>\n      <div class=\'tx-sm-caption text-left\'>\n        <div>\n          <a class="hash" href=\''+(it.script_name)+'/tx/'+( it.transaction.hash )+'\'>'+( it.transaction.hash )+'</a>\n          <div class=\'pull-right\'><b>Size:</b> '+( it.transaction.size )+' bytes &nbsp;';if((it.transaction.out - it.transaction.in > 0)){out+='Generated: '+( (it.transaction.out - it.transaction.in) / it.coin_factor );}else{out+='<b>Fees:</b> '+( (it.transaction.in - it.transaction.out) / it.coin_factor );}out+=' '+(it.currency_short)+'</div>\n        </div>\n        <div>\n          <b>'+( it.transaction.time )+'</b>\n          <div class=\'pull-right\'><b>Coinage destroyed:</b> '+( (it.transaction.coinage_destroyed / it.coin_factor).toFixed(6) )+' '+(it.currency_short)+' days</div>\n        </div>\n      </div>\n      <div class="row">\n      <div class="col-md-6">\n        <table class=\'table table-condensed table-striped\'>\n'; for (var input_index in it.transaction.ins) { var input = it.transaction.ins[input_index]; out+='\n            <tr>\n';if((input.addr == 'pow')){out+='\n                <td class="text-left">New Coins (Mining)</td>\n                <td class="text-right">'+( input.v / it.coin_factor )+' '+(it.currency_short)+'</td>\n';}else if((input.addr == 'pos')){out+='\n                <td class="text-left">New Coins (Proof of Stake)</td>\n                <td class="text-right">'+( input.v / it.coin_factor )+' '+(it.currency_short)+'</td>\n';}else if((input.addr == 'None')){out+='\n                <td class="text-left">None</td>\n                <td class="text-right">'+( input.v / it.coin_factor )+' '+(it.currency_short)+'</td>\n';}else{out+='\n                <td class="text-left"><a href=\''+(it.script_name)+'/address/'+( input.addr )+'\'>'+( input.addr )+'</a></td>\n                <td class="text-right"><a href=\''+(it.script_name)+'/tx/'+( input.tx )+'#o'+( input.txi )+'\'>'+( input.v / it.coin_factor )+' '+(it.currency_short)+'</a></td>\n';}out+='\n            </tr>\n'; } out+='\n            <tr>\n                <td class="text-left"></td>\n                <td class="text-right">'+( it.transaction.in / it.coin_factor )+' '+(it.currency_short)+'</td>\n            </tr>\n        </table>\n      </div>\n      <!--<div class="col-md-2"><img src=\''+(it.source_base)+'/static/arrow.png\' /></div>-->\n      <div class="col-md-6">\n        <table class="table table-condensed table-striped">\n'; for (var output_index in it.transaction.outs) { var output = it.transaction.outs[output_index]; out+='\n            <tr>\n';if((output.addr == 'None')){out+='\n ';if((it.transaction.ins.length > 0 && it.transaction.ins[0].addr == 'pos')){out+='\n                <td class="text-left">See details in next transaction</td>\n ';}else{out+='\n                <td class="text-left">None</td>\n ';}out+='\n';}else{out+='\n                <td class="text-left"><a href=\''+(it.script_name)+'/address/'+( output.addr )+'\'>'+( output.addr )+'</a></td>\n';}out+='\n';if(output.tx){out+='\n                <td class="text-right"><a href=\''+(it.script_name)+'/tx/'+( output.tx )+'#i'+( output.txi )+'\'>'+( output.v / it.coin_factor )+' '+(it.currency_short)+'</a></td>\n';}else{out+='\n                <td class="text-right">'+( output.v / it.coin_factor )+' '+(it.currency_short)+'</td>\n';}out+='\n            </tr>\n'; } out+='\n            <tr>\n                <td class="text-left"></td>\n                <td class="text-right">'+( it.transaction.out / it.coin_factor )+' '+(it.currency_short)+'</td>\n            </tr>\n        </table>\n      </div>\n      </div>\n    </div>\n\n</div>\n<p/>\n\n<div style=\'white-space:pre;\'>\n \n</div>\n\n';return out;
}