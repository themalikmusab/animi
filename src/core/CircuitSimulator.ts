/**
 * Main Circuit Simulator - Orchestrates components, wires, and simulation
 */

import { PhysicsEngine } from '../physics/PhysicsEngine';
import { Component } from './Component';
import { Wire } from './Wire';
import { Vector2 } from '../math/Vector2';

export class CircuitSimulator {
  private components: Component[] = [];
  private wires: Wire[] = [];
  private physicsEngine: PhysicsEngine;

  constructor(physicsEngine: PhysicsEngine) {
    this.physicsEngine = physicsEngine;
  }

  addComponent(component: Component): void {
    this.components.push(component);
    this.physicsEngine.addComponent(component);
  }

  removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index > -1) {
      this.components.splice(index, 1);
      this.physicsEngine.removeComponent(component);

      // Remove connected wires
      this.wires = this.wires.filter(wire =>
        wire.getStartComponent() !== component && wire.getEndComponent() !== component
      );
    }
  }

  addWire(wire: Wire): void {
    this.wires.push(wire);
    this.physicsEngine.addWire(wire);
  }

  removeWire(wire: Wire): void {
    const index = this.wires.indexOf(wire);
    if (index > -1) {
      this.wires.splice(index, 1);
      this.physicsEngine.removeWire(wire);
    }
  }

  getComponents(): Component[] {
    return this.components;
  }

  getWires(): Wire[] {
    return this.wires;
  }

  getComponentAt(position: Vector2): Component | null {
    for (let i = this.components.length - 1; i >= 0; i--) {
      if (this.components[i].containsPoint(position)) {
        return this.components[i];
      }
    }
    return null;
  }

  clear(): void {
    this.components = [];
    this.wires = [];
    this.physicsEngine.clear();
    Component.resetNodeCounter();
  }
}
