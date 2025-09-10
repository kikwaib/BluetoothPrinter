<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Bluetooth Printer</div>
        <div class="text-subtitle2 text-grey-7">
          Manage your thermal printer connection
        </div>
      </div>
      <div class="col-auto">
        <q-chip 
          :color="connectionStatus === 'connected' ? 'positive' : 'negative'"
          text-color="white"
          icon="bluetooth"
          :label="connectionStatus.toUpperCase()"
        />
      </div>
    </div>

    <!-- Plugin Status Alert -->
    <q-banner 
      v-if="!isPluginAvailable" 
      class="bg-negative text-white q-mb-md"
      rounded
    >
      <template v-slot:avatar>
        <q-icon name="warning" />
      </template>
      Bluetooth Printer plugin is not available. Make sure you're running on a device with Cordova.
    </q-banner>

    <!-- Connection Section -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="bluetooth_searching" class="q-mr-sm" />
          Device Connection
        </div>
        
        <!-- Current Device Info -->
        <div v-if="currentDevice" class="q-mb-md">
          <q-item class="bg-blue-1 rounded-borders">
            <q-item-section avatar>
              <q-icon name="bluetooth_connected" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ currentDevice.name || 'Unknown Device' }}</q-item-label>
              <q-item-label caption>{{ currentDevice.address }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn 
                flat 
                round 
                color="negative" 
                icon="bluetooth_disabled"
                @click="handleDisconnect"
                :disable="connectionStatus === 'connecting'"
              >
                <q-tooltip>Disconnect</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </div>

        <!-- Scan Controls -->
        <div class="row q-gutter-md q-mb-md">
          <q-btn 
            color="primary" 
            icon="search"
            label="Scan Devices"
            @click="handleScan"
            :loading="isScanning"
            :disable="!isPluginAvailable || connectionStatus === 'connecting'"
          />
          
          <q-btn 
            v-if="isConnected"
            color="negative" 
            icon="bluetooth_disabled"
            label="Disconnect"
            @click="handleDisconnect"
            :disable="connectionStatus === 'connecting'"
          />
        </div>

        <!-- Available Devices -->
        <div v-if="availableDevices.length > 0">
          <div class="text-subtitle2 q-mb-sm">Available Devices:</div>
          <q-list bordered separator>
            <q-item 
              v-for="device in availableDevices" 
              :key="device.address"
              clickable
              @click="handleConnect(device)"
              :disable="connectionStatus === 'connecting'"
            >
              <q-item-section avatar>
                <q-icon 
                  :name="isConnected && currentDevice?.address === device.address ? 'bluetooth_connected' : 'bluetooth'" 
                  :color="isConnected && currentDevice?.address === device.address ? 'positive' : 'grey'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ device.name || 'Unknown Device' }}</q-item-label>
                <q-item-label caption>{{ device.address }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon 
                  v-if="isConnected && currentDevice?.address === device.address"
                  name="check_circle" 
                  color="positive" 
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>

    <!-- Print Test Section -->
    <q-card v-if="isConnected" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="print" class="q-mr-sm" />
          Print Tests
        </div>

        <!-- Quick Print Test -->
        <div class="q-mb-md">
          <q-input
            v-model="testText"
            outlined
            label="Test Text"
            placeholder="Enter text to print..."
            class="q-mb-md"
          />
          
          <q-btn 
            color="primary" 
            icon="print"
            label="Print Text"
            @click="handlePrintText"
            :disable="!testText.trim()"
            class="q-mr-md"
          />
        </div>

        <q-separator class="q-my-md" />

        <!-- Receipt Test -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Sample Receipt:</div>
          <q-btn 
            color="secondary" 
            icon="receipt"
            label="Print Sample Receipt"
            @click="handlePrintReceipt"
            class="q-mr-md"
          />
        </div>

        <q-separator class="q-my-md" />

        <!-- Image Test -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Print Image:</div>
          <q-file
            v-model="imageFile"
            outlined
            label="Select Image"
            accept="image/*"
            @input="handleImageSelect"
            class="q-mb-md"
          />
          
          <q-btn 
            v-if="base64Image"
            color="accent" 
            icon="image"
            label="Print Image"
            @click="handlePrintImage"
            class="q-mr-md"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Device Info -->
    <q-card v-if="availableDevices.length === 0 && !isScanning">
      <q-card-section class="text-center">
        <q-icon name="bluetooth_searching" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-7">No Devices Found</div>
        <div class="text-body2 text-grey-5 q-mb-md">
          Tap "Scan Devices" to search for nearby Bluetooth printers
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { usePrinter } from '../composables/usePrinter'

// Use the printer composable
const {
  isPluginAvailable,
  isConnected,
  currentDevice,
  availableDevices,
  isScanning,
  connectionStatus,
  scanDevices,
  connectDevice,
  disconnect,
  printText,
  printReceipt,
  printImage
} = usePrinter()

// Local reactive data
const testText = ref('Hello from Quasar!\nThis is a test print.\n\n')
const imageFile = ref(null)
const base64Image = ref('')

// Methods
const handleScan = async () => {
  try {
    await scanDevices()
  } catch (error) {
    console.error('Scan failed:', error)
  }
}

const handleConnect = async (device) => {
  try {
    await connectDevice(device)
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

const handleDisconnect = async () => {
  try {
    await disconnect()
  } catch (error) {
    console.error('Disconnect failed:', error)
  }
}

const handlePrintText = async () => {
  try {
    await printText(testText.value)
  } catch (error) {
    console.error('Print failed:', error)
  }
}

const handlePrintReceipt = async () => {
  const sampleReceipt = {
    storeName: 'Quasar Coffee Shop',
    storeAddress: '123 Vue Street, JS City',
    items: [
      { name: 'Espresso', price: '$3.50' },
      { name: 'Croissant', price: '$2.25' },
      { name: 'Orange Juice', price: '$2.75' }
    ],
    total: '$8.50'
  }

  try {
    await printReceipt(sampleReceipt)
  } catch (error) {
    console.error('Receipt print failed:', error)
  }
}

const handleImageSelect = (file) => {
  if (!file) {
    base64Image.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    // Remove data URL prefix to get pure base64
    const base64 = e.target.result.split(',')[1]
    base64Image.value = base64
  }
  reader.readAsDataURL(file)
}

const handlePrintImage = async () => {
  if (!base64Image.value) return

  try {
    await printImage(base64Image.value)
  } catch (error) {
    console.error('Image print failed:', error)
  }
}
</script>

<style scoped>
.q-page {
  max-width: 800px;
  margin: 0 auto;
}

.q-card {
  border-radius: 12px;
}

.q-chip {
  font-weight: 600;
}
</style>