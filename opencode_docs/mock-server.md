# Mock Server UDP Packet Format

## Overview

The mock-server sends UDP packets on port **5606** containing telemetry data from a racing simulator. This document describes the exact binary format of the packets.

**Total packet size**: 600 bytes (fixed)

---

## Packet Structure

### Header Section (Offset 0-11)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 0 | 4 | uint32 | mPacketNumber | Sequence number of the packet |
| 4 | 4 | uint32 | mCategoryPacketNumber | Category packet number |
| 8 | 1 | uint8 | mPartialPacketIndex | Index of partial packet (0 = not fragmented) |
| 9 | 1 | uint8 | mPartialPacketNumber | Total number of partial packets |
| 10 | 1 | uint8 | mPacketType | Packet type: 0=TELEMETRY, 1=RACE, 2=PARTICIPANTS, 3=TIMINGS, 4=GAME_STATE |
| 11 | 1 | uint8 | mPacketVersion | Packet version (typically 21) |

### Participant Controls (Offset 12-15)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 12 | 1 | uint8 | sViewedParticipantIndex | Index of viewed participant |
| 13 | 1 | uint8 | sUnfilteredThrottle | Unfiltered throttle (0-100) |
| 14 | 1 | uint8 | sUnfilteredBrake | Unfiltered brake (0-100) |
| 15 | 1 | uint8 | sUnfilteredSteering | Unfiltered steering (-90 to +90 degrees, normalized to 0-255) |

### Car Flags (Offset 16-19)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 16 | 4 | uint32 | sCarFlags | Car status flags |

### Engine & Liquids Temperatures (Offset 20-33)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 20 | 2 | int16 | sOilTempCelsius | Oil temperature in Celsius |
| 22 | 2 | uint16 | sOilPressureKPa | Oil pressure in kPa |
| 24 | 2 | int16 | sWaterTempCelsius | Water temperature in Celsius |
| 26 | 2 | uint16 | sWaterPressureKpa | Water pressure in kPa |
| 28 | 2 | uint16 | sFuelPressureKpa | Fuel pressure in kPa |
| 30 | 1 | uint8 | sCarFlags2 | Additional car flags |
| 31 | 1 | uint8 | - | Padding |
| 32 | 2 | uint16 | sFuelCapacity | Fuel tank capacity in liters |

### Controls (Offset 34-41)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 34 | 1 | uint8 | sBrake | Brake pedal position (0-100) |
| 35 | 1 | uint8 | sThrottle | Throttle pedal position (0-100) |
| 36 | 1 | uint8 | sClutch | Clutch pedal position (0-100) |
| 37 | 1 | uint8 | sSteering | Steering wheel angle (-90 to +90 degrees, normalized to 0-255) |
| 38 | 1 | uint8 | sGear | Combined gear data: lower nibble = current gear (0=neutral, 1-5=gear), upper nibble = number of gears |
| 39 | 1 | uint8 | sBoostAmount | Boost amount |
| 40 | 1 | uint8 | sCrashState | Crash state indicator |

### Fuel, Speed, RPM (Offset 45-56)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 41-44 | 4 | - | (padding) | Reserved/gap |
| 45 | 4 | float | sFuelLevel | Fuel level (0-100, percentage) |
| 49 | 4 | float | sSpeed | Car speed in m/s |
| 53 | 2 | uint16 | sRpm | Engine RPM |
| 55 | 2 | uint16 | sMaxRpm | Maximum engine RPM |

### Orientation (Offset 57-69)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 57 | 4 | float | sOrientation[0] | Pitch (radians) |
| 61 | 4 | float | sOrientation[1] | Roll (radians) |
| 65 | 4 | float | sOrientation[2] | Yaw (radians) |

### Local Velocity (Offset 69-81)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 69 | 4 | float | sLocalVelocity[0] | Local velocity X (m/s) |
| 73 | 4 | float | sLocalVelocity[1] | Local velocity Y (m/s) |
| 77 | 4 | float | sLocalVelocity[2] | Local velocity Z (m/s) |

### World Velocity (Offset 81-93)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 81 | 4 | float | sWorldVelocity[0] | World velocity X (m/s) |
| 85 | 4 | float | sWorldVelocity[1] | World velocity Y (m/s) |
| 89 | 4 | float | sWorldVelocity[2] | World velocity Z (m/s) |

### Angular Velocity (Offset 93-105)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 93 | 4 | float | sAngularVelocity[0] | Angular velocity X (rad/s) |
| 97 | 4 | float | sAngularVelocity[1] | Angular velocity Y (rad/s) |
| 101 | 4 | float | sAngularVelocity[2] | Angular velocity Z (rad/s) |

### Local Acceleration (Offset 105-117)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 105 | 4 | float | sLocalAcceleration[0] | Local acceleration X (m/s²) |
| 109 | 4 | float | sLocalAcceleration[1] | Local acceleration Y (m/s²) |
| 113 | 4 | float | sLocalAcceleration[2] | Local acceleration Z (m/s²) |

### World Acceleration (Offset 117-129)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 117 | 4 | float | sWorldAcceleration[0] | World acceleration X (m/s²) |
| 121 | 4 | float | sWorldAcceleration[1] | World acceleration Y (m/s²) |
| 125 | 4 | float | sWorldAcceleration[2] | World acceleration Z (m/s²) |

### Extents Centre (Offset 129-141)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 129 | 4 | float | sExtentsCentre[0] | Extents centre X |
| 133 | 4 | float | sExtentsCentre[1] | Extents centre Y |
| 137 | 4 | float | sExtentsCentre[2] | Extents centre Z |

### Tire Data (Offset 141-157)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 141 | 4 | uint8[4] | sTyreFlags | Tire flags (per wheel) |
| 145 | 4 | uint8[4] | sTerrain | Terrain type (per wheel) |
| 149 | 4×4 | float[4] | sTyreY | Tire Y position (per wheel) |
| 165 | 4×4 | float[4] | sTyreRPS | Tire revolutions per second (per wheel) |
| 181 | 4 | uint8[4] | sTyreTemp | Tire temperature (per wheel, Celsius) |
| 185 | 4×4 | float[4] | sTyreHeightAboveGround | Tire height above ground (per wheel) |
| 201 | 4 | uint8[4] | sTyreWear | Tire wear (per wheel, percentage) |

### Brake Damage (Offset 205-209)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 205 | 4 | uint8[4] | sBrakeDamage | Brake damage (per wheel, percentage) |

### Suspension Damage (Offset 209-213)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 209 | 4 | uint8[4] | sSuspensionDamage | Suspension damage (per wheel, percentage) |

### Brake Temperature (Offset 213-217)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 213 | 4 | uint8[4] | sBrakeTempCelsius | Brake temperature (per wheel, Celsius, 0-255) |

### Tire Layer Temperatures (Offset 217-229)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 217 | 4 | uint8[4] | sTyreTreadTemp | Tire tread temperature (per wheel, Celsius, 0-255) |
| 221 | 4 | uint8[4] | sTyreLayerTemp | Tire layer temperature (per wheel, Celsius, 0-255) |
| 225 | 4 | uint8[4] | sTyreCarcassTemp | Tire carcass temperature (per wheel, Celsius, 0-255) |

### Wheel Data (Offset 229-293)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 229 | 4×4 | float[4] | sWheelRPM | Wheel RPM (per wheel) |
| 245 | 4×4 | float[4] | sWheelInPuddle | Wheel in puddle depth (per wheel) |
| 261 | 4×4 | float[4] | sWheelOnRumbleStrip | Wheel on rumble strip (per wheel) |
| 277 | 4×4 | float[4] | sWheelInSlipperyArea | Wheel in slippery area (per wheel) |

### Surface Rumble (Offset 293-305)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 293 | 4×2 | float[2] | sSurfaceRumble | Surface rumble (per wheel) |

### Tire Slip Data (Offset 305-361)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 305 | 4×4 | float[4] | sTyreSlipSpeed | Tire slip speed (per wheel) |
| 321 | 4×4 | float[4] | sTyreSlipAngle | Tire slip angle (per wheel) |
| 337 | 4×4 | float[4] | sTyreCombinedSlip | Tire combined slip (per wheel) |

### Suspension Travel (Offset 361-377)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 361 | 4×4 | float[4] | sSuspensionTravel | Suspension travel (per wheel) |

### Aero Data (Offset 377-393)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 377 | 4 | float | sAirDensity | Air density (kg/m³) |
| 381 | 4 | float | sAirPressure | Air pressure (kPa) |
| 385 | 4 | float | sAerodynamicDrag | Aerodynamic drag |
| 389 | 4 | float | sAerodynamicDownforce | Aerodynamic downforce |

### Odometer (Offset 393-397)

| Offset | Size | Type | Field | Description |
|--------|------|------|-------|-------------|
| 393 | 4 | float | sOdometerKM | Odometer (km) |

---

## Field Type Mappings

### Java/ByteBuffer Type Mapping

When parsing in Java, use these mappings:

| Java Type | Size | Description |
|-----------|------|-------------|
| `buffer.getInt(offset)` | 4 bytes | Signed 32-bit integer |
| `buffer.getShort(offset)` | 2 bytes | Signed 16-bit integer |
| `buffer.get(offset)` | 1 byte | Signed 8-bit integer |
| `buffer.get() & 0xFF` | 1 byte | Unsigned 8-bit integer |
| `buffer.getFloat(offset)` | 4 bytes | 32-bit IEEE 754 float |

### Value Normalization

| Field | Raw Range | Normalized Range | Formula |
|-------|-----------|------------------|---------|
| throttle | 0-255 | 0.0-1.0 | `value / 255.0f` |
| brake | 0-255 | 0.0-1.0 | `value / 255.0f` |
| steering | -128 to 127 | -1.0 to 1.0 | `(value - 128) / 128.0f` |
| fuelLevel | 0-100 (float) | 0.0-1.0 | `value / 100.0f` |
| speed | m/s | km/h | `value * 3.6f` |

---

## Example Parsing

### Java Example

```java
// Parse telemetry packet
ByteBuffer buffer = ByteBuffer.wrap(data, 0, length);
buffer.order(ByteOrder.LITTLE_ENDIAN);

// Header
int packetNumber = buffer.getInt(0);
int categoryPacketNumber = buffer.getInt(4);
int packetType = buffer.get(10);

// Core telemetry
float speed = buffer.getFloat(49);  // m/s
int rpm = buffer.getShort(53) & 0xFFFF;  // uint16
int gear = buffer.get(37);
int throttle = buffer.get(34) & 0xFF;
int brake = buffer.get(33) & 0xFF;
float fuel = buffer.getFloat(45);

// Convert to display units
float speedKmh = speed * 3.6f;
float throttleNormalized = throttle / 255.0f;
float brakeNormalized = brake / 255.0f;
float fuelNormalized = fuel / 100.0f;
```

---

## Notes

- All multi-byte integers are in **little-endian** format
- Packet type **0 (TELEMETRY)** is the main telemetry packet
- The mock-server sends this packet at the configured update rate (default 60 Hz)
- Maximum packet size is 600 bytes, but some fields may be unused
