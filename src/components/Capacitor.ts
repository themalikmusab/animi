/**
 * Capacitor Component
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class Capacitor extends Component {
  private capacitance: number; // Farads
  private charge: number = 0; // Coulombs
  private maxVoltage: number; // Voltage rating
  private esr: number = 0.1; // Equivalent Series Resistance

  constructor(position: Vector2, capacitance: number = 0.0001) {
    super(ComponentType.CAPACITOR, position);
    this.capacitance = capacitance;
    this.maxVoltage = 25; // 25V capacitor
    this.width = 50;
    this.height = 50;
    this.color = '#3498db';
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
    // Capacitor acts as ESR in DC steady state
    return this.esr;
  }

  getVoltage(): number {
    // V = Q/C
    return this.charge / this.capacitance;
  }

  getCurrent(): number {
    if (this.terminals.length === 2) {
      return this.terminals[0].current;
    }
    return 0;
  }

  getCharge(): number {
    return this.charge;
  }

  update(deltaTime: number): void {
    if (this.terminals.length === 2 && !this.isBurned) {
      // I = dQ/dt, so Q += I * dt
      const current = (this.terminals[0].voltage - this.terminals[1].voltage) / this.esr;
      this.charge += current * deltaTime;

      // Limit charge based on voltage rating
      const maxCharge = this.maxVoltage * this.capacitance;
      if (Math.abs(this.charge) > maxCharge) {
        this.isBurned = true;
        this.charge = 0;
      }

      this.terminals[0].current = current;
      this.terminals[1].current = -current;
    }

    this.powerDissipation = this.getCurrent() * this.getCurrent() * this.esr;
    this.updateTemperature(deltaTime);
  }
}
