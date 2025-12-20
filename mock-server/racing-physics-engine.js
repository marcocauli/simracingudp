/**
 * Physics Engine for Realistic Racing Telemetry Simulation
 * Generates plausible racing data for extended sessions
 */

class RacingPhysicsEngine {
    constructor() {
        this.carConfig = {
            maxPower: 400, // HP
            maxRpm: 8000,
            idleRpm: 1000,
            redlineRpm: 7500,
            weight: 1200, // kg
            maxFuel: 100, // liters
            fuelConsumptionRate: 2.5, // liters per 100km
            maxSpeed: 320, // km/h
            brakingPower: 4000, // N
            lateralGrip: 2.0, // G
            longitudinalGrip: 1.5, // G
            gearRatios: [3.5, 2.1, 1.5, 1.2, 1.0, 0.85],
            finalDrive: 4.1,
            tireRadius: 0.33, // meters
        };

        this.sessionState = {
            currentLap: 1,
            lapDistance: 0,
            sessionTime: 0,
            fuelLevel: 100,
            tireWear: [0, 0, 0, 0], // FL, FR, RL, RR
            tireTemps: [70, 70, 70, 70],
            brakeTemps: [50, 50, 50, 50],
            driverFatigue: 0,
            trackTemperature: 25,
            airTemperature: 20
        };

        this.driverProfile = {
            aggressionLevel: 0.7, // 0-1 scale
            consistency: 0.8,
            skillLevel: 0.85,
            adaptationRate: 0.1
        };

        this.trackProfile = {
            corners: [
                { distance: 500, radius: 50, speed: 120, gForce: 2.0 },
                { distance: 1200, radius: 80, speed: 180, gForce: 1.8 },
                { distance: 2000, radius: 40, speed: 100, gForce: 2.5 },
                { distance: 2800, radius: 100, speed: 200, gForce: 1.5 },
                { distance: 3500, radius: 60, speed: 140, gForce: 2.2 },
                { distance: 4200, radius: 90, speed: 170, gForce: 1.7 }
            ],
            straights: [
                { start: 200, end: 450, targetSpeed: 280 },
                { start: 800, end: 1100, targetSpeed: 250 },
                { start: 1500, end: 1850, targetSpeed: 300 },
                { start: 2200, end: 2750, targetSpeed: 290 },
                { start: 3100, end: 3400, targetSpeed: 260 },
                { start: 3800, end: 4150, targetSpeed: 240 }
            ],
            trackLength: 5000,
            surfaceGrip: 0.95
        };

        this.lapHistory = [];
        this.sectorTimes = [];
        this.currentSector = 1;
    }

    /**
     * Calculate optimal speed for current track position
     */
    calculateOptimalSpeed(distance) {
        // Check if in corner
        for (const corner of this.trackProfile.corners) {
            if (Math.abs(distance - corner.distance) < 100) {
                // Apply cornering physics
                const maxCornerSpeed = Math.sqrt(corner.radius * 9.81 * corner.gForce * this.trackProfile.surfaceGrip);
                return Math.min(corner.speed, maxCornerSpeed);
            }
        }

        // Check if in straight
        for (const straight of this.trackProfile.straights) {
            if (distance >= straight.start && distance <= straight.end) {
                // Apply acceleration physics
                const accelerationPotential = this.calculateAccelerationPotential();
                return Math.min(straight.targetSpeed, straight.targetSpeed * accelerationPotential);
            }
        }

        // Default cruising speed
        return 200;
    }

    /**
     * Calculate driver's current acceleration potential
     */
    calculateAccelerationPotential() {
        const fuelEffect = 0.7 + (0.3 * this.sessionState.fuelLevel / this.carConfig.maxFuel);
        const tireEffect = 0.8 + (0.2 * (1 - Math.max(...this.sessionState.tireWear) / 100));
        const fatigueEffect = 1.0 - (this.sessionState.driverFatigue * 0.2);
        const adaptationEffect = 0.9 + (this.driverProfile.adaptationRate * 0.1);

        return fuelEffect * tireEffect * fatigueEffect * adaptationEffect * this.driverProfile.skillLevel;
    }

    /**
     * Calculate realistic throttle position
     */
    calculateThrottle(targetSpeed, currentSpeed) {
        const speedDifference = targetSpeed - currentSpeed;
        const accelerationRate = this.calculateAccelerationPotential();
        
        // Apply driver characteristics
        const throttleResponse = this.driverProfile.aggressionLevel * accelerationRate;
        
        if (speedDifference > 20) {
            // Full acceleration needed
            return Math.min(100, 95 + Math.random() * 5);
        } else if (speedDifference > 5) {
            // Moderate acceleration
            return Math.min(90, 60 + throttleResponse * 30 + Math.random() * 10);
        } else if (speedDifference > 0) {
            // Gentle acceleration
            return Math.min(60, 30 + throttleResponse * 20 + Math.random() * 10);
        } else if (speedDifference > -10) {
            // Maintain speed
            return Math.max(20, 40 + Math.random() * 10 - Math.abs(speedDifference));
        } else {
            // Braking needed
            return 0;
        }
    }

    /**
     * Calculate realistic brake pressure
     */
    calculateBrake(targetSpeed, currentSpeed) {
        const speedDifference = currentSpeed - targetSpeed;
        const brakingDistance = this.calculateBrakingDistance(currentSpeed, targetSpeed);
        
        if (speedDifference > 30) {
            // Hard braking
            return Math.min(100, 85 + Math.random() * 10);
        } else if (speedDifference > 10) {
            // Moderate braking
            return Math.min(80, 50 + Math.random() * 15);
        } else if (speedDifference > 0) {
            // Gentle braking
            return Math.min(40, 10 + Math.random() * 20);
        } else {
            // No braking
            return 0;
        }
    }

    /**
     * Calculate braking distance based on current speed and target speed
     */
    calculateBrakingDistance(currentSpeed, targetSpeed) {
        const avgDeceleration = this.carConfig.brakingPower / this.carConfig.weight;
        const speedDiff = currentSpeed - targetSpeed;
        return (speedDiff * speedDiff) / (2 * avgDeceleration * 3.6); // Convert to meters
    }

    /**
     * Calculate realistic steering angle based on track position
     */
    calculateSteeringAngle(distance) {
        for (const corner of this.trackProfile.corners) {
            const distanceToCorner = distance - corner.distance;
            const cornerEntryDistance = 150; // meters before corner
            
            if (Math.abs(distanceToCorner) < cornerEntryDistance) {
                // Calculate steering angle for corner
                const cornerRadius = corner.radius;
                const wheelBase = 2.7; // meters (typical race car)
                const steeringAngle = Math.atan(wheelBase / cornerRadius) * (180 / Math.PI);
                
                // Apply driver characteristics and corner phase
                if (distanceToCorner < 0) {
                    // Approaching corner
                    return steeringAngle * 0.3 * (1 + distanceToCorner / cornerEntryDistance);
                } else if (distanceToCorner < 50) {
                    // In corner
                    return steeringAngle * (0.8 + Math.random() * 0.2);
                } else {
                    // Exiting corner
                    return steeringAngle * 0.5 * (1 - (distanceToCorner - 50) / 100);
                }
            }
        }

        // Small corrections on straights
        return (Math.random() - 0.5) * 2; // -1 to 1 degree
    }

    /**
     * Calculate current gear based on RPM and speed
     */
    calculateGear(speed, rpm) {
        if (rpm < this.carConfig.idleRpm + 500) return 0; // Neutral
        
        for (let gear = 5; gear >= 1; gear--) {
            const gearRatio = this.carConfig.gearRatios[gear - 1];
            const gearSpeed = (rpm * 60 * this.carConfig.tireRadius * 2 * Math.PI) / 
                           (gearRatio * this.carConfig.finalDrive * 1000) * 3.6;
            
            if (speed <= gearSpeed + 10) {
                return gear;
            }
        }
        
        return 1; // First gear as default
    }

    /**
     * Calculate RPM based on speed and gear
     */
    calculateRPM(speed, gear) {
        if (gear === 0) return this.carConfig.idleRpm;
        
        const gearRatio = this.carConfig.gearRatios[gear - 1];
        const wheelRPM = (speed * 1000) / (60 * this.carConfig.tireRadius * 2 * Math.PI);
        const engineRPM = wheelRPM * gearRatio * this.carConfig.finalDrive;
        
        return Math.max(this.carConfig.idleRpm, Math.min(this.carConfig.maxRpm, engineRPM));
    }

    /**
     * Update tire wear based on current conditions
     */
    updateTireWear(distance, speed, lateralG) {
        const wearRate = 0.001; // Base wear rate per meter
        
        for (let i = 0; i < 4; i++) {
            // Calculate load distribution
            const frontLoad = speed > 150 ? 0.6 : 0.5;
            const rearLoad = 1 - frontLoad;
            const loadDistribution = i < 2 ? frontLoad : rearLoad;
            
            // Calculate wear factors
            const speedFactor = 1 + (speed / this.carConfig.maxSpeed);
            const lateralFactor = 1 + Math.abs(lateralG) / 2;
            const temperatureFactor = 1 + Math.abs(this.sessionState.tireTemps[i] - 80) / 100;
            
            // Apply wear
            const wearIncrement = wearRate * loadDistribution * speedFactor * lateralFactor * temperatureFactor;
            this.sessionState.tireWear[i] = Math.min(100, this.sessionState.tireWear[i] + wearIncrement);
        }
    }

    /**
     * Update tire temperatures based on current conditions
     */
    updateTireTemperatures(speed, braking, cornering) {
        const ambientTemp = this.sessionState.airTemperature;
        const trackTemp = this.sessionState.trackTemperature;
        
        for (let i = 0; i < 4; i++) {
            // Calculate heat generation
            const speedHeat = speed / this.carConfig.maxSpeed * 30;
            const brakeHeat = braking * 20;
            const cornerHeat = cornering * 15;
            const generatedHeat = speedHeat + brakeHeat + cornerHeat;
            
            // Calculate cooling
            const coolingRate = 0.1;
            const ambientCooling = (ambientTemp - this.sessionState.tireTemps[i]) * coolingRate;
            
            // Update temperature
            this.sessionState.tireTemps[i] += (generatedHeat + ambientCooling) * 0.01;
            
            // Clamp temperature
            this.sessionState.tireTemps[i] = Math.max(ambientTemp, 
                Math.min(120, this.sessionState.tireTemps[i]));
        }
    }

    /**
     * Calculate fuel consumption
     */
    updateFuelConsumption(distance, speed, throttle) {
        const baseConsumption = this.carConfig.fuelConsumptionRate / 100; // per meter
        const speedFactor = 1 + (speed / this.carConfig.maxSpeed);
        const throttleFactor = 0.5 + (throttle / 100) * 0.5;
        
        const consumption = baseConsumption * speedFactor * throttleFactor * distance * 0.001;
        this.sessionState.fuelLevel = Math.max(0, this.sessionState.fuelLevel - consumption);
        
        return consumption;
    }

    /**
     * Update driver fatigue over time
     */
    updateDriverFatigue(sessionTime) {
        const fatigueRate = 0.0001; // Fatigue accumulation rate
        const sessionFactor = Math.min(sessionTime / 3600, 1); // Increases after 1 hour
        
        this.sessionState.driverFatigue = Math.min(1, 
            this.sessionState.driverFatigue + fatigueRate * sessionFactor);
    }

    /**
     * Generate complete telemetry data for current state
     */
    generateTelemetryData(deltaTime) {
        const distance = this.sessionState.lapDistance;
        const targetSpeed = this.calculateOptimalSpeed(distance);
        const currentSpeed = this.getCurrentSpeed();
        
        // Calculate controls
        const throttle = this.calculateThrottle(targetSpeed, currentSpeed);
        const brake = this.calculateBrake(targetSpeed, currentSpeed);
        const steering = this.calculateSteeringAngle(distance);
        
        // Calculate physics
        const lateralG = this.calculateLateralG(distance, currentSpeed);
        const longitudinalG = this.calculateLongitudinalG(throttle, brake, currentSpeed);
        const rpm = this.calculateRPM(currentSpeed, this.getCurrentGear());
        const gear = this.calculateGear(currentSpeed, rpm);
        
        // Update session state
        this.sessionState.lapDistance += currentSpeed * deltaTime / 3.6; // Convert km/h to m/s
        this.sessionState.sessionTime += deltaTime;
        
        // Update wear and fatigue
        this.updateTireWear(this.sessionState.lapDistance, currentSpeed, lateralG);
        this.updateTireTemperatures(currentSpeed, brake > 0, Math.abs(steering) > 5);
        this.updateFuelConsumption(this.sessionState.lapDistance, currentSpeed, throttle);
        this.updateDriverFatigue(this.sessionState.sessionTime);
        
        // Check lap completion
        if (this.sessionState.lapDistance >= this.trackProfile.trackLength) {
            this.completeLap();
        }
        
        return {
            speed: currentSpeed,
            rpm: rpm,
            gear: gear,
            throttle: throttle,
            brake: brake,
            steering: steering,
            fuelLevel: this.sessionState.fuelLevel,
            tireWear: [...this.sessionState.tireWear],
            tireTemps: [...this.sessionState.tireTemps],
            lapNumber: this.sessionState.currentLap,
            lapDistance: this.sessionState.lapDistance,
            sessionTime: this.sessionState.sessionTime,
            lateralG: lateralG,
            longitudinalG: longitudinalG
        };
    }

    /**
     * Helper methods
     */
    getCurrentSpeed() {
        // Simplified - would be based on previous state and acceleration
        return 150 + Math.sin(this.sessionState.sessionTime * 0.1) * 50;
    }

    getCurrentGear() {
        return this.calculateGear(this.getCurrentSpeed(), 6000);
    }

    calculateLateralG(distance, speed) {
        for (const corner of this.trackProfile.corners) {
            if (Math.abs(distance - corner.distance) < 100) {
                return (speed * speed) / (corner.radius * 12.96); // Convert to G
            }
        }
        return 0;
    }

    calculateLongitudinalG(throttle, brake, speed) {
        if (brake > 0) {
            return -(brake / 100) * 2.5; // Max 2.5G braking
        } else if (throttle > 0) {
            return (throttle / 100) * 0.8; // Max 0.8G acceleration
        }
        return 0;
    }

    completeLap() {
        this.sessionState.currentLap++;
        this.sessionState.lapDistance = 0;
        
        // Store lap time (simplified)
        const lapTime = this.sessionState.sessionTime - 
                      (this.lapHistory.length > 0 ? this.lapHistory[this.lapHistory.length - 1].sessionTime : 0);
        
        this.lapHistory.push({
            lapNumber: this.sessionState.currentLap,
            lapTime: lapTime,
            sessionTime: this.sessionState.sessionTime,
            fuelUsed: this.carConfig.maxFuel - this.sessionState.fuelLevel,
            avgTireWear: this.sessionState.tireWear.reduce((a, b) => a + b) / 4
        });
    }

    resetSession() {
        this.sessionState = {
            currentLap: 1,
            lapDistance: 0,
            sessionTime: 0,
            fuelLevel: 100,
            tireWear: [0, 0, 0, 0],
            tireTemps: [70, 70, 70, 70],
            brakeTemps: [50, 50, 50, 50],
            driverFatigue: 0,
            trackTemperature: 25,
            airTemperature: 20
        };
        this.lapHistory = [];
    }
}

module.exports = RacingPhysicsEngine;