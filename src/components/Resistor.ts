/**
 * Resistor Component
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class Resistor extends Component {
  private resistance: number;
  private ratedPower: number; // Watts

  constructor(position: Vector2, resistance: number = 1000) {
    super(ComponentType.RESISTOR, position);
    this.resistance = resistance;
    this.ratedPower = 0.25; // 1/4 watt resistor
    this.width = 70;
    this.height = 30;
    this.color = '#d4a373';
    this.maxTemperature = 200;
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
    return this.isBurned ? Infinity : this.resistance;
  }

  setResistance(resistance: number): void {
    this.resistance = Math.max(0.1, resistance);
  }

  getVoltage(): number {
    if (this.terminals.length === 2) {
      return this.terminals[0].voltage - this.terminals[1].voltage;
    }
    return 0;
  }

  getCurrent(): number {
    if (this.terminals.length === 2 && !this.isBurned) {
      const voltage = this.getVoltage();
      return voltage / this.resistance;
    }
    return 0;
  }

  update(deltaTime: number): void {
    const current = this.getCurrent();
    this.powerDissipation = current * current * this.resistance;

    // Check if exceeding rated power
    if (this.powerDissipation > this.ratedPower * 2) {
      this.isBurned = true;
    }

    this.updateTemperature(deltaTime);

    // Update terminal currents
    if (this.terminals.length === 2) {
      this.terminals[0].current = current;
      this.terminals[1].current = -current;
    }
  }

  getColorBands(): string[] {
    // Calculate resistor color bands
    const value = Math.floor(this.resistance);
    const exponent = Math.floor(Math.log10(value));
    const mantissa = Math.floor(value / Math.pow(10, exponent - 1));

    const colors = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];

    const digit1 = Math.floor(mantissa / 10);
    const digit2 = mantissa % 10;
    const multiplier = exponent - 1;

    return [
      colors[digit1] || 'brown',
      colors[digit2] || 'black',
      colors[Math.max(0, multiplier)] || 'brown',
      'gold' // ±5% tolerance
    ];
  }
}
