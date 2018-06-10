/********************************************************************************
 * Mixpanel Segmentation Data Export
 *
 * Retrieves data from Mixpanel via the Data Export API Segmentation end point.
 * 
 * @author https://github.com/melissaguyre (Melissa Guyre)
 * 
 * For more information querying Mixpanel Data Export APIs see
 * https://mixpanel.com/docs/api-documentation/data-export-api
 * https://mixpanel.com/docs/api-documentation/exporting-raw-data-you-inserted-into-mixpanel
 *
 *********************************************************************************/
var API_KEY_IHT = 'app1Key';
var API_KEY_AHT = 'app2Key';
var API_KEY_WHT = 'app3Key';
var API_SECRET_IHT = 'app1Secret';
var API_SECRET_AHT = 'app2Secret';
var API_SECRET_WHT = 'app3Secret';

/**
 * Step 1) Fill in your account's Mixpanel Information here
 */
var API_KEY = "";
var API_SECRET = "";

/**
 * Step 2) Define the tab # at which to create new sheets in the spreadsheet.
 * 0 creates a new sheet as the first sheet. 
 * 1 creates a new sheet at the second sheet and so forth.
 */
var CREATE_NEW_SHEETS_AT = 1;

/**
 * Step 3) Define date range as a string in format of 'yyyy-mm-dd' or '2013-09-13'
 *
 * Today's Date: set equal to getMixpanelDateToday() 
 * Yesterday's Date: set equal to getMixpanelDateYesterday() 
 */
var FROM_DATE = '2017-02-20'; //launch week of iHT 4.0
var TO_DATE = getMixpanelDateYesterday();

/**
 * Step 4) Define Segmentation Queries - Get data for an event, segmented and filtered by properties.
 *
 * Format is: 'Sheet Name' : [ 'event', 'where', 'type', 'unit' ],
 *
 * For example: 'Sign Ups' : [ '$signup', '(properties["Platform"])=="iPhone" and (properties["mp_country_code"])=="GB"', 'general', 'day' ],
 *
 * For full details on Segmentation Queries https://mixpanel.com/docs/api-documentation/data-export-api#segmentation-default
 * Sheet Name - What you want the sheet with your data to be called.
 * event - The event that you wish to segment on.
 * where - The property expression to segment the event on.
 * type - This can be 'general', 'unique', or 'average'.
 * unit - This can be 'minute', 'hour', 'day', or 'month'.
 */
var API_PARAMETERS_AHT = {
    'AHT start' : [ 'AHT Adjust signal', '', 'general', 'week' ],
    'AHT finished' :  [ 'AHT Finished hearing test', '', 'general', 'week' ],
};

var API_PARAMETERS_WHT = {
    'WHT start' : [ 'WHT Adjust signal', '', 'general', 'week' ],
    'WHT finished' :  [ 'WHT Finished hearing test', '', 'general', 'week' ],
};

var API_PARAMETERS_IHT = {
    'IHT start' : [ 'HT_Initiate Test', '', 'general', 'week' ],
    'IHT finished' :  [ 'HT_Finish Test', '', 'general', 'week' ],
};

/**
 * Step 5) Get Data
 *
 * In the Script Editor's "Run" menu, use the getMixpanelDataAHT() function to get data from within this script.
 *
 * Automate data pulling in the Script Editor's "Resources" menu. Select "Current Project Triggers"
 * and set up the script to run 'getMixpanelDataAHT' as a Time-driven event on a timer set by you.
 *
 * In the spreadsheet, once this script is set up you will see a new menu called "Mixpanel".
 * Select "Get Mixpanel Data" to pull data on demand.
 *
 */



/******** USER CONFIGURATION ENDS HERE: Do not edit below this line ****************/
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/




/***********************************************************************************
 * Fetch the data
 **********************************************************************************/

// Iterates through the hash map of queries, gets the data, writes it to spreadsheet.
function getMixpanelDataAHT() {
  for (var i in API_PARAMETERS_AHT)
  {
    fetchMixpanelData(i, "AHT");
  }
}

// One function per app. Added the app parameter to indicate which app the function should work for.

function getMixpanelDataWHT() {
  for (var i in API_PARAMETERS_WHT)
  {
    fetchMixpanelData(i, "WHT");
  }
}

function getMixpanelDataIHT() {
  for (var i in API_PARAMETERS_IHT)
  {
    fetchMixpanelData(i, "IHT");
  }
}

// Creates a menu in spreadsheet for easy user access to above function
function onOpen() {
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   var menuEntries = [];
   menuEntries.push({name: "Get IHT data", functionName: "getMixpanelDataIHT"});
   menuEntries.push({name: "Get AHT data", functionName: "getMixpanelDataAHT"});
   menuEntries.push({name: "Get WHT data", functionName: "getMixpanelDataWHT"});

   ss.addMenu("Mixpanel", menuEntries);
 }

/**
 * Gets data from mixpanel api and inserts to spreadsheet
 *
 * Working with JSON https://developers.google.com/apps-script/external_apis?hl=en
 */
function fetchMixpanelData(sheetName, app) {

  var expires = getApiExpirationTime();
  var urlParams = getApiParameters(expires, sheetName, app).join('&')
       + "&sig=" + getApiSignature(expires, sheetName, app);
  
  // Add URL Encoding for special characters which might generate 'Invalid argument' errors. 
  // Modulus should always be encoded first due to the % sign.
  urlParams = urlParams.replace(/\%/g, '%25');   
  urlParams = urlParams.replace(/\s/g, '%20');
  urlParams = urlParams.replace(/\[/g, '%5B');
  urlParams = urlParams.replace(/\]/g, '%5D');
  urlParams = urlParams.replace(/\"/g, '%22');
  urlParams = urlParams.replace(/\(/g, '%28');
  urlParams = urlParams.replace(/\)/g, '%29');
  urlParams = urlParams.replace(/\>/g, '%3E');
  urlParams = urlParams.replace(/\</g, '%3C');
  urlParams = urlParams.replace(/\-/g, '%2D');   
  urlParams = urlParams.replace(/\+/g, '%2B');   
  urlParams = urlParams.replace(/\//g, '%2F');
  
  var url = "http://mixpanel.com/api/2.0/segmentation?" + urlParams;
  Logger.log("THE URL  " + url);
  var response = UrlFetchApp.fetch(url);
  
  var json = response.getContentText();
  var dataAll = JSON.parse(json);
  
  var dates = dataAll.data.series;
  var parametersEntry = API_PARAMETERS[sheetName];
  
  var data = [];
  data.push(["Date", "Data"]);
  for (i in dates) {
     data.push([ dates[i], dataAll.data.values[parametersEntry[0]][dates[i]] ]);
  }
  
   insertSheet(sheetName, data);
}


/**
 * Creates a sheet and sets the name and index
 * insertSheet  https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#insertSheet(String,Integer)
 * feed it a two dimensional array of values
 * getRange(row, column, numRows, numColumns) https://developers.google.com/apps-script/reference/spreadsheet/sheet#getRange(Integer,Integer,Integer,Integer)
 * setValues(values) https://developers.google.com/apps-script/reference/spreadsheet/range#setValue(Object)
 */
function insertSheet(sheetName, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) ||
    ss.insertSheet(sheetName, CREATE_NEW_SHEETS_AT);
    sheet.clear();

  for (var i = 0; i < values.length; ++i) {    
    var data = [values[i]];
    var range = sheet.getRange((i + 1), 1, 1, data[0].length);
    range.setValues(data);
  }
  
};


/***********************************************************************************
 * Mixpanel API Authentication
 *
 * Calculating the signature is done in parts: 
 * sort the parameters you are including with the URL alphabetically, 
 * join into a string resulting in key=valuekey2=value2, 
 * concatenate the result with the api_secret by appending it, 
 * and lastly md5 hash the final string.
 *
 * Data Export API Authentication Requirements doc
 * https://mixpanel.com/docs/api-documentation/data-export-api#auth-implementation
 *
 * Resources
 * Computing md5 http://productforums.google.com/forum/#!topic/apps-script/iFKH6s-0On8
 * https://developers.google.com/apps-script/reference/utilities/utilities?hl=en#computeDigest(DigestAlgorithm,String)
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join
 **********************************************************************************/

/** 
 * Returns an array of query parameters
 */
function getApiParameters(expires, sheetName, app) {
  //Logger.log(app); // Log which app is being called
  if (app == "AHT") { // Figure out which API_KEY to use, so that the right project is called. As well as which parameters to use.
    API_KEY = API_KEY_AHT;
    API_PARAMETERS = API_PARAMETERS_AHT;
  }
  else if (app == "WHT") {
    API_KEY = API_KEY_WHT;
    API_PARAMETERS = API_PARAMETERS_WHT;
  }
  else if (app == "IHT") {
    API_KEY = API_KEY_IHT;
    API_PARAMETERS = API_PARAMETERS_IHT;
  }
  else {
    Logger.log("App key not defined");
  }
  
  var parametersEntry = API_PARAMETERS[sheetName];
  return [
        'api_key=' + API_KEY,
        'expire=' + expires,
        'event=' + parametersEntry[0],
        'where=' + parametersEntry[1],
        'type=' + parametersEntry[2],
        'unit=' + parametersEntry[3],
        'from_date=' + FROM_DATE,
        'to_date=' + TO_DATE
    ];
}

/** 
 * Sorts provided array of parameters
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 */
function sortApiParameters(parameters) { 
  var sortedParameters = parameters.sort();
  // Logger.log("sortApiParameters() " + sortedParameters);
   
  return sortedParameters;
}

/** 
 * Returns 10 minutes from current time in UTC time for API call expiration
 *
 * Resources
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
 * http://stackoverflow.com/questions/3830244/get-current-date-time-in-seconds
 */
function getApiExpirationTime() {
  var expiration = Date.now() + 10 * 60 * 1000;
  // Logger.log("getApiExpirationTime() " + expiration);
  
  return expiration;
}

/** 
 * Returns API Signature calculated using api_secret. 
 */
function getApiSignature(expires, sheetName, app) {
  var parameters = getApiParameters(expires, sheetName);
  if (app == "AHT") { // Same as for the API keys.
    API_SECRET = API_SECRET_AHT;
  }
  else if (app == "WHT") {
    API_SECRET = API_SECRET_WHT;
  }
  else if (app == "IHT") {
    API_SECRET = API_SECRET_IHT;
  }
  else {
    logger.log("App secret not defined");
  }
  var sortedParameters = sortApiParameters(parameters).join('') + API_SECRET;
  // Logger.log("Sorted Parameters  " + sortedParameters);
  
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sortedParameters);

  var signature = '';
  for (j = 0; j < digest.length; j++) {
      var hashVal = digest[j];
      if (hashVal < 0) hashVal += 256; 
      if (hashVal.toString(16).length == 1) signature += "0";
      signature += hashVal.toString(16);
  }
  
  return signature;
}



/** 
 *********************************************************************************
 * Date helpers
 *********************************************************************************
 */

// Returns today's date string in Mixpanel date format '2013-09-11'
function getMixpanelDateToday() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; 
  var yyyy = today.getFullYear();
  
  if (dd < 10) {
    dd = '0' + dd;
  } 
  if ( mm < 10 ) {
    mm = '0' + mm;
  } 
  
  today = yyyy + '-' + mm + '-' + dd;
  return today;
}

// Returns yesterday's's date string in Mixpanel date format '2013-09-11'
function getMixpanelDateYesterday(){
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  //Logger.log(yesterday);
  var dd = yesterday.getDate();
  //Logger.log(yesterday);
  var mm = yesterday.getMonth() + 1;
  var yyyy = yesterday.getFullYear();
  
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  
  yesterday = yyyy + '-' + mm + '-' + dd;
  //Logger.log(yesterday);
  return yesterday;
}



