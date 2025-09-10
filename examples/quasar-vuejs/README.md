# Quasar Framework & Vue.js Integration

This example shows how to integrate the Bluetooth Printer Plugin with Quasar Framework and Vue.js applications.

## 📦 Installation for Quasar

```bash
# Create a new Quasar project (if starting fresh)
npm create quasar@latest my-pos-app

# Navigate to project
cd my-pos-app

# Add Cordova mode
quasar mode add cordova

# Add the Bluetooth Printer plugin
cd src-cordova
cordova plugin add @kikwaib/cordova-plugin-bluetooth-printer

# For Android 12+ permissions (optional)
cordova plugin add cordova-plugin-android-permissions
```

## 🏗️ Project Structure

```
src/
├── composables/
│   └── usePrinter.js          # Printer functionality composable
├── components/
│   └── PrinterManager.vue     # Printer management component
└── router/
    └── routes.js              # Router configuration
```

## 🚀 Usage in Quasar App

Add the component to your router (`src/router/routes.js`):

```javascript
const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/IndexPage.vue"),
      },
      {
        path: "/printer",
        component: () => import("components/PrinterManager.vue"),
      },
    ],
  },
];

export default routes;
```

## 🔨 Build and Run

```bash
# Build for Android
quasar build -m cordova -T android

# Run on device (with live reload)
quasar dev -m cordova -T android --ide

# Build for iOS
quasar build -m cordova -T ios
```

## ✨ Key Features

1. **🎯 Vue 3 Composition API** - Modern, reusable logic
2. **📱 Quasar Components** - Beautiful, mobile-first UI
3. **🔄 Reactive State Management** - Real-time connection status
4. **⚡ Error Handling** - User-friendly notifications
5. **🎨 Loading States** - Professional UX with loading indicators
6. **📋 Permission Management** - Automatic Android 12+ permissions
7. **🧪 Test Interface** - Built-in receipt testing functionality

This example provides a complete, production-ready integration that you can customize for your specific POS or receipt printing needs!
