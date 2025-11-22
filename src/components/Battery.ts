/**
 * Battery Component - Voltage Source
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class Battery extends Component {
  private voltage: number;
  private internalResistance: number = 0.1; // Ohms

  constructor(position: Vector2, voltage: number = 9) {
    super(ComponentType.BATTERY, position);
    this.voltage = voltage;
    this.width = 80;
    this.height = 50;
    this.color = '#2c3e50';
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
        voltage: this.voltage,
        current: 0
      }
    ];
  }

  private generateNodeId(): number {
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
    return this.internalResistance;
  }

  getVoltage(): number {
    return this.isBurned ? 0 : this.voltage;
  }

  setVoltage(voltage: number): void {
    this.voltage = voltage;
    if (this.terminals.length === 2) {
      this.terminals[1].voltage = voltage;
    }
  }

  getCurrent(): number {
    return this.terminals.length === 2 ? this.terminals[0].current : 0;
  }

  update(deltaTime: number): void {
    const current = Math.abs(this.getCurrent());
    this.powerDissipation = current * current * this.internalResistance;
    this.updateTemperature(deltaTime);
  }
}
