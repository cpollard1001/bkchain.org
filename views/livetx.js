function anonymous(it
/**/) {
var out='      <tr>\n\t    <td class="text-left"><a href=\''+(it.script_name)+'/tx/'+( it.tx.hash )+'\'>'+( it.tx.hash.substring(0, 20) + '...' )+'</a></td>\n\t    <td class="text-center"><abbr class="timeago" rel="tooltip" data-animation="false" title="'+( it.tx.time )+'Z">'+( it.tx.time )+' UTC</abbr></td>\n\t    <td class="text-right">'+( it.tx.output / it.coin_factor )+'</td>\n\t    <td class="text-right">'+( (it.tx.coinage_destroyed / it.coin_factor).toFixed(2) )+'</td>\n      </tr>';return out;
}