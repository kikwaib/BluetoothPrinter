# Cordova Bluetooth Printer Plugin

A comprehensive Cordova plugin that provides cross-platform Bluetooth thermal printer functionality for iOS and Android applications. Supports ESC/POS printing protocols with advanced features for text, images, barcodes, and QR codes.

> **Note**: This plugin is a fork of [lynzz/BluetoothPrinter](https://github.com/lynzz/BluetoothPrinter) with enhanced cross-platform support, modern Android permissions, and comprehensive documentation.

[![NPM](https://img.shields.io/npm/v/@kikwaib/cordova-plugin-bluetooth-printer.svg)](https://www.npmjs.com/package/@kikwaib/cordova-plugin-bluetooth-printer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- ✅ **Cross-platform support** - iOS & Android
- ✅ **Multiple Bluetooth protocols** - Bluetooth Classic (Android) and Bluetooth Low Energy (iOS)
- ✅ **ESC/POS thermal printer** compatibility
- ✅ **Rich content printing** - Text, images, barcodes, QR codes
- ✅ **Builder pattern** for complex print jobs
- ✅ **Automatic image processing** and optimization
- ✅ **Multiple font sizes** and alignment options
- ✅ **Paper cutting** support
- ✅ **Connection management** with auto-reconnect
- ✅ **Configurable paper width** (58mm/80mm)

## 📦 Installation

```bash
cordova plugin add @kikwaib/cordova-plugin-bluetooth-printer
```

## 🔧 Platform Requirements

### Android

- **Minimum SDK**: 19 (Android 4.4+)
- **Target SDK**: 33
- **Permissions**: Bluetooth, Location (for device discovery)
- **Bluetooth**: Classic SPP profile (`00001101-0000-1000-8000-00805F9B34FB`)

### iOS

- **iOS Version**: 9.0+
- **Framework**: Core Bluetooth
- **Bluetooth**: Low Energy (BLE)
- **Background modes**: Bluetooth peripheral connections

## ⚠️ Android 12+ Important Notes

For Android 12 (API level 31) and above, additional runtime permissions are required:

- `BLUETOOTH_SCAN` - for discovering nearby Bluetooth devices
- `BLUETOOTH_CONNECT` - for connecting to Bluetooth devices
- `ACCESS_FINE_LOCATION` - required for Bluetooth scanning

These permissions are automatically added to your AndroidManifest.xml, but you **must** request them at runtime:

```javascript
// Request permissions (you may need cordova-plugin-android-permissions)
cordova.plugins.permissions.requestPermissions(
  [
    cordova.plugins.permissions.BLUETOOTH_SCAN,
    cordova.plugins.permissions.BLUETOOTH_CONNECT,
    cordova.plugins.permissions.ACCESS_FINE_LOCATION,
  ],
  success,
  error
);
```

## 📚 API Reference

### Core Methods

#### Device Management

```javascript
// Scan for available printers
printerHelper.scanForPeripherals(success, error, keepScanning);

// Stop scanning
printerHelper.stopScan(success, error);

// Get discovered devices
printerHelper.getDeviceList(success, error);

// Connect to a specific printer
printerHelper.connectPeripheral(success, error, deviceId);

// Check connection status
printerHelper.isConnectPeripheral(success, error);

// Auto-connect to previously connected device
printerHelper.autoConnectPeripheral(success, error);

// Disconnect
printerHelper.stopConnection(success, error);
```

#### Configuration

```javascript
// Set paper width (58mm or 80mm)
printerHelper.setPrinterPageWidth(success, error, width);

// Get current paper width
printerHelper.getCurrentSetPageWidth(success, error);

// Set maximum length for first column in multi-column layouts
printerHelper.setFirstRankMaxLength(success, error, text3, text4);
```

### Print Job Builder (PrinterInfoHelper)

The plugin uses a builder pattern for constructing complex print jobs:

#### Basic Usage

```javascript
// Reset the print job
printerInfoHelper.resetInfos();

// Add various content types
printerInfoHelper.appendText(
  "Hello World",
  BTPAlignmentType.center,
  BTPFontType.middle
);
printerInfoHelper.appendImage(base64ImageData, 300, BTPAlignmentType.center);
printerInfoHelper.appendBarCode("123456789", 300, BTPAlignmentType.center);
printerInfoHelper.appendQrCode(
  "https://example.com",
  12,
  BTPAlignmentType.center
);
printerInfoHelper.appendSeperatorLine();
printerInfoHelper.appendSpaceLine();
printerInfoHelper.appendCutpage();

// Execute the print job
var jsonString = printerInfoHelper.getPrinterInfoJsonString();
printerHelper.setPrinterInfoAndPrinter(success, error, jsonString);
```

#### Content Types

##### Text Printing

```javascript
// Simple text
printerInfoHelper.appendText(text, alignment, fontType);

// Multi-column lists
printerInfoHelper.appendTextList(
  ["Item", "Price", "Qty"],
  1,
  BTPFontType.middle
); // Header
printerInfoHelper.appendTextList(["Coffee", "$3.50", "2"], 0); // Data row
```

##### Image Printing

```javascript
// Print base64 encoded images (JPEG/PNG)
printerInfoHelper.appendImage(base64ImageData, maxWidth, alignment);
```

##### Barcode Printing

```javascript
// Print 1D barcodes
printerInfoHelper.appendBarCode(data, maxWidth, alignment);
```

##### QR Code Printing

```javascript
// Print QR codes (size 1-16)
printerInfoHelper.appendQrCode(data, size, alignment);
```

##### Layout Elements

```javascript
// Separator line (dashes)
printerInfoHelper.appendSeperatorLine();

// Empty line
printerInfoHelper.appendSpaceLine();

// Paper cut command
printerInfoHelper.appendCutpage();

// Footer text
printerInfoHelper.appendFooter(text);
```

### Constants

#### Font Types (`BTPFontType`)

```javascript
BTPFontType.smalle; // 0 - Small font
BTPFontType.middle; // 1 - Medium font
BTPFontType.big; // 2 - Large font
BTPFontType.big3; // 3 - Extra large
BTPFontType.big4; // 4 - XXL
BTPFontType.big5; // 5 - XXXL
BTPFontType.big6; // 6 - XXXXL
BTPFontType.big7; // 7 - XXXXXL
BTPFontType.big8; // 8 - XXXXXXL
```

#### Alignment Types (`BTPAlignmentType`)

```javascript
BTPAlignmentType.left; // 0 - Left aligned
BTPAlignmentType.center; // 1 - Center aligned
BTPAlignmentType.right; // 2 - Right aligned
```

#### Info Types (`BTPInfoType`)

```javascript
BTPInfoType.text; // 0 - Plain text
BTPInfoType.textList; // 1 - Multi-column list
BTPInfoType.barCode; // 2 - 1D Barcode
BTPInfoType.qrCode; // 3 - QR Code
BTPInfoType.image; // 4 - Image
BTPInfoType.seperatorLine; // 5 - Separator line
BTPInfoType.spaceLine; // 6 - Empty line
BTPInfoType.footer; // 7 - Footer text
BTPInfoType.cutpage; // 8 - Paper cut
```

## 💡 Usage Examples

### Simple Receipt

```javascript
function printSimpleReceipt() {
  printerInfoHelper.resetInfos();

  // Header
  printerInfoHelper.appendText(
    "COFFEE SHOP",
    BTPAlignmentType.center,
    BTPFontType.big
  );
  printerInfoHelper.appendText(
    "123 Main St",
    BTPAlignmentType.center,
    BTPFontType.smalle
  );
  printerInfoHelper.appendSeperatorLine();

  // Items
  printerInfoHelper.appendTextList(["Item", "Price"], 1);
  printerInfoHelper.appendTextList(["Coffee", "$3.50"]);
  printerInfoHelper.appendTextList(["Muffin", "$2.25"]);
  printerInfoHelper.appendSeperatorLine();

  // Total
  printerInfoHelper.appendTextList(["Total:", "$5.75"]);
  printerInfoHelper.appendSpaceLine();

  // Footer
  printerInfoHelper.appendText("Thank you!", BTPAlignmentType.center);
  printerInfoHelper.appendCutpage();

  // Print
  var jsonString = printerInfoHelper.getPrinterInfoJsonString();
  printerHelper.setPrinterInfoAndPrinter(printSuccess, printError, jsonString);
}
```

### Advanced Receipt with QR Code

```javascript
function printAdvancedReceipt() {
  printerInfoHelper.resetInfos();

  // Logo/Image
  printerInfoHelper.appendImage(logoBase64, 200, BTPAlignmentType.center);

  // Store info
  printerInfoHelper.appendText(
    "RESTAURANT NAME",
    BTPAlignmentType.center,
    BTPFontType.middle
  );
  printerInfoHelper.appendText("Order #12345", BTPAlignmentType.center);
  printerInfoHelper.appendText("Date: " + new Date().toLocaleDateString());
  printerInfoHelper.appendSeperatorLine();

  // Items with quantities
  printerInfoHelper.appendTextList(
    ["Item", "Qty", "Price"],
    1,
    BTPFontType.smalle
  );
  printerInfoHelper.appendTextList(["Burger", "2", "$15.98"]);
  printerInfoHelper.appendTextList(["Fries", "1", "$4.50"]);
  printerInfoHelper.appendTextList(["Drink", "2", "$6.00"]);
  printerInfoHelper.appendSeperatorLine();

  // Totals
  printerInfoHelper.appendTextList(["Subtotal:", "$26.48"]);
  printerInfoHelper.appendTextList(["Tax:", "$2.38"]);
  printerInfoHelper.appendTextList(["Total:", "$28.86"], 0, BTPFontType.middle);
  printerInfoHelper.appendSpaceLine();

  // Payment method
  printerInfoHelper.appendText("Paid: Credit Card");
  printerInfoHelper.appendSpaceLine();

  // QR code for receipt verification
  printerInfoHelper.appendQrCode(
    "https://restaurant.com/receipt/12345",
    8,
    BTPAlignmentType.center
  );

  // Footer
  printerInfoHelper.appendText(
    "Thank you for your visit!",
    BTPAlignmentType.center
  );
  printerInfoHelper.appendText("Please come again", BTPAlignmentType.center);
  printerInfoHelper.appendCutpage();

  var jsonString = printerInfoHelper.getPrinterInfoJsonString();
  printerHelper.setPrinterInfoAndPrinter(printSuccess, printError, jsonString);
}
```

### Barcode Label

```javascript
function printBarcodeLabel() {
  printerInfoHelper.resetInfos();

  printerInfoHelper.appendText(
    "PRODUCT LABEL",
    BTPAlignmentType.center,
    BTPFontType.middle
  );
  printerInfoHelper.appendSpaceLine();

  printerInfoHelper.appendText("Product: Coffee Beans", BTPAlignmentType.left);
  printerInfoHelper.appendText("SKU: CB001", BTPAlignmentType.left);
  printerInfoHelper.appendText("Price: $12.99", BTPAlignmentType.left);
  printerInfoHelper.appendSpaceLine();

  // Barcode
  printerInfoHelper.appendBarCode(
    "1234567890123",
    250,
    BTPAlignmentType.center
  );
  printerInfoHelper.appendCutpage();

  var jsonString = printerInfoHelper.getPrinterInfoJsonString();
  printerHelper.setPrinterInfoAndPrinter(printSuccess, printError, jsonString);
}
```

## 🔍 Device Discovery & Connection

```javascript
// Start scanning for printers
function startScan() {
  printerHelper.scanForPeripherals(
    function (devices) {
      console.log("Found devices:", devices);
      // devices is an array: [{"name":"Printer_2EC1","uuid":"9A87E98E-BE88-5BA6-2C31-ED4869300E6E"}]
      displayDeviceList(devices);
    },
    function (error) {
      console.error("Scan error:", error);
    },
    1 // Keep scanning (1) or scan once (0)
  );
}

// Connect to selected printer
function connectToPrinter(deviceId) {
  printerHelper.connectPeripheral(
    function (success) {
      console.log("Connected successfully");
      // Ready to print
    },
    function (error) {
      console.error("Connection failed:", error);
    },
    deviceId
  );
}

// Check if still connected
function checkConnection() {
  printerHelper.isConnectPeripheral(
    function (status) {
      console.log("Connection status:", status); // "1" = connected, "0" = disconnected
    },
    function (error) {
      console.error("Status check failed:", error);
    }
  );
}
```

## 🎯 Framework Integration Examples

### Quasar Framework & Vue.js

For complete Quasar Framework and Vue.js integration examples, see the [`examples/quasar-vuejs/`](./examples/quasar-vuejs/) directory.

This example includes:

- **🎯 Vue 3 Composition API** - Modern, reusable `usePrinter` composable
- **📱 Quasar Components** - Complete `PrinterManager` component with beautiful UI
- **🔄 Reactive State Management** - Real-time connection status and device management
- **⚡ Error Handling** - User-friendly notifications and loading states
- **📋 Permission Management** - Automatic Android 12+ permission handling
- **🧪 Test Interface** - Built-in receipt and image printing functionality

Quick start:

```bash
cd examples/quasar-vuejs/
npm install
quasar dev -m cordova -T android
```

### Other Frameworks

We welcome contributions for other popular frameworks! Consider submitting examples for:

- **React Native** with Expo
- **Ionic Framework** with Angular/React
- **Flutter** with native plugins
- **PhoneGap/Apache Cordova** vanilla JavaScript

## 🖼️ Image Processing

The plugin automatically processes images for optimal thermal printing:

### Android Image Processing

- Converts images to 1-bit monochrome
- Removes transparency (adds white background)
- Resizes to fit printer width (typically 240px)
- Optimizes for 24-dot ESC/POS commands

### iOS Image Processing

- Grayscale conversion using standard weights (0.3R + 0.59G + 0.11B)
- Automatic bitmap context creation
- Built-in Base64 encoding/decoding

### Image Requirements

- **Format**: JPEG or PNG
- **Encoding**: Base64 string with data URI prefix
- **Width**: Recommended 240px or 384px (58mm/80mm printers)
- **Height**: Should be divisible by 24 pixels for best results

```javascript
// Image with data URI prefix
var imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL...";
printerInfoHelper.appendImage(imageData, 240, BTPAlignmentType.center);
```

## 🛠️ Technical Details

### ESC/POS Commands

The plugin generates standard ESC/POS commands:

- **Text printing**: Direct byte array transmission with GBK encoding (Android)
- **Image printing**: `ESC * n nL nH [bitmap data]` commands
- **Formatting**: ESC commands for alignment, fonts, line spacing
- **Paper cutting**: `ESC m` command for automatic cutter

### Bluetooth Protocols

- **Android**: Bluetooth Classic with SPP profile
- **iOS**: Bluetooth Low Energy with automatic service/characteristic discovery
- **Connection management**: Auto-reconnect and connection status monitoring

### Memory Management

- **Android**: Pre-allocated buffers for bitmap processing (`width * height / 8 + 1000`)
- **iOS**: Proper CGContext and CGImage lifecycle management
- **Data chunking**: Automatic data splitting for BLE characteristics

## 🐛 Troubleshooting

### Common Issues

1. **Print Quality Problems**

   - Ensure image dimensions are multiples of 8/24 pixels
   - Check bitmap conversion maintains proper contrast
   - Verify ESC/POS commands match printer specifications

2. **Bluetooth Connection Issues**

   - **Android**: Verify UUID compatibility (`00001101-0000-1000-8000-00805F9B34FB`)
   - **iOS**: Check service and characteristic UUIDs match printer
   - Handle connection timeouts and implement retry logic

3. **Permission Issues (Android 12+)**

   - Request runtime permissions for `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`
   - Check that location services are enabled on the device

4. **Character Encoding Issues**
   - **Android**: Plugin handles UTF-8 → GBK conversion automatically
   - Special characters may not display correctly on all printers

### Debug Mode

```javascript
// Enable debug logging (iOS)
printerHelper.printOCLog(
  function (success) {
    console.log("Debug:", success);
  },
  function (error) {
    console.error("Debug error:", error);
  },
  "Your debug message"
);
```

## 📄 License

MIT License - see [LICENSE](https://opensource.org/licenses/MIT) for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kikwaib/BluetoothPrinter/issues)
- **Documentation**: [Plugin Documentation](https://github.com/kikwaib/BluetoothPrinter)

## 🏷️ Version History

See [Releases](https://github.com/kikwaib/BluetoothPrinter/releases) for version history and changelog.
