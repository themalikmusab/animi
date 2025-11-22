/**
 * LED Component - Light Emitting Diode
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class LED extends Component {
  private forwardVoltage: number = 2.0; // Typical red LED
  private forwardResistance: number = 10; // Ohms when conducting
  private reverseResistance: number = 1e6; // Very high when reverse biased
  private maxCurrent: number = 0.03; // 30mA
  private brightness: number = 0; // 0 to 1
  private ledColor: string = '#ff0000'; // Red

  constructor(position: Vector2, color: string = 'red') {
    super(ComponentType.LED, position);
    this.width = 40;
    this.height = 40;
    this.maxTemperature = 125;
    this.setLEDColor(color);
    this.initializeTerminals();
  }

  private setLEDColor(color: string): void {
    const colorMap: { [key: string]: { hex: string; vf: number } } = {
      red: { hex: '#ff0000', vf: 2.0 },
      green: { hex: '#00ff00', vf: 2.2 },
      blue: { hex: '#0000ff', vf: 3.2 },
      yellow: { hex: '#ffff00', vf: 2.1 },
      white: { hex: '#ffffff', vf: 3.4 }
    };

    const ledData = colorMap[color.toLowerCase()] || colorMap['red'];
    this.ledColor = ledData.hex;
    this.forwardVoltage = ledData.vf;
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
    if (this.isBurned) return Infinity;

    const voltage = this.getVoltage();

    // Diode characteristic
    if (voltage >= this.forwardVoltage) {
      return this.forwardResistance;
    } else if (voltage > 0) {
      // Exponential increase in resistance below forward voltage
      return this.forwardResistance * Math.exp((this.forwardVoltage - voltage) * 5);
    } else {
      // Reverse biased
      return this.reverseResistance;
    }
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

      if (voltage >= this.forwardVoltage) {
        // Conducting - use Shockley diode equation (simplified)
        const current = (voltage - this.forwardVoltage) / this.forwardResistance;
        return Math.min(current, this.maxCurrent * 1.5); // Allow slight overcurrent
      }
    }
    return 0;
  }

  getBrightness(): number {
    return this.brightness;
  }

  getLEDColor(): string {
    return this.ledColor;
  }

  update(deltaTime: number): void {
    const current = this.getCurrent();
    const voltage = this.getVoltage();

    // Calculate brightness (0 to 1)
    if (current > 0 && !this.isBurned) {
      this.brightness = Math.min(current / this.maxCurrent, 1);
    } else {
      this.brightness = 0;
    }

    // Power dissipation
    this.powerDissipation = voltage * current;

    // Burn out if overcurrent
    if (current > this.maxCurrent * 2) {
      this.isBurned = true;
      this.brightness = 0;
    }

    this.updateTemperature(deltaTime);

    // Update terminal currents
    if (this.terminals.length === 2) {
      this.terminals[0].current = current;
      this.terminals[1].current = -current;
    }
  }
}
