/**
 * Bluetooth Printer Composable for Vue 3
 * Provides reactive state management and printer functionality
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { Notify, Loading } from 'quasar'

export function usePrinter() {
  // Reactive state
  const isConnected = ref(false)
  const currentDevice = ref(null)
  const availableDevices = ref([])
  const isScanning = ref(false)
  const connectionStatus = ref('disconnected') // 'disconnected', 'connecting', 'connected'

  // Check if plugin is available
  const isPluginAvailable = ref(false)

  onMounted(() => {
    // Check if Cordova and the plugin are available
    if (window.cordova && window.BluetoothPrinter) {
      isPluginAvailable.value = true
      console.log('Bluetooth Printer plugin is available')
    } else {
      console.log('Bluetooth Printer plugin not available')
    }
  })

  /**
   * Request Android 12+ permissions
   */
  const requestPermissions = async () => {
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.permissions) {
      return Promise.resolve()
    }

    const permissions = [
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION'
    ]

    return new Promise((resolve, reject) => {
      window.cordova.plugins.permissions.requestPermissions(
        permissions,
        (result) => {
          console.log('Permissions result:', result)
          resolve(result)
        },
        (error) => {
          console.error('Permission error:', error)
          reject(error)
        }
      )
    })
  }

  /**
   * Scan for available Bluetooth devices
   */
  const scanDevices = async () => {
    if (!isPluginAvailable.value) {
      throw new Error('Bluetooth Printer plugin not available')
    }

    isScanning.value = true
    Loading.show({
      message: 'Scanning for printers...'
    })

    try {
      // Request permissions first (Android 12+)
      await requestPermissions()

      return new Promise((resolve, reject) => {
        window.BluetoothPrinter.listBluetoothDevice(
          (devices) => {
            console.log('Found devices:', devices)
            availableDevices.value = devices
            isScanning.value = false
            Loading.hide()
            
            Notify.create({
              type: 'positive',
              message: `Found ${devices.length} device(s)`,
              position: 'top'
            })
            
            resolve(devices)
          },
          (error) => {
            console.error('Scan error:', error)
            isScanning.value = false
            Loading.hide()
            
            Notify.create({
              type: 'negative',
              message: 'Failed to scan devices: ' + error,
              position: 'top'
            })
            
            reject(error)
          }
        )
      })
    } catch (error) {
      isScanning.value = false
      Loading.hide()
      throw error
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  const connectDevice = async (device) => {
    if (!isPluginAvailable.value) {
      throw new Error('Bluetooth Printer plugin not available')
    }

    connectionStatus.value = 'connecting'
    Loading.show({
      message: `Connecting to ${device.name || device.address}...`
    })

    return new Promise((resolve, reject) => {
      window.BluetoothPrinter.connectBluetoothDevice(
        device.address,
        () => {
          console.log('Connected to device:', device)
          isConnected.value = true
          currentDevice.value = device
          connectionStatus.value = 'connected'
          Loading.hide()
          
          Notify.create({
            type: 'positive',
            message: `Connected to ${device.name || device.address}`,
            position: 'top'
          })
          
          resolve(device)
        },
        (error) => {
          console.error('Connection error:', error)
          connectionStatus.value = 'disconnected'
          Loading.hide()
          
          Notify.create({
            type: 'negative',
            message: 'Failed to connect: ' + error,
            position: 'top'
          })
          
          reject(error)
        }
      )
    })
  }

  /**
   * Disconnect from current device
   */
  const disconnect = async () => {
    if (!isPluginAvailable.value || !isConnected.value) {
      return
    }

    return new Promise((resolve, reject) => {
      window.BluetoothPrinter.disconnectBluetoothDevice(
        () => {
          console.log('Disconnected from device')
          isConnected.value = false
          currentDevice.value = null
          connectionStatus.value = 'disconnected'
          
          Notify.create({
            type: 'info',
            message: 'Disconnected from printer',
            position: 'top'
          })
          
          resolve()
        },
        (error) => {
          console.error('Disconnect error:', error)
          
          Notify.create({
            type: 'negative',
            message: 'Failed to disconnect: ' + error,
            position: 'top'
          })
          
          reject(error)
        }
      )
    })
  }

  /**
   * Print text directly
   */
  const printText = async (text) => {
    if (!isPluginAvailable.value || !isConnected.value) {
      throw new Error('Not connected to a printer')
    }

    Loading.show({
      message: 'Printing...'
    })

    return new Promise((resolve, reject) => {
      window.BluetoothPrinter.printText(
        text,
        () => {
          console.log('Print successful')
          Loading.hide()
          
          Notify.create({
            type: 'positive',
            message: 'Print completed successfully',
            position: 'top'
          })
          
          resolve()
        },
        (error) => {
          console.error('Print error:', error)
          Loading.hide()
          
          Notify.create({
            type: 'negative',
            message: 'Print failed: ' + error,
            position: 'top'
          })
          
          reject(error)
        }
      )
    })
  }

  /**
   * Print using PrinterInfoHelper (advanced formatting)
   */
  const printReceipt = async (receiptData) => {
    if (!isPluginAvailable.value || !isConnected.value) {
      throw new Error('Not connected to a printer')
    }

    Loading.show({
      message: 'Printing receipt...'
    })

    try {
      const helper = new window.BluetoothPrinter.PrinterInfoHelper()
      
      // Add receipt header
      helper.addText(receiptData.storeName || 'Store Receipt', 
        window.BluetoothPrinter.BTPFontType.BOLD, 
        window.BluetoothPrinter.BTPAlignmentType.CENTER)
      
      helper.addText(receiptData.storeAddress || '', 
        window.BluetoothPrinter.BTPFontType.NORMAL, 
        window.BluetoothPrinter.BTPAlignmentType.CENTER)
      
      helper.addSeparator()
      
      // Add items
      if (receiptData.items) {
        receiptData.items.forEach(item => {
          const line = `${item.name.padEnd(20)} ${item.price.toString().padStart(8)}`
          helper.addText(line, 
            window.BluetoothPrinter.BTPFontType.NORMAL, 
            window.BluetoothPrinter.BTPAlignmentType.LEFT)
        })
      }
      
      helper.addSeparator()
      
      // Add total
      if (receiptData.total) {
        helper.addText(`TOTAL: ${receiptData.total}`, 
          window.BluetoothPrinter.BTPFontType.BOLD, 
          window.BluetoothPrinter.BTPAlignmentType.RIGHT)
      }
      
      // Add footer
      helper.addText('Thank you for your business!', 
        window.BluetoothPrinter.BTPFontType.NORMAL, 
        window.BluetoothPrinter.BTPAlignmentType.CENTER)
      
      helper.addText('Visit us again soon!', 
        window.BluetoothPrinter.BTPFontType.NORMAL, 
        window.BluetoothPrinter.BTPAlignmentType.CENTER)

      return new Promise((resolve, reject) => {
        helper.printResult(
          () => {
            console.log('Receipt printed successfully')
            Loading.hide()
            
            Notify.create({
              type: 'positive',
              message: 'Receipt printed successfully',
              position: 'top'
            })
            
            resolve()
          },
          (error) => {
            console.error('Receipt print error:', error)
            Loading.hide()
            
            Notify.create({
              type: 'negative',
              message: 'Receipt print failed: ' + error,
              position: 'top'
            })
            
            reject(error)
          }
        )
      })
    } catch (error) {
      Loading.hide()
      throw error
    }
  }

  /**
   * Print image from base64 data
   */
  const printImage = async (base64Image) => {
    if (!isPluginAvailable.value || !isConnected.value) {
      throw new Error('Not connected to a printer')
    }

    Loading.show({
      message: 'Printing image...'
    })

    return new Promise((resolve, reject) => {
      window.BluetoothPrinter.printImage(
        base64Image,
        () => {
          console.log('Image printed successfully')
          Loading.hide()
          
          Notify.create({
            type: 'positive',
            message: 'Image printed successfully',
            position: 'top'
          })
          
          resolve()
        },
        (error) => {
          console.error('Image print error:', error)
          Loading.hide()
          
          Notify.create({
            type: 'negative',
            message: 'Image print failed: ' + error,
            position: 'top'
          })
          
          reject(error)
        }
      )
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (isConnected.value) {
      disconnect().catch(console.error)
    }
  })

  return {
    // State
    isPluginAvailable,
    isConnected,
    currentDevice,
    availableDevices,
    isScanning,
    connectionStatus,
    
    // Methods
    scanDevices,
    connectDevice,
    disconnect,
    printText,
    printReceipt,
    printImage,
    requestPermissions
  }
}