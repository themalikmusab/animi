/**
 * UI Manager - Handles toolbar and UI interactions
 */

import { CircuitSimulator } from '../core/CircuitSimulator';
import { InputManager, InteractionMode } from '../input/InputManager';
import { Battery } from '../components/Battery';
import { Resistor } from '../components/Resistor';
import { LED } from '../components/LED';
import { Switch } from '../components/Switch';
import { Capacitor } from '../components/Capacitor';
import { Motor } from '../components/Motor';
import { Vector2 } from '../math/Vector2';

export class UIManager {
  private simulator: CircuitSimulator;
  private inputManager: InputManager;
  private toolbar: HTMLElement;

  constructor(simulator: CircuitSimulator, inputManager: InputManager) {
    this.simulator = simulator;
    this.inputManager = inputManager;

    const toolbar = document.getElementById('toolbar');
    if (!toolbar) throw new Error('Toolbar element not found');
    this.toolbar = toolbar;

    this.setupToolbar();
  }

  private setupToolbar(): void {
    const buttons = this.toolbar.querySelectorAll('.component-btn');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const componentType = (button as HTMLElement).dataset.component;

        if (!componentType) return;

        // Remove active class from all buttons
        buttons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Handle button action
        this.handleToolbarAction(componentType);
      });
    });
  }

  private handleToolbarAction(action: string): void {
    const canvasContainer = document.querySelector('.canvas-container') as HTMLElement;
    const centerX = canvasContainer.clientWidth / 2;
    const centerY = canvasContainer.clientHeight / 2;

    switch (action) {
      case 'wire':
        this.inputManager.setMode(InteractionMode.WIRE);
        break;

      case 'delete':
        this.inputManager.setMode(InteractionMode.DELETE);
        break;

      case 'clear':
        if (confirm('Clear all components and wires?')) {
          this.simulator.clear();
        }
        this.inputManager.setMode(InteractionMode.SELECT);
        break;

      case 'battery':
        this.placeComponent(new Battery(new Vector2(centerX, centerY), 9));
        break;

      case 'resistor':
        this.placeComponent(new Resistor(new Vector2(centerX, centerY), 1000));
        break;

      case 'led':
        this.placeComponent(new LED(new Vector2(centerX, centerY), 'red'));
        break;

      case 'switch':
        this.placeComponent(new Switch(new Vector2(centerX, centerY), true));
        break;

      case 'capacitor':
        this.placeComponent(new Capacitor(new Vector2(centerX, centerY), 0.0001));
        break;

      case 'motor':
        this.placeComponent(new Motor(new Vector2(centerX, centerY)));
        break;

      case 'multimeter':
        // TODO: Implement multimeter tool
        alert('Multimeter tool - Coming soon!');
        this.inputManager.setMode(InteractionMode.SELECT);
        break;

      default:
        this.inputManager.setMode(InteractionMode.SELECT);
    }
  }

  private placeComponent(component: any): void {
    this.simulator.addComponent(component);
    this.inputManager.setMode(InteractionMode.SELECT);
  }
}
