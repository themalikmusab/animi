/**
 * Input Manager - Handles all user interactions
 */

import { CircuitSimulator } from '../core/CircuitSimulator';
import { Component } from '../core/Component';
import { Wire } from '../core/Wire';
import { Vector2 } from '../math/Vector2';
import { RenderEngine } from '../rendering/RenderEngine';

export enum InteractionMode {
  SELECT = 'select',
  PLACE_COMPONENT = 'place',
  WIRE = 'wire',
  DELETE = 'delete'
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private simulator: CircuitSimulator;

  private mode: InteractionMode = InteractionMode.SELECT;
  private componentToPlace: string | null = null;

  // Mouse state
  private mousePos: Vector2 = Vector2.zero();
  private isDragging: boolean = false;
  private selectedComponent: Component | null = null;
  private wireStartComponent: Component | null = null;
  private wireStartTerminal: number = 0;
  private dragOffset: Vector2 = Vector2.zero();

  constructor(canvas: HTMLCanvasElement, simulator: CircuitSimulator) {
    this.canvas = canvas;
    this.simulator = simulator;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getMousePosition(event: MouseEvent): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return new Vector2(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }

  private onMouseDown(event: MouseEvent): void {
    this.mousePos = this.getMousePosition(event);

    if (this.mode === InteractionMode.SELECT) {
      const component = this.simulator.getComponentAt(this.mousePos);

      if (component) {
        this.selectedComponent = component;
        this.isDragging = true;
        this.dragOffset = this.mousePos.subtract(component.getPosition());
      }
    } else if (this.mode === InteractionMode.WIRE) {
      this.startWire(this.mousePos);
    } else if (this.mode === InteractionMode.DELETE) {
      const component = this.simulator.getComponentAt(this.mousePos);
      if (component) {
        this.simulator.removeComponent(component);
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.mousePos = this.getMousePosition(event);

    if (this.isDragging && this.selectedComponent) {
      const newPos = this.mousePos.subtract(this.dragOffset);
      this.selectedComponent.setPosition(newPos);
    }
  }

  private onMouseUp(event: MouseEvent): void {
    this.mousePos = this.getMousePosition(event);

    if (this.mode === InteractionMode.WIRE && this.wireStartComponent) {
      this.endWire(this.mousePos);
    }

    this.isDragging = false;

    if (this.selectedComponent) {
      // Snap to grid on release
      const renderEngine = new RenderEngine(this.canvas);
      const snappedPos = renderEngine.snapToGrid(this.selectedComponent.getPosition());
      this.selectedComponent.setPosition(snappedPos);
      this.selectedComponent = null;
    }
  }

  private onDoubleClick(event: MouseEvent): void {
    this.mousePos = this.getMousePosition(event);
    const component = this.simulator.getComponentAt(this.mousePos);

    if (component) {
      // Toggle switch or open property editor
      if ((component as any).toggle) {
        (component as any).toggle();
      }
    }
  }

  private startWire(position: Vector2): void {
    const component = this.simulator.getComponentAt(position);

    if (component) {
      this.wireStartComponent = component;

      // Find closest terminal
      const terminals = component.getTerminals();
      let closestTerminal = 0;
      let minDist = Infinity;

      terminals.forEach((terminal, index) => {
        const dist = Vector2.distance(position, terminal.position);
        if (dist < minDist) {
          minDist = dist;
          closestTerminal = index;
        }
      });

      this.wireStartTerminal = closestTerminal;
    }
  }

  private endWire(position: Vector2): void {
    const endComponent = this.simulator.getComponentAt(position);

    if (endComponent && this.wireStartComponent && endComponent !== this.wireStartComponent) {
      // Find closest terminal on end component
      const terminals = endComponent.getTerminals();
      let closestTerminal = 0;
      let minDist = Infinity;

      terminals.forEach((terminal, index) => {
        const dist = Vector2.distance(position, terminal.position);
        if (dist < minDist) {
          minDist = dist;
          closestTerminal = index;
        }
      });

      // Create wire
      const wire = new Wire(
        this.wireStartComponent,
        this.wireStartTerminal,
        endComponent,
        closestTerminal
      );

      this.simulator.addWire(wire);
    }

    this.wireStartComponent = null;
  }

  setMode(mode: InteractionMode): void {
    this.mode = mode;
    this.wireStartComponent = null;
    this.selectedComponent = null;
  }

  getMode(): InteractionMode {
    return this.mode;
  }

  setComponentToPlace(componentType: string): void {
    this.componentToPlace = componentType;
    this.mode = InteractionMode.PLACE_COMPONENT;
  }

  getComponentToPlace(): string | null {
    return this.componentToPlace;
  }

  render(_renderEngine: RenderEngine): void {
    // Render wire preview
    if (this.mode === InteractionMode.WIRE && this.wireStartComponent) {
      const startTerminal = this.wireStartComponent.getTerminal(this.wireStartTerminal);
      if (startTerminal) {
        // Draw preview line (would need access to rendering context)
        // This is a placeholder - actual implementation would draw the preview wire
      }
    }
  }
}
