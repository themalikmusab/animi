/**
 * Wire connection between components
 */

import { Vector2 } from '../math/Vector2';
import { Component } from './Component';

export class Wire {
  private id: string;
  private startComponent: Component;
  private endComponent: Component;
  private startTerminal: number;
  private endTerminal: number;
  private current: number = 0;
  private resistance: number = 0.01; // Small but non-zero

  // Visual properties
  private controlPoints: Vector2[] = [];

  constructor(
    startComponent: Component,
    startTerminal: number,
    endComponent: Component,
    endTerminal: number
  ) {
    this.startComponent = startComponent;
    this.endComponent = endComponent;
    this.startTerminal = startTerminal;
    this.endTerminal = endTerminal;
    this.id = `wire_${Math.random().toString(36).substr(2, 9)}`;
    this.updateControlPoints();
  }

  getId(): string {
    return this.id;
  }

  getStartComponent(): Component {
    return this.startComponent;
  }

  getEndComponent(): Component {
    return this.endComponent;
  }

  getStartTerminal(): number {
    return this.startTerminal;
  }

  getEndTerminal(): number {
    return this.endTerminal;
  }

  getCurrent(): number {
    return this.current;
  }

  setCurrent(current: number): void {
    this.current = current;
  }

  getResistance(): number {
    return this.resistance;
  }

  getStartPosition(): Vector2 {
    const terminal = this.startComponent.getTerminal(this.startTerminal);
    return terminal ? terminal.position : this.startComponent.getPosition();
  }

  getEndPosition(): Vector2 {
    const terminal = this.endComponent.getTerminal(this.endTerminal);
    return terminal ? terminal.position : this.endComponent.getPosition();
  }

  getControlPoints(): Vector2[] {
    return this.controlPoints;
  }

  updateControlPoints(): void {
    const start = this.getStartPosition();
    const end = this.getEndPosition();

    // Create smooth bezier curve
    const distance = Vector2.distance(start, end);
    const controlOffset = Math.min(distance * 0.3, 50);

    this.controlPoints = [
      start.clone(),
      new Vector2(start.x + controlOffset, start.y),
      new Vector2(end.x - controlOffset, end.y),
      end.clone()
    ];
  }

  // Get point along the wire at t (0 to 1)
  getPointAt(t: number): Vector2 {
    // Cubic Bezier curve
    const [p0, p1, p2, p3] = this.controlPoints;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return new Vector2(
      mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    );
  }

  // Get tangent at t (0 to 1)
  getTangentAt(t: number): Vector2 {
    const [p0, p1, p2, p3] = this.controlPoints;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    const tangent = new Vector2(
      -3 * mt2 * p0.x + 3 * mt2 * p1.x - 6 * mt * t * p1.x - 3 * t2 * p2.x + 6 * mt * t * p2.x + 3 * t2 * p3.x,
      -3 * mt2 * p0.y + 3 * mt2 * p1.y - 6 * mt * t * p1.y - 3 * t2 * p2.y + 6 * mt * t * p2.y + 3 * t2 * p3.y
    );

    return tangent.normalize();
  }
}
