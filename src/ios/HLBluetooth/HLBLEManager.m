//
//  HLBLEManager.m
//  HLBluetoothDemo
//
//  Created by Harvey on 16/4/27.
//  Copyright © 2016年 Halley. All rights reserved.
//

#import "HLBLEManager.h"

// When sending data, segmentation length is needed. Some printers will produce garbled characters if data sent at once is too long, requiring segmented transmission. This length value may vary for different printers, you need to debug and set an appropriate value (preferably an even number)
#define kLimitLength    146

@interface HLBLEManager ()<CBCentralManagerDelegate,CBPeripheralDelegate>

@property (strong, nonatomic) CBCentralManager  *centralManager;        /**< Central manager */
@property (strong, nonatomic) CBPeripheral      *connectedPerpheral;    /**< Currently connected peripheral */

@property (strong, nonatomic) NSArray<CBUUID *> *serviceUUIDs;          /**< UUIDs of services to search for */
@property (strong, nonatomic) NSArray<CBUUID *> *characteristicUUIDs;   /**< UUIDs of characteristics to search for */

@property (assign, nonatomic) BOOL              stopScanAfterConnected;  /**< Whether to stop scanning Bluetooth devices after successful connection */

@property (assign, nonatomic) NSInteger         writeCount;         /**< Write count */
@property (assign, nonatomic) NSInteger         responseCount;      /**< Response count */

@end

static HLBLEManager *instance = nil;

@implementation HLBLEManager

+ (instancetype)sharedInstance{
    return [[self alloc] init];
}

- (instancetype)init {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [super init];
        //Alert dialog when Bluetooth is not enabled
        NSDictionary *options = @{CBCentralManagerOptionShowPowerAlertKey:@(YES)};
        _centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:dispatch_get_main_queue() options:options];
        _limitLength = kLimitLength;
    });
    
    return instance;
}

+ (instancetype)allocWithZone:(struct _NSZone *)zone{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [super allocWithZone:zone];
    });
    return instance;
}

/** Start searching for Bluetooth peripherals, returning one Bluetooth peripheral info in block each time */
- (void)scanForPeripheralsWithServiceUUIDs:(NSArray<CBUUID *> *)uuids options:(NSDictionary<NSString *, id> *)options{
    [_centralManager scanForPeripheralsWithServices:uuids options:options];
}

- (void)scanForPeripheralsWithServiceUUIDs:(NSArray<CBUUID *> *)uuids options:(NSDictionary<NSString *, id> *)options didDiscoverPeripheral:(HLDiscoverPeripheralBlock)discoverBlock{
    _discoverPeripheralBlcok = discoverBlock;
    [_centralManager scanForPeripheralsWithServices:uuids options:options];
}


/** Connect to a Bluetooth peripheral and query services, characteristics, and characteristic descriptors */
- (void)connectPeripheral:(CBPeripheral *)peripheral
           connectOptions:(NSDictionary<NSString *,id> *)connectOptions
   stopScanAfterConnected:(BOOL)stop
          servicesOptions:(NSArray<CBUUID *> *)serviceUUIDs
   characteristicsOptions:(NSArray<CBUUID *> *)characteristicUUIDs
            completeBlock:(HLBLECompletionBlock)completionBlock{
    
    //1. Save callback block and parameters
    _completionBlock = completionBlock;
    _serviceUUIDs = serviceUUIDs;
    _characteristicUUIDs = characteristicUUIDs;
    _stopScanAfterConnected = stop;
    
    //2. First cancel previously connected Bluetooth peripheral
    if (_connectedPerpheral) {
        [_centralManager cancelPeripheralConnection:_connectedPerpheral];
    }
    
    //3. Start connecting to new Bluetooth peripheral
    [_centralManager connectPeripheral:peripheral options:connectOptions];
    //4. Set delegate
    peripheral.delegate = self;
}


/** Find sub-services of a service */
- (void)discoverIncludedServices:(NSArray<CBUUID *> *)includedServiceUUIDs forService:(CBService *)service{
    [_connectedPerpheral discoverIncludedServices:includedServiceUUIDs forService:service];
}

#pragma mark - ***** 特性 *****
/** Read value of a characteristic */
- (void)readValueForCharacteristic:(CBCharacteristic *)characteristic{
    [_connectedPerpheral readValueForCharacteristic:characteristic];
}

- (void)readValueForCharacteristic:(CBCharacteristic *)characteristic completionBlock:(HLValueForCharacteristicBlock)completionBlock{
    _valueForCharacteristicBlock = completionBlock;
    [self readValueForCharacteristic:characteristic];
}

/** Write data to a characteristic */
- (void)writeValue:(NSData *)data forCharacteristic:(CBCharacteristic *)characteristic type:(CBCharacteristicWriteType)type{
    _writeCount = 0;
    _responseCount = 0;
    // iOS 9 以后，系统添加了这个API来获取特性能写入的最大长度
    if ([_connectedPerpheral respondsToSelector:@selector(maximumWriteValueLengthForType:)]) {
        _limitLength = [_connectedPerpheral maximumWriteValueLengthForType:type];
    }
    
    // 如果_limitLength 小于等于0，则表示不用分段发送
    if (_limitLength <= 0) {
        [_connectedPerpheral writeValue:data forCharacteristic:characteristic type:type];
        _writeCount ++;
        return;
    }
    
    if (data.length <= _limitLength) {
        [_connectedPerpheral writeValue:data forCharacteristic:characteristic type:type];
        _writeCount ++;
    } else {
        NSInteger index = 0;
        for (index = 0; index < data.length - _limitLength; index += _limitLength) {
            NSData *subData = [data subdataWithRange:NSMakeRange(index, _limitLength)];
            [_connectedPerpheral writeValue:subData forCharacteristic:characteristic type:type];
            _writeCount++;
        }
        NSData *leftData = [data subdataWithRange:NSMakeRange(index, data.length - index)];
        if (leftData) {
            [_connectedPerpheral writeValue:leftData forCharacteristic:characteristic type:type];
            _writeCount++;
        }
    }
}

- (void)writeValue:(NSData *)data forCharacteristic:(CBCharacteristic *)characteristic type:(CBCharacteristicWriteType)type completionBlock:(HLWriteToCharacteristicBlock)completionBlock{
    _writeToCharacteristicBlock = completionBlock;
    [self writeValue:data forCharacteristic:characteristic type:type];
}


#pragma mark - ***** 描述 *****
/** Read descriptor information of a characteristic */
- (void)readValueForDescriptor:(CBDescriptor *)descriptor{
    [_connectedPerpheral readValueForDescriptor:descriptor];
}

- (void)readValueForDescriptor:(CBDescriptor *)descriptor completionBlock:(HLValueForDescriptorBlock)completionBlock{
    _valueForDescriptorBlock = completionBlock;
    [self readValueForDescriptor:descriptor];
}

/** Write data to characteristic descriptor */
- (void)writeValue:(NSData *)data forDescriptor:(CBDescriptor *)descriptor{
    [_connectedPerpheral writeValue:data forDescriptor:descriptor];
}

- (void)writeValue:(NSData *)data forDescriptor:(CBDescriptor *)descriptor completionBlock:(HLWriteToDescriptorBlock)completionBlock{
    _writeToDescriptorBlock = completionBlock;
    [self writeValue:data forDescriptor:descriptor];
}


/** Get signal strength of a peripheral */
- (void)readRSSICompletionBlock:(HLGetRSSIBlock)getRSSIBlock{
    _getRSSIBlock = getRSSIBlock;
    [_connectedPerpheral readRSSI];
}


/** Stop scanning */
- (void)stopScan{
    [_centralManager stopScan];
    _discoverPeripheralBlcok = nil;
}

/** Disconnect Bluetooth connection */
- (void)cancelPeripheralConnection{
    if (_connectedPerpheral) {
        [_centralManager cancelPeripheralConnection:_connectedPerpheral];
    }
}




#pragma mark - CBCentralManagerDelegate
- (void)centralManagerDidUpdateState:(CBCentralManager *)central{
    [[NSNotificationCenter defaultCenter] postNotificationName:kCentralManagerStateUpdateNoticiation object:@{@"central":central}];
    
    if (_stateUpdateBlock) {
        _stateUpdateBlock(central);
    }
}

- (void)centralManager:(CBCentralManager *)central didDiscoverPeripheral:(CBPeripheral *)peripheral advertisementData:(NSDictionary<NSString *, id> *)advertisementData RSSI:(NSNumber *)RSSI{
    if (_discoverPeripheralBlcok) {
        _discoverPeripheralBlcok(central, peripheral, advertisementData, RSSI);
    }
}

#pragma mark ---------------- 连接外设成功和失败的代理 ---------------
- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral{
    _connectedPerpheral = peripheral;
   
    if (_stopScanAfterConnected) {
        [_centralManager stopScan];
    }
    
    if (_discoverServicesBlock) {
        _discoverServicesBlock(peripheral, peripheral.services,nil);
    }
    
    if (_completionBlock) {
        _completionBlock(HLOptionStageConnection,peripheral,nil,nil,nil);
    }
    
    [peripheral discoverServices:_serviceUUIDs];
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(nullable NSError *)error{
    if (_discoverServicesBlock) {
        _discoverServicesBlock(peripheral, peripheral.services,error);
    }
    
    if (_completionBlock) {
        _completionBlock(HLOptionStageConnection,peripheral,nil,nil,error);
    }
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(nullable NSError *)error{
    _connectedPerpheral = nil;
    NSLog(@"Disconnected, disconnected %@",error);
}

#pragma mark ---------------- Service discovery delegate -----------------
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(nullable NSError *)error{
    if (error) {
        if (_completionBlock) {
            _completionBlock(HLOptionStageSeekServices,peripheral,nil,nil,error);
        }
        return;
    }
    
    if (_completionBlock) {
        _completionBlock(HLOptionStageSeekServices,peripheral,nil,nil,nil);
    }
    
    for (CBService *service in peripheral.services) {
        [peripheral discoverCharacteristics:_characteristicUUIDs forService:service];
    }
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverIncludedServicesForService:(CBService *)service error:(nullable NSError *)error{
    if (error) {
        if (_discoverdIncludedServicesBlock) {
            _discoverdIncludedServicesBlock(peripheral,service,nil,error);
        }
        return;
    }
    
    if (_discoverdIncludedServicesBlock) {
        _discoverdIncludedServicesBlock(peripheral,service,service.includedServices,error);
    }
}

#pragma mark ---------------- Service characteristics delegate --------------------
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(nullable NSError *)error{
    if (error) {
        if (_completionBlock) {
            _completionBlock(HLOptionStageSeekCharacteristics,peripheral,service,nil,error);
        }
        return;
    }
    
    if (_discoverCharacteristicsBlock) {
        _discoverCharacteristicsBlock(peripheral,service,service.characteristics,nil);
    }
    
    if (_completionBlock) {
        _completionBlock(HLOptionStageSeekCharacteristics,peripheral,service,nil,nil);
    }
    
    for (CBCharacteristic *character in service.characteristics) {
        [peripheral discoverDescriptorsForCharacteristic:character];
        [peripheral readValueForCharacteristic:character];
    }

}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(nullable NSError *)error{
    if (error) {
        if (_notifyCharacteristicBlock) {
            _notifyCharacteristicBlock(peripheral,characteristic,error);
        }
        return;
    }
    if (_notifyCharacteristicBlock) {
        _notifyCharacteristicBlock(peripheral,characteristic,nil);
    }
}

// Read value from characteristic
- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error{
    if (error) {
        if (_valueForCharacteristicBlock) {
            _valueForCharacteristicBlock(characteristic,nil,error);
        }
        return;
    }
    
//    
    NSData *data = characteristic.value;
//    if (data.length > 0) {
//        const unsigned char *hexBytesLight = [data bytes];
//        
//        NSString * battery = [NSString stringWithFormat:@"%02x", hexBytesLight[0]];
//        
//        NSLog(@"batteryInfo:%@",battery);        
//    }
    
    if (_valueForCharacteristicBlock) {
        _valueForCharacteristicBlock(characteristic,data,nil);
    }
}

#pragma mark ---------------- Service characteristic descriptor discovery delegate ------------------
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic error:(nullable NSError *)error{
    if (error) {
        if (_completionBlock) {
            _completionBlock(HLOptionStageSeekdescriptors,peripheral,nil,characteristic,error);
        }
        return;
    }
    
    if (_completionBlock) {
        _completionBlock(HLOptionStageSeekdescriptors,peripheral,nil,characteristic,nil);
    }
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor error:(nullable NSError *)error{
    if (error) {
        if (_valueForDescriptorBlock) {
            _valueForDescriptorBlock(descriptor,nil,error);
        }
        return;
    }
    
    NSData *data = descriptor.value;
    if (_valueForDescriptorBlock) {
        _valueForDescriptorBlock(descriptor,data,nil);
    }
}

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(nullable NSError *)error{
    if (error) {
        if (_writeToDescriptorBlock) {
            _writeToDescriptorBlock(descriptor, error);
        }
        return;
    }
    
    if (_writeToDescriptorBlock) {
        _writeToDescriptorBlock(descriptor, nil);
    }
}

#pragma mark ---------------- Write data callback --------------------
- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(nullable NSError *)error{
    if (!_writeToCharacteristicBlock) {
        return;
    }
    
    _responseCount ++;
    if (_writeCount != _responseCount) {
        return;
    }
    
    _writeToCharacteristicBlock(characteristic,error);
}

#pragma mark ---------------- Signal strength callback ------------------
# if  __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0
- (void)peripheralDidUpdateRSSI:(CBPeripheral *)peripheral error:(nullable NSError *)error {
    if (_getRSSIBlock) {
        _getRSSIBlock(peripheral,peripheral.RSSI,error);
    }
}
#else
- (void)peripheral:(CBPeripheral *)peripheral didReadRSSI:(NSNumber *)RSSI error:(NSError *)error {
    if (_getRSSIBlock) {
        _getRSSIBlock(peripheral,RSSI,error);
    }
}
#endif



@end
