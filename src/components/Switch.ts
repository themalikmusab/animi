/**
 * Switch Component - SPST (Single Pole Single Throw)
 */

import { Component, ComponentType } from '../core/Component';
import { Vector2 } from '../math/Vector2';

export class Switch extends Component {
  private isOpen: boolean = true;
  private closedResistance: number = 0.01; // Almost zero when closed
  private openResistance: number = 1e9; // Very high when open

  constructor(position: Vector2, isOpen: boolean = true) {
    super(ComponentType.SWITCH, position);
    this.isOpen = isOpen;
    this.width = 60;
    this.height = 40;
    this.color = '#7f8c8d';
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

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  setOpen(isOpen: boolean): void {
    this.isOpen = isOpen;
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  getResistance(): number {
    return this.isOpen ? this.openResistance : this.closedResistance;
  }

  getVoltage(): number {
    if (this.terminals.length === 2) {
      return this.terminals[0].voltage - this.terminals[1].voltage;
    }
    return 0;
  }

  getCurrent(): number {
    if (this.terminals.length === 2 && !this.isOpen) {
      return this.getVoltage() / this.closedResistance;
    }
    return 0;
  }

  update(deltaTime: number): void {
    const current = this.getCurrent();
    this.powerDissipation = current * current * this.closedResistance;
    this.updateTemperature(deltaTime);

    // Update terminal currents
    if (this.terminals.length === 2) {
      this.terminals[0].current = current;
      this.terminals[1].current = -current;
    }
  }
}
