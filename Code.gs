function RUNME() {
  onOpen();
}

function _mergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

function _getBasicAuthHeader (username, password) {
  var blob = Utilities.newBlob(username + ":" + password);
  var encoded = Utilities.base64Encode(blob.getBytes());
  return "Basic " + encoded;
}

function _cacheOrDo(cacheName, cacheElse) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheName);
  if (cached !== null && cached !== undefined && cached !== "undefined") {
    return cached;
  }
  var contents = cacheElse();
  cache.put(cacheName, contents, 3600);
  return contents;
}

function _rawRiQRequest (apiKey, apiSecret, url, params) {
  var params = params || {};
    var defaults = {
      "headers" : {
        "Authorization" : _getBasicAuthHeader(apiKey, apiSecret),
        "Accept" : "application/json"
      }
    };
    var options = _mergeRecursive(defaults, params);
    var result = UrlFetchApp.fetch(url, options);
    var contents = result.getContentText();
    return contents;
}

function _riQRequest (apiKey, apiSecret, url, params) {
  var raw = _cacheOrDo(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, url), function () { return _rawRiQRequest(apiKey, apiSecret, url, params); });
  return JSON.parse(raw);
}

function _riQuestFull (apiKey, apiSecret, url, key, params) {
  var body;
  var contents = {};
  contents[key] = [1];
  var i = 0;
  while(contents[key].length !== 0) {
    var fullURL = url + "?_limit=20&_start=" + i*20;
    contents = _riQRequest(apiKey, apiSecret, fullURL);
    if(!body) {
      body = contents;
    }else{
      body[key] = body[key].concat(contents[key]);
    }
    i++;
  }
  
  return body;
}

function _requestRiQList (apiKey, apiSecret, listId) {
  return _riQRequest(apiKey, apiSecret, "https://api.relateiq.com/v2/lists/" + listId);
}

function _requestRiQListItems (apiKey, apiSecret, listId) {
  return _riQuestFull(apiKey, apiSecret, "https://api.relateiq.com/v2/lists/" + listId + "/listitems", "objects");
}

function _riQList (apiKey, apiSecret, listId) {
  var list = _requestRiQList (apiKey, apiSecret, listId);
  var fields = {};
  list.fields.forEach(function (field) {
    fields[field.id] = field;
  });
  list.fields = fields;
  return list;
}

function _processField (field, fieldInfo) {
  var raw = field[0].raw;
  if(fieldInfo.dataType === "Numeric") {
    return Number(raw);
  }

  if(fieldInfo.dataType === "List") {
    var display;
    fieldInfo.listOptions.forEach(function (option) {
      if(option.id === raw){
        display = option.display;
      }
    });
    if(display) {
      return display; 
    }
  }

  return raw;
}

function _riQListItems (apiKey, apiSecret, listId) {
  var items = _requestRiQListItems(apiKey, apiSecret, listId);
  var list = _riQList(apiKey, apiSecret, listId);
  var listItems = {};
  // { "objects" : [ { "name" : "HackRU" ... } ... ]
  items.objects.forEach(function (item) {
    // { "name" : "HackRU", "fieldValues" : { "1" : [], ... } .. }
    var namedValues = {};
    Object.keys(item.fieldValues).forEach(function (id) {
      // [ { "raw" : "546a1f1be4b04b10a7b93f5d" } ]
      var field = item.fieldValues[id];
      var fieldInfo = list.fields[id];
      var fieldName = fieldInfo.name;
      var fieldContents = _processField(field, fieldInfo);

      namedValues[fieldName] = fieldContents;
    });
    
    listItems[item.name] = namedValues;
  });
  return listItems;
}

function RIQ_FIELD(eventName, fieldName) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("relateiq_api_key");
  var apiSecret = props.getProperty("relateiq_api_secret");
  var listId = props.getProperty("relateiq_list_id");

  list = _riQListItems(apiKey, apiSecret, listId);
  
  var item = list[eventName.trim()] || list[eventName];
  
  if(!item) {
    throw new Error( "Cannot find list item." );
  }
  
  if(!item[fieldName]) {
    Logger.log(item);
    throw new Error( "Cannot find field." );
  }
  
  return item[fieldName];
}

/**
 * Runs when the add-on is installed.
 */
function onInstall() {
  onOpen();
}

/**
 * Runs when the document is opened, creating the add-on's menu. Custom function
 * add-ons need at least one menu item, since the add-on is only enabled in the
 * current spreadsheet when a function is run.
 */
function onOpen() {
  SpreadsheetApp.getUi().createAddonMenu()
      .addItem('Set List', '_setList')
      .addItem('Setup API Access', '_setAPI')
      .addToUi();
}

/**
 * Enables the add-on on for the current spreadsheet (simply by running) and
 * shows a popup informing the user of the new functions that are available.
 */
function _setAPI() {
  var props = PropertiesService.getScriptProperties();
  var ui = SpreadsheetApp.getUi();
  
  var result = ui.prompt(
      'Setup API Access',
      'What\'s your API Key?',
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var apiKey = result.getResponseText();
  if (button != ui.Button.OK) {
    return false; 
  }
  
  var result = ui.prompt(
      'Setup API Access',
      'What\'s your API Secret?',
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var apiSecret = result.getResponseText();
  if (button != ui.Button.OK) {
    return false; 
  }
  
  props.setProperty("relateiq_api_key", apiKey);
  props.setProperty("relateiq_api_secret", apiSecret);
  ui.alert("API Access Setup");
}

function _setList() {
  var props = PropertiesService.getScriptProperties();
  var ui = SpreadsheetApp.getUi();
  
  var result = ui.prompt(
      'Setup List',
      'What\'s your List ID?',
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var listId = result.getResponseText();
  if (button != ui.Button.OK) {
    return false; 
  }
  
  props.setProperty("relateiq_list_id", listId);
  ui.alert("List Selected");
}