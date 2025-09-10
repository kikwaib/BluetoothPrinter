# AI Coding Agent Instructions for Cordova Bluetooth Printer Plugin

## Project Overview

This is a Cordova plugin (`@kikwaib/cordova-plugin-bluetooth-printer`) that provides cross-platform Bluetooth thermal printer functionality for mobile applications. The plugin supports both iOS and Android platforms and implements ESC/POS printing protocols.

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                JavaScript API Layer                 │
│            (www/BluetoothPrinter.js)                │
├─────────────────────────────────────────────────────┤
│              Cordova Bridge Layer                   │
│             (plugin.xml config)                     │
├─────────────┬───────────────────────────────────────┤
│  Android    │              iOS                      │
│  Platform   │           Platform                    │
├─────────────┴───────────────────────────────────────┤
│         Native Implementations                      │
│   - Bluetooth Management                            │
│   - ESC/POS Command Generation                      │
│   - Image Processing & Printing                     │
└─────────────────────────────────────────────────────┘
```

## Core Components

### 1. JavaScript API Layer (`www/BluetoothPrinter.js`)

**Primary Class: `BluetoothPrinter`**

- Main interface for Cordova apps
- Bridges JavaScript calls to native implementations via `cordova.exec()`
- Methods mirror native implementation capabilities

**Helper Class: `PrinterInfoHelper`**

- Builder pattern for constructing print jobs
- Chains method calls to build complex print configurations
- Example: `helper.addText("Hello").addImage(base64).printResult()`

**Key Enums:**

- `BTPInfoType`: Print content types (text=0, image=4, separator=5, newline=6, etc.)
- `BTPFontType`: Font styles (normal=0, bold=1, etc.)
- `BTPAlignmentType`: Text alignment (left=0, center=1, right=2)

### 2. Android Implementation (`src/android/MKBluetoothPrinter.java`)

**Key Responsibilities:**

- Bluetooth Classic device scanning and pairing
- ESC/POS command generation for thermal printers
- Image processing and bitmap conversion for printing
- Text encoding handling (UTF-8 to GBK conversion)

**Critical Methods:**

- `execute()`: Main Cordova entry point handling all JavaScript calls
- `sendprint()`: Processes print job arrays from PrinterInfoHelper
- `draw2PxPoint()`: Converts bitmaps to ESC/POS-compatible byte arrays
- `compressPic()`: Image preprocessing for optimal print quality

**Image Processing Pipeline:**

1. Base64 decode → Bitmap object
2. Transparency removal (white background)
3. Bitmap to 1-bit monochrome conversion
4. ESC/POS command generation with proper line spacing

### 3. iOS Implementation (`src/ios/`)

**Modular Architecture:**

- `MKBluetoothPrinter.h/.m`: Main plugin class implementing Cordova interface
- `HLBLEManager`: Core Bluetooth Low Energy management
- `HLPrinter`: Print job processing and ESC/POS generation
- `UIImage+Bitmap`: Image processing extensions

**Key Features:**

- Core Bluetooth framework integration
- Automatic data chunking for BLE characteristics (limitLength property)
- Advanced image processing with grayscale conversion
- Service and characteristic discovery automation

## Development Patterns

### 1. Print Job Construction Pattern

```javascript
// Use PrinterInfoHelper builder pattern
var helper = new BluetoothPrinter.PrinterInfoHelper();
helper
  .addText("Store Receipt", BTPFontType.BOLD, BTPAlignmentType.CENTER)
  .addSeparator()
  .addText("Item: Coffee - $3.50")
  .addImage(base64ImageData)
  .printResult();
```

### 2. Bluetooth Connection Flow

1. **Scan for devices**: `listBluetoothDevice()`
2. **Connect to printer**: `connectBluetoothDevice()`
3. **Send print jobs**: Use PrinterInfoHelper or direct `printText()`
4. **Handle callbacks**: All methods use success/error callback pattern

### 3. Image Processing Requirements

**Android specifics:**

- Images must be resized to fit printer width (typically 240px)
- Height should be divisible by 24 pixels for optimal ESC/POS processing
- Use `compressPic()` to remove transparency and ensure proper contrast

**iOS specifics:**

- Automatic bitmap context creation with proper color space
- Grayscale conversion using standard weights (0.3R + 0.59G + 0.11B)
- Built-in Base64 encoding/decoding for image transfer

## Platform-Specific Considerations

### Android (`src/android/MKBluetoothPrinter.java`)

**Bluetooth Permissions:**

```xml
**Android:**
- Minimum SDK version: 19 (Android 4.4+)
- Target SDK version: 33
- Bluetooth Classic support for thermal printer connections
- Runtime permission handling required for Android 6.0+ (especially Android 12+)
- ProGuard rules if using code obfuscation
- Location permission required for Bluetooth device discovery on Android 6.0+
```

**String Encoding:**

- Default: UTF-8 → GBK conversion for Chinese character support
- Method: `stringToBytes()` handles encoding transformations
- Print commands use GBK encoding: `text.getBytes("gbk")`

**Memory Management:**

- Large bitmap processing requires careful buffer allocation
- `draw2PxPoint()` pre-allocates with safety margin: `width * height / 8 + 1000`

### iOS (`src/ios/`)

**Core Bluetooth Integration:**

- Automatic service discovery for printer characteristics
- Write chunking based on characteristic maximum length
- Proper delegate pattern implementation for async operations

**Memory Considerations:**

- CGContext and CGImage objects require manual release
- Bitmap data allocation uses malloc/free for pixel manipulation
- NSData containers manage ESC/POS command byte arrays

## ESC/POS Command Generation

Both platforms generate standardized ESC/POS commands:

**Common Commands:**

- Text printing: Direct byte array transmission
- Image printing: ESC \* commands with bitmap data
- Formatting: ESC commands for alignment, fonts, line spacing
- Paper cutting: ESC m command for automatic cutter

**Image Command Structure:**

```
ESC * n nL nH [bitmap data]
- n: Print mode (0=8-dot, 1=8-dot double density, 33=24-dot)
- nL, nH: Image width in bytes (little-endian)
- bitmap data: 1-bit per pixel, organized in byte columns
```

## Testing and Debugging

### Common Issues

1. **Print Quality Problems:**

   - Check image dimensions (should be multiples of 8/24 pixels)
   - Verify bitmap conversion maintains proper contrast
   - Ensure ESC/POS commands match printer specifications

2. **Bluetooth Connection Issues:**

   - Android: Check UUID compatibility (`00001101-0000-1000-8000-00805F9B34FB`)
   - iOS: Verify service and characteristic UUIDs match printer
   - Both: Handle connection timeouts and retry logic

3. **Character Encoding Issues:**
   - Android: Ensure UTF-8 → GBK conversion for international characters
   - iOS: Verify NSString encoding matches printer expectations

### Development Tools

**Recommended Testing:**

- Physical thermal printers (58mm/80mm width common)
- Bluetooth scanner apps to verify device discovery
- Hex editors to validate ESC/POS command generation
- Image processing tools to verify bitmap conversion

## Plugin Configuration

### Key Files

**`plugin.xml`**: Defines platform-specific file mappings and permissions
**`package.json`**: NPM publishing configuration and dependencies
**`examples/index.html`**: Reference implementation showing plugin usage

### Build Requirements

**Android:**

- Minimum SDK version support for Bluetooth Classic
- ProGuard rules if using code obfuscation

**iOS:**

- Core Bluetooth framework linking
- Background modes for Bluetooth peripheral connections
- iOS deployment target for Core Bluetooth support

## Extension Points

### Adding New Features

1. **New Print Commands:**

   - Extend PrinterInfoHelper with new info types
   - Implement corresponding native processing in both platforms
   - Update enums and method signatures consistently

2. **Additional Printers:**

   - Research printer-specific ESC/POS command variations
   - Implement printer detection and capability negotiation
   - Add configuration options for different thermal printer models

3. **Enhanced Image Processing:**
   - Add dithering algorithms for better print quality
   - Implement automatic image scaling and optimization
   - Support additional image formats beyond Base64 JPEG/PNG

## Code Quality Standards

- **Consistent Error Handling**: Use Cordova callback patterns throughout
- **Memory Management**: Proper cleanup of native resources (bitmaps, contexts)
- **Async Operations**: Non-blocking UI for Bluetooth operations
- **Modular Design**: Keep platform-specific code isolated and well-documented
- **Translation**: All comments should be in English for international development

This plugin represents a mature implementation of thermal printer integration with careful attention to platform-specific Bluetooth handling and ESC/POS protocol requirements.
