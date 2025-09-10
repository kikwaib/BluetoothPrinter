var exec = require("cordova/exec");

function BluetoothPrinter(){};

/*
 * Set printer width
 */
 BluetoothPrinter.prototype.setPrinterPageWidth = function(success, fail, width){
    exec(success, fail, 'MKBluetoothPrinter', 'setPrinterPageWidth',[width]);
 }

/*
 * Set maximum character length for first column in 3 or 4 column layout
 */
BluetoothPrinter.prototype.setFirstRankMaxLength = function(success, fail, text3, text4){
    exec(success, fail, 'MKBluetoothPrinter', 'setFirstRankMaxLength', [text3,text4])
}

/*
 * Get current paper width setting
 */
BluetoothPrinter.prototype.getCurrentSetPageWidth = function(success, fail){
    exec(success, fail, 'MKBluetoothPrinter', 'getCurrentSetPageWidth');
}

/*
 * Auto-connect to previously connected devices
 */
BluetoothPrinter.prototype.autoConnectPeripheral = function(success, fail){
    exec(success, fail, 'MKBluetoothPrinter', 'autoConnectPeripheral', []);
}

/** 
 * Check if device is connected 
 * Returns: "1":yes  "0":no
 */
BluetoothPrinter.prototype.isConnectPeripheral = function(success, fail){
    exec(success, fail, 'MKBluetoothPrinter', 'isConnectPeripheral', []);
}


/*
 * Start scanning for devices
 * keep: whether to keep continuous callback (0: no, 1: yes, default:0)
 *
 * Returns device list as JSON array
 * [{"name":"Printer_2EC1","uuid":"9A87E98E-BE88-5BA6-2C31-ED4869300E6E"}]
 * Returns scanned peripheral list information (may be empty), returned in scan callback with delay
 */
BluetoothPrinter.prototype.scanForPeripherals = function(success, fail, keep){
    exec(success, fail, 'MKBluetoothPrinter', 'scanForPeripherals', [keep]);
}

/** Stop scanning */
BluetoothPrinter.prototype.stopScan = function(success, fail){
    exec(success, fail, 'MKBluetoothPrinter', 'stopScan', [])
}

/**
 * Get peripheral list
 * Returns immediately with already scanned peripheral list.
 * Returns device list as JSON array:
 * [{"name":"Printer_2EC1","uuid":"9A87E98E-BE88-5BA6-2C31-ED4869300E6E"}]
 */
BluetoothPrinter.prototype.getDeviceList = function(success, fail){
    exec(success,fail, 'MKBluetoothPrinter', 'getPeripherals',[]);
}

/**
 * Connect to peripheral
 * Parameter: [uuid], get UUID from device info you want to connect from the already obtained peripheral list
 * After successful connection, stop scanning.
 */
BluetoothPrinter.prototype.connectPeripheral = function(success, fail, uuid){
    exec(success, fail, 'MKBluetoothPrinter', 'connectPeripheral', [uuid]);
}

/**
 * Set print information and print
 * Parameter jsonString, JSON array string
 */
BluetoothPrinter.prototype.setPrinterInfoAndPrinter = function(success, fail, jsonString){
    exec(success, fail, 'MKBluetoothPrinter', 'setPrinterInfoAndPrinter', [jsonString]);
}

//Disconnect
BluetoothPrinter.prototype.stopConnection = function(success, fail){
    exec(success, fail, 'MKBluetoothPrinter', 'stopPeripheralConnection', []);
}

//Print log to Xcode console
BluetoothPrinter.prototype.printOCLog = function(success, fail, message){
    exec(success, fail, 'MKBluetoothPrinter', 'printLog', [message]);
}




//=================================================
//enum
//  Information types
if (typeof BTPInfoType == "undefined"){
    var BTPInfoType = {};
    BTPInfoType.text            = 0;
    BTPInfoType.textList        = 1;
    BTPInfoType.barCode         = 2;
    BTPInfoType.qrCode          = 3;
    BTPInfoType.image           = 4;
    BTPInfoType.seperatorLine   = 5;
    BTPInfoType.spaceLine       = 6;
    BTPInfoType.footer          = 7;
    BTPInfoType.cutpage         = 8;
}
//  Font size default:smalle
if (typeof BTPFontType == "undefined"){
    var BTPFontType = {};
    BTPFontType.smalle  = 0;
    BTPFontType.middle  = 1;
    BTPFontType.big     = 2;
    BTPFontType.big3     = 3;
    BTPFontType.big4     = 4;
    BTPFontType.big5     = 5;
    BTPFontType.big6     = 6;
    BTPFontType.big7     = 7;
    BTPFontType.big8     = 8;
}
//  Alignment mode  default:center
if (typeof BTPAlignmentType == "undefined"){
    var BTPAlignmentType = {};
    BTPAlignmentType.left   = 0;
    BTPAlignmentType.center = 1;
    BTPAlignmentType.right  = 2;
}





//=================================================
//PrinterInfoHelper
/* All parameters
 var infoModel = new Object();
 infoModel.infoType = BTPInfoType.text;                 // Information type
 infoModel.text = text;                                 // Information
 infoModel.textArray = ["Pencil sharpener","2.00","5","10.00"];    // Information list
 infoModel.fontType = BTPFontType.middle;               // Font size (small, medium, large)
 infoModel.aligmentType = BTPAlignmentType.center;      // Alignment mode
 infoModel.maxWidth = 300;                              // Image width
 infoModel.qrCodeSize = 12;                             // QR code size (1-16)
 infoModel.isTitle = 0;                                 // Whether it's a title
 */

var _printerInfos = []; //List to save information

function PrinterInfoHelper(){};

/*
 * Reset information list
 */
PrinterInfoHelper.prototype.resetInfos = function(){
    _printerInfos = [];
}

/* Text information
 * text         : Information
 * alignment    : Alignment mode  optional   default: center
 * fontType     : Font size     optional    default: smalle
 */
PrinterInfoHelper.prototype.appendText = function (text, alignment, fontType) {
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.text;
    infoModel.text = text;
    infoModel.fontType = fontType;
    infoModel.aligmentType = alignment;
    _printerInfos.push(infoModel);
}

/* List information
 * textList     : Information list,
 * isTitle      : Whether it's a title       optional   1=yes, 0=no,  default: 0
 */
PrinterInfoHelper.prototype.appendTextList = function (textList, isTitle, fontType) {
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.textList;
    infoModel.textArray = textList;
    infoModel.isTitle = isTitle;
    if (fontType !== undefined) {
        infoModel.fontType = fontType;
    }
    
    _printerInfos.push(infoModel);
}

/* Barcode
 * text: Barcode string,
 * maxWidth     : Image width    optional   default:300
 * alignment    : Alignment mode  optional   default:center
 */
PrinterInfoHelper.prototype.appendBarCode = function (text, maxWidth, alignment){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.barCode;
    infoModel.text = text;
    infoModel.aligmentType = alignment;
    infoModel.maxWidth = maxWidth;
    _printerInfos.push(infoModel);
}

/* QR Code
 * text: QR code string,
 * size(1-16)   : Image size  optional   default:12
 * alignment    : Alignment mode  optional   default:center
 */
PrinterInfoHelper.prototype.appendQrCode = function (text, size, alignment){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.qrCode;
    infoModel.text = text;
    infoModel.aligmentType = alignment;
    infoModel.qrCodeSize = size;
    _printerInfos.push(infoModel);
}

/* Image
 * text: base64 string converted from image,
 * maxWidth     : Image width    optional   default:300
 * alignment    : Alignment mode  optional   default:center
 */
PrinterInfoHelper.prototype.appendImage = function (text, maxWidth, alignment){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.image;
    infoModel.text = text;
    infoModel.aligmentType = alignment;
    infoModel.maxWidth = maxWidth;
    _printerInfos.push(infoModel);
}

//Separator line  ---------------------------
PrinterInfoHelper.prototype.appendSeperatorLine = function(){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.seperatorLine;
    _printerInfos.push(infoModel);
}

//Empty line
PrinterInfoHelper.prototype.appendSpaceLine = function(){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.spaceLine;
    _printerInfos.push(infoModel);
}

//Cut paper
PrinterInfoHelper.prototype.appendCutpage = function(){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.cutpage;
    _printerInfos.push(infoModel);
}

PrinterInfoHelper.prototype.appendFooter = function(text){
    var infoModel = new Object();
    infoModel.infoType = BTPInfoType.footer;
    infoModel.text = text;
    _printerInfos.push(infoModel);
}

// Get print information JSON string
PrinterInfoHelper.prototype.getPrinterInfoJsonString = function(){
    var jsonStr = JSON.stringify(_printerInfos);
    _printerInfos = [];
    return jsonStr;
}

var printerHelper = new BluetoothPrinter();
var printerInfoHelper = new PrinterInfoHelper();

window.printerHelper = printerHelper;
window.printerInfoHelper = printerInfoHelper;
window.BTPInfoType = BTPInfoType;
window.BTPFontType = BTPFontType;
window.BTPAlignmentType = BTPAlignmentType;


module.exports.printerHelper = printerHelper;
module.exports.printerInfoHelper = printerInfoHelper;
module.exports.BTPInfoType = BTPInfoType;
module.exports.BTPFontType = BTPFontType;
module.exports.BTPAlignmentType = BTPAlignmentType;
