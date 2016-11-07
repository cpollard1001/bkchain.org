var wallet = new function() {
  var receiving_interval = 5;
  var change_interval = 3;
  
  var init_completed = 0;
  
  var nextNodeIndex = 5;
  
  var receiving_keys = [];
  var change_keys = [];
  
  function send_alert(alertType, message) {
    var alertItem = $('<div class="alert ' + alertType + ' alert-dismissable">'
         + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'
         + message
         + '</div>');
    $('#wallet-alert-div').append(alertItem);
  }
  
  function query_url(url, onSuccess, onError) {
      $.ajax({
          url: url,
          success: function(res) {
              onSuccess(res);
          },
          error:function (xhr, opt, err) {
              if (onError)
                  onError(err);
          }
      });
  }
  
  function get_keys() {
    return receiving_keys.concat(change_keys);
  }
  
  function prepareTx() {
    var addr = $('#txDest1').val();
    var amount = Math.round(parseFloat($('#txValue1').val()) * coinfactor);
    var fees = Math.round(parseFloat($('#txFees').val()) * coinfactor);
    var donate = Math.round(parseFloat($('#txDonate').val()) * coinfactor);
    
    var total = 0;
    var valid = false;
    
    var keys = get_keys();
    
    var inputKeys = [];
    
    // Find enough addresses to cover those funds
    // TODO: User-specified addresses?
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (key.balance == 0)
        continue;
      total += key.balance;
      inputKeys.push(key);
      if (total >= amount + fees + donate) {
        valid = true;
        break;
      }
    }
    
    if (!valid) {
      $('#txJSON').val("error: Not enough funds");
      return false;
    }

    // Find list of addresses with balances
    var addressesToCheck = inputKeys.filter(function(x) { return x.balance > 0; }).map(function(x) { return x.address });
    
    // Query unspent outputs (grouped by 10)
    var addressesGroupSize = 10;
    var addressesGroupCount = ((addressesToCheck.length + addressesGroupSize - 1) / addressesGroupSize) | 0;
    var addressesGroupCountLeft = addressesGroupCount;
    var enoughFundsFound = false;
    var inputs = [];
    var total = 0;
    var valid = false;
    
    for (var i = 0; i < addressesGroupCount; ++i) {
      // TODO: Query more incrementally instead of throwing everything right away?
      var addressesSlice = addressesToCheck.slice(i * addressesGroupSize, Math.min((i + 1) * addressesGroupSize, addressesToCheck.length));
      query_url("https://jackcash.info/" + current_currency + "/api/v1/address/unspent/" + addressesSlice.join() + "?confirmations=0", function(unspent_results) {
      
        // Already found solution in another of the callbacks
        if (valid) {
          return;
        }
        
        // Find enough inputs to cover those funds
        for (var i = 0; i < unspent_results.length; ++i) {
          var unspent_address = unspent_results[i];
          for (var j = 0; j < unspent_address.unspent.length; ++j) {
            var unspent_output = unspent_address.unspent[j];
            total += unspent_output.v;
            inputs.push({ output: unspent_output, address: unspent_address.address });
            var script = new Bitcoin.Script(Crypto.util.hexToBytes(unspent_output.script));
            if (total >= amount + fees + donate) {
              valid = true;
              break;
            }
          }
        }
        
        // We could find enough funds from address but when checking unspent outputs it didn't match?
        // Either something changed on us in the meantime (could happen) or it's a bug.
        if (!valid) {
          if (--addressesGroupCountLeft == 0) {
            $('#txJSON').val("error: Not enough funds (could not find unspent outputs)");
          }
          return;
        }
          
        var change = total - amount - fees - donate;
          
        TX.parseInputsBKC(inputs);
        TX.initMultiple(inputKeys.map(function (x) { return x.eckey; }));
        
        // Main output
        TX.addOutput(addr, amount);
        
        // Change
        if (change > 0) {
          // Default: select first element
          var changeAddr = change_keys[0].address;
          for (var i = 0; i < change_keys.length; ++i) {
            var key = change_keys[i];
            if (key.txcount == 0) {
              changeAddr = key.address;
              break;
            }
          }
        
          TX.addOutput(changeAddr, change);
        }
        
        // Donation
        if (donateAddress !== "" && donate > 0)
          TX.addOutput(donateAddress, donate);
        
        try {
          var sendTx = TX.construct();
          var txJSON = TX.toBBE(sendTx);
          var buf = sendTx.serialize();
          var txHex = Crypto.util.bytesToHex(buf);
        
          $('#txJSON').val(txJSON);
          $('#txHex').val(txHex);
        
          $('#sendPayment').addClass('btn-primary');
          $('#sendPayment').removeAttr('disabled');
        }
        catch (e) {
          if (e instanceof BitcoinAddressException) {
            $('#txJSON').val("Address error: " + e.message);
          } else {
            $('#txJSON').val("TX error: " + e);
          }
        }
      });
    }
  }
  
  function addressRefreshLoop() {
    addressRefresh();
  }
  
  function initialize_table(mode, keys, table_id) {
    var keyStart = keys.length;
    var receivedBalances = 0;
    var interval = mode == 0 ? receiving_interval : change_interval;
    //var interval = 1;
    
    Electrum.gen(mode, keyStart, keyStart + interval, function(r) {
      var key = { eckey: new Bitcoin.ECKey(r[1]), address: r[0] }
      var keyIndex = keys.length;
      keys.push(key);
      
      // Expand parent nodes
      var parentNode = $('#address-tree').treetable("node", mode == 0 ? "2" : "3");
      parentNode.expand();
      
      var nodeIndex = nextNodeIndex++;
      var newItem = $('<tr data-tt-id="' + nodeIndex + '" data-tt-parent-id="' + (mode == 0 ? 2 : 3) + '"><td class="text-left address">' + key.address + '</td><td><span class="glyphicon glyphicon-qrcode" rel="popover" data-container="body" data-toggle="popover" data-placement="auto bottom"></span></td><td class="text-center address-balance">...</td><td class="text-center address-tx">...</td></tr>');
      $('#address-tree').treetable("loadBranch", parentNode, newItem);
      newItem.qrcode_loaded = false;
      
      newItem.find("[rel=popover]").popover({
        html: true,
        title: function() { return 'QR Code'; },
        content: function() {
          if (!newItem.qrcode_loaded) {
            newItem.qrcode_loaded = true;
            return ninja.qrCode.createCanvas(key.address, 5);
          }
        }
      });
      
      key.item = newItem;
      key.nodeIndex = nodeIndex;
      
      var modeName = mode == 0 ? "change" : "receiving";
      var itemName = modeName + '-' + keys.length;
      var newBackupItem = $('<div class="backup-entry"><div class="backup-public"><div id="backup-public-qrcode-' + itemName + '" class="backup-public-qrcode"><canvas/></div><div class="backup-public-address"><span><b>Public Address:</b></span><span style="display: block;">' + key.address + '</span></div></div><div class="backup-private"><div id="backup-private-qrcode-' + itemName + '" class="backup-private-qrcode"><canvas/></div><div class="backup-private-address"><span><b>Private Key:</b></span><span style="display: block;">' + key.eckey.getExportedPrivateKey() + '<span></div></div></div>');
      $('#backup-' + modeName + '-div').append(newBackupItem);
      
      var keyValuePair = {};
      keyValuePair["backup-public-qrcode-" + itemName] = key.address;
      keyValuePair["backup-private-qrcode-" + itemName] = key.eckey.getExportedPrivateKey();
      ninja.qrCode.showQrCode(keyValuePair, 2);

      if (++receivedBalances == interval)
      {
        // Send balance query
        query_url("https://jackcash.info/" + current_currency + "/api/v1/address/balance/" + keys.slice(keys.length - interval, keys.length).map(function(x) { return x.address }).join() + "?confirmations=0", function(balance_results) {
          var hasTx = false;
          for (var i = 0; i < interval; ++i) {
            var balance_result = balance_results[i];
            var key = keys[keys.length - interval + i];
            hasTx = hasTx || balance_result.txcount > 0;
            
            key.balance = balance_result.balance;
            key.txcount = balance_result.txcount;
            
            if (key.balance == 0 && key.txcount > 0) {
              // Strike used addresses
              var addrElt = key.item.find('td.address').first();
              addrElt.wrapInner("<strike>");
              key.striked = true;
            }
        
            key.item.find('td.address-balance').first().text(balance_result.balance / coinfactor);
            key.item.find('td.address-tx').first().html('<a href="' + script_name + '/address/' + key.address + '" target="_blank">' + balance_result.txcount + '</a>');
          }
          
          var total_balance = 0;
          var all_keys = get_keys();
          for (var i = 0; i < all_keys.length; ++i) {
            if (all_keys[i].hasOwnProperty('balance'))
              total_balance += all_keys[i].balance;
          }
          
          $('#total-balance').text(total_balance / coinfactor);

          if (hasTx) {
            // If one balance has tx, request another batch
            // TODO: Use setTimeout?
            initialize_table(mode, keys, table_id);
          } else if (++init_completed == 2) {
            $('#address-refresh-icon').fadeOut();
            $('#address-refresh').removeAttr('disabled');
            setInterval(addressRefresh, 60000);
          }
        });
      }
    });
  }
  
  function initialize() {
    init_completed = 0;
    
    // Initialize chains for both receiving and change addresses
    initialize_table(0, receiving_keys, '#address-tree-body');
    initialize_table(1, change_keys, '#address-tree-body');
  }
  
  function addressRefresh() {
    $('#address-refresh-icon').fadeIn();
  
    var keys = get_keys();
    var total_balance = 0;
    
    var addressesToCheck = keys.map(function(x) { return x.address });
    
    // Query unspent outputs (grouped by 10)
    var addressesGroupSize = 10;
    var addressesGroupCount = ((addressesToCheck.length + addressesGroupSize - 1) / addressesGroupSize) | 0;
    var addressesGroupCountLeft = addressesGroupCount;
    
    for (var i = 0; i < addressesGroupCount; ++i) {
      // TODO: Query more incrementally instead of throwing everything right away?
      var addressesSlice = addressesToCheck.slice(i * addressesGroupSize, Math.min((i + 1) * addressesGroupSize, addressesToCheck.length));

      (function() {
        var i1 = i; // capture variable right away
        query_url("https://jackcash.info/" + current_currency + "/api/v1/address/balance/" + addressesSlice.join() + "?confirmations=0", function(balance_results) {
          for (var j = 0; j < balance_results.length; ++j) {
            var balance_result = balance_results[j];
        
            var key = keys[i1 * addressesGroupSize + j];
            key.balance = balance_result.balance;
            key.txcount = balance_result.txcount;
            key.item.find('td.address-balance').first().text(balance_result.balance / coinfactor);
            key.item.find('td.address-tx').first().html('<a href="address/' + key.address + '" target="_blank">' + balance_result.txcount + '</a>');
            
            if (!key.hasOwnProperty('striked') && key.balance == 0 && key.txcount > 0) {
              // Strike used addresses
              var addrElt = key.item.find('td.address').first();
              addrElt.wrapInner("<strike>");
              key.striked = true;
            }
            
            total_balance += key.balance;
          }
          if (--addressesGroupCountLeft == 0) {
            $('#address-refresh-icon').fadeOut();
            $('#total-balance').text(total_balance / coinfactor);
          }
        });
      })();
    }
  }
  
  function sendTx() {
    var txHex = $('#txHex').val();
    $.post("https://jackcash.info/" + current_currency + "/api/v1/tx/push",
           JSON.stringify({ hexdata: txHex }),
           function(data) {
             if (data === "exception") {
               send_alert('alert-danger', '<strong>Error!</strong> Transaction failed!');
             } else {
               send_alert('alert-success', '<strong>Good!</strong> Transaction sent, id: <a href="' + script_name + '/tx/' + data + '" target="_blank">' + data + '</a>');
             }
             
             // Wait a few seconds before refreshing balances
             setTimeout(addressRefresh(), 2000);
           });
    return true;
  }
  
  this.prepareTx = prepareTx;
  this.sendTx = sendTx;
  this.initialize = initialize;
  this.addressRefresh = addressRefresh;
}

  function generatePassword() {
  
    $('#electrum-seed-generator').fadeIn();
    $('#electrum-generated-seed').focus();
    
    var pk = new Array(32);
    rng_get_bytes(pk);
    var seed = Crypto.util.bytesToHex(pk.slice(0,16));
    //nb! electrum doesn't handle trailing zeros very well
    // and we want to stay compatible.
    if (seed.charAt(0) == '0') seed = seed.substr(1);
    var codes = mn_encode(seed);
    $('#electrum-generated-seed').val(codes);
    $('#electrum-generated-seed').select();
    
    return false;
  }

  function checkValidPassword(){
    var electrumSeed = $('#electrum-seed').val()
    var valid = true;
    
    // Otherwise, check for electrum seed
    if(electrumSeed.split(' ').length != 12)
      valid = false;

      //make sure each word is a valid one from elctrum poetry list (mn_words variable)
      electrumSeed.split(' ').forEach(function (word) {
          if (mn_words.indexOf(word) == -1) {
              valid = false;
          }
      });

    // It could still be a public key
    if (!valid && electrumSeed.match(/^[a-zA-Z0-9]{128}$/))
      valid = true;


    if(valid)
    {
      $('#open-wallet').addClass('btn-primary');
      $('#open-wallet').removeAttr('disabled');
    }
    else
    {
      $('#open-wallet').removeClass('btn-primary');
      $('#open-wallet').attr('disabled', 'disabled');
    }
  }

$(document).ready(function() {
  $('#amount-prepend-text').text('Amount (' + currency_short + ')');
  $('#fees-prepend-text').text('Fees (' + currency_short + ')');
  $('#donate-prepend-text').text('Donate (' + currency_short + ')');
  
  if (donateAddress === "") {
    $('#donate-div').hide();
  }

  $('#wallet-div').hide();
  $('#payment-div').hide();
  $('#publickey-div').hide();
  $('#backup-div').hide();

  // Update navigation bar when clicked  
  $(document).ready(function () {
        $('#wallet-menu-div > ul.nav > li').click(function (e) {
            e.preventDefault();
            $('#wallet-menu-div > ul.nav > li').removeClass('active');
            $(this).addClass('active');                
        });            
    });

  $('#addresses-nav').click(function(){
    $('#payment-div').hide();
    $('#publickey-div').hide();
    $('#backup-div').hide();
    $('#addresses-div').show();
  });
  
  $('#payment-nav').click(function(){
    $('#addresses-div').hide();
    $('#publickey-div').hide();
    $('#backup-div').hide();
    $('#payment-div').show();
  });
  
  $('#publickey-nav').click(function(){
    $('#addresses-div').hide();
    $('#payment-div').hide();
    $('#backup-div').hide();
    $('#publickey-div').show();
  });

  $('#backup-nav').click(function(){
    $('#addresses-div').hide();
    $('#payment-div').hide();
    $('#publickey-div').hide();
    $('#backup-div').show();
  });
  
  $('#txSend').click(function(){
  $('#txJSON').val('');
  $('#txHex').val('');
  $('#sendPayment').attr('disabled', 'disabled');
  $('#sendPayment').removeClass('btn-primary');
    $('#verifyModal').modal();
    $('#txJSON').val("Creating transaction, please wait...");
    wallet.prepareTx();
  });
	
  $('#sendPayment').click(wallet.sendTx);
  
  $('#address-refresh').click(wallet.addressRefresh);
  
  // Update button on keyup
  $('#electrum-seed').keyup(checkValidPassword);
  
  // Also update button on change (mobile device seem to not do a keyup in those cases)
  $('#electrum-seed').change(checkValidPassword);
  
  $('#generate-seed').click(generatePassword);
  
  $('#address-refresh-icon').hide();
  
  $('#address-tree').treetable({ expandable: true });
  $('#address-tree').treetable("node", "1").expand();

  $('#open-wallet-progress').hide();
  $('#electrum-seed-generator').hide();
  
  $('#txFees').val(defaultFees);
  
  $('#open-wallet').click(function() {
    $('#open-wallet-progress').show();
    
    var electrumSeed = $('#electrum-seed').val();
    
    // Public key?
    if (electrumSeed.match(/^[a-zA-Z0-9]{128}$/))
    {
      var pubKey = Crypto.util.hexToBytes(electrumSeed);
      pubKey.unshift(4);
      $('#electrum-publickey').text(Crypto.util.bytesToHex(pubKey.slice(1)));
      Electrum.initPublic(pubKey);
      $('#backup-nav').hide();
      $('#payment-nav').hide();
      $('#welcome-div').hide();
      $('#wallet-div').show();
      $('#address-refresh-icon').fadeIn();

      // Because of the previous hide, sub node start as hidden, let's "force" refresh it.
      $('#address-tree').treetable("node", "1").collapse();
      $('#address-tree').treetable("node", "1").expand();
      wallet.initialize();
    }
    else
    {
      electrumSeed = mn_decode(electrumSeed);
      
      Electrum.init(electrumSeed,
        function(r) {
          if(r % 10 == 0)
            $('#open-wallet-progress-bar').css('width', (r + 5) + '%'); 
        },
        function(privKey, pubKey) {
          $('#electrum-publickey').text(Crypto.util.bytesToHex(pubKey.slice(1)));
          $('#welcome-div').hide();
          $('#wallet-div').show();
          $('#address-refresh-icon').fadeIn();
          
          // Because of the previous hide, sub node start as hidden, let's "force" refresh it.
          $('#address-tree').treetable("node", "1").collapse();
          $('#address-tree').treetable("node", "1").expand();
          wallet.initialize();
        });
    }
    return false;
  })
})