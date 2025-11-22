/**
 * DC Motor Component
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class Motor extends Component {
  private resistance: number = 5; // Coil resistance
  private backEmfConstant: number = 0.01; // V/RPM
  private rpm: number = 0;
  private maxRPM: number = 5000;
  private rotorAngle: number = 0;

  constructor(position: Vector2) {
    super(ComponentType.MOTOR, position);
    this.width = 70;
    this.height = 70;
    this.color = '#34495e';
    this.maxTemperature = 180;
    this.initializeTerminals();
  }

  private initializeTerminals(): void {
    this.terminals = [
      {
        position: new Vector2(this.position.x - this.width / 2, this.position.y),
        node: this.generateNodeId(),
        voltage: 0,
        current: 0
      },
      {
        position: new Vector2(this.position.x + this.width / 2, this.position.y),
        node: this.generateNodeId(),
        voltage: 0,
        current: 0
      }
    ];
  }

  protected generateNodeId(): number {
    return Math.floor(Math.random() * 1000000);
  }

  protected updateTerminalPositions(): void {
    if (this.terminals.length === 2) {
      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      const halfWidth = this.width / 2;

      this.terminals[0].position = new Vector2(
        this.position.x - halfWidth * cos,
        this.position.y - halfWidth * sin
      );

      this.terminals[1].position = new Vector2(
        this.position.x + halfWidth * cos,
        this.position.y + halfWidth * sin
      );
    }
  }

  getResistance(): number {
    return this.isBurned ? Infinity : this.resistance;
  }

  getVoltage(): number {
    if (this.terminals.length === 2) {
      return this.terminals[0].voltage - this.terminals[1].voltage;
    }
    return 0;
  }

  getCurrent(): number {
    if (this.terminals.length === 2 && !this.isBurned) {
      const appliedVoltage = this.getVoltage();
      const backEmf = this.backEmfConstant * this.rpm;
      return (appliedVoltage - backEmf) / this.resistance;
    }
    return 0;
  }

  getRPM(): number {
    return this.rpm;
  }

  getRotorAngle(): number {
    return this.rotorAngle;
  }

  update(deltaTime: number): void {
    if (this.isBurned) {
      this.rpm *= 0.95; // Coast to stop
      this.rotorAngle += (this.rpm / 60) * deltaTime * Math.PI * 2;
      return;
    }

    const current = this.getCurrent();

    // Motor physics: Torque proportional to current
    // Angular acceleration = Torque / Inertia
    const torqueConstant = 0.01; // N⋅m/A
    const inertia = 0.0001; // kg⋅m²
    const friction = 0.1; // Damping

    const torque = torqueConstant * current;
    const angularAcceleration = torque / inertia;

    // Update RPM
    const rpmAcceleration = angularAcceleration * (60 / (2 * Math.PI));
    this.rpm += (rpmAcceleration - friction * this.rpm) * deltaTime;
    this.rpm = Math.max(0, Math.min(this.rpm, this.maxRPM));

    // Update rotor angle
    this.rotorAngle += (this.rpm / 60) * deltaTime * Math.PI * 2;

    // Power dissipation
    this.powerDissipation = current * current * this.resistance;
    this.updateTemperature(deltaTime);

    // Update terminal currents
    if (this.terminals.length === 2) {
      this.terminals[0].current = current;
      this.terminals[1].current = -current;
    }
  }
}
