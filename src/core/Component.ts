/**
 * Base Component Class
 */

import { Vector2 } from '../math/Vector2';

export enum ComponentType {
  BATTERY = 'battery',
  RESISTOR = 'resistor',
  LED = 'led',
  CAPACITOR = 'capacitor',
  SWITCH = 'switch',
  MOTOR = 'motor',
  INDUCTOR = 'inductor'
}

export interface Terminal {
  position: Vector2;
  node: number; // Node ID for circuit analysis
  voltage: number;
  current: number;
}

export abstract class Component {
  protected position: Vector2;
  protected rotation: number = 0;
  protected terminals: Terminal[] = [];
  protected id: string;
  protected type: ComponentType;
  protected temperature: number = 25; // Celsius
  protected maxTemperature: number = 150;
  protected isBurned: boolean = false;
  protected powerDissipation: number = 0;

  // Visual properties
  protected width: number = 60;
  protected height: number = 40;
  protected color: string = '#333';

  // Static node counter for unique IDs
  private static nextNodeId: number = 1;

  constructor(type: ComponentType, position: Vector2) {
    this.type = type;
    this.position = position.clone();
    this.id = `${type}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateNodeId(): number {
    return Component.nextNodeId++;
  }

  static resetNodeCounter(): void {
    Component.nextNodeId = 1;
  }

  abstract getResistance(): number;
  abstract getVoltage(): number;
  abstract getCurrent(): number;
  abstract update(deltaTime: number): void;

  getId(): string {
    return this.id;
  }

  getType(): ComponentType {
    return this.type;
  }

  getPosition(): Vector2 {
    return this.position;
  }

  setPosition(position: Vector2): void {
    this.position = position.clone();
    this.updateTerminalPositions();
  }

  getRotation(): number {
    return this.rotation;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
    this.updateTerminalPositions();
  }

  getTerminals(): Terminal[] {
    return this.terminals;
  }

  getTerminal(index: number): Terminal | null {
    return this.terminals[index] || null;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getColor(): string {
    return this.color;
  }

  getTemperature(): number {
    return this.temperature;
  }

  getPowerDissipation(): number {
    return this.powerDissipation;
  }

  isBurnedOut(): boolean {
    return this.isBurned;
  }

  containsPoint(point: Vector2): boolean {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    return (
      point.x >= this.position.x - halfWidth &&
      point.x <= this.position.x + halfWidth &&
      point.y >= this.position.y - halfHeight &&
      point.y <= this.position.y + halfHeight
    );
  }

  protected updateTerminalPositions(): void {
    // Override in subclasses
  }

  protected updateTemperature(deltaTime: number): void {
    // Thermal simulation
    const ambientTemp = 25;
    const thermalResistance = 10; // °C/W
    const thermalCapacity = 50; // J/°C

    // Temperature rise from power dissipation
    const targetTemp = ambientTemp + this.powerDissipation * thermalResistance;

    // First-order thermal response
    const tau = thermalCapacity * thermalResistance;
    const alpha = 1 - Math.exp(-deltaTime / tau);

    this.temperature = this.temperature + (targetTemp - this.temperature) * alpha;

    // Check for burnout
    if (this.temperature > this.maxTemperature) {
      this.isBurned = true;
    }
  }
}
