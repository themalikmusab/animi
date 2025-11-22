/**
 * Advanced Rendering Engine
 * High-quality canvas rendering with effects
 */

import { Component, ComponentType } from '../core/Component';
import { Wire } from '../core/Wire';
import { Vector2 } from '../math/Vector2';
import { Battery } from '../components/Battery';
import { Resistor } from '../components/Resistor';
import { LED } from '../components/LED';
import { Switch } from '../components/Switch';
import { Capacitor } from '../components/Capacitor';
import { Motor } from '../components/Motor';

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private gridSize: number = 20;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;

    // Enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderGrid(): void {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;

    // Vertical lines
    for (let x = 0; x < this.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < this.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  renderWires(wires: Wire[]): void {
    for (const wire of wires) {
      wire.updateControlPoints();
      this.renderWire(wire);
    }
  }

  private renderWire(wire: Wire): void {
    const current = Math.abs(wire.getCurrent());
    const [p0, p1, p2, p3] = wire.getControlPoints();

    // Wire thickness based on current
    const baseWidth = 3;
    const currentWidth = Math.min(current * 50, 5);
    const wireWidth = baseWidth + currentWidth;

    // Wire color based on current
    const intensity = Math.min(current * 100, 255);

    this.ctx.save();

    // Glow effect for high current
    if (current > 0.01) {
      this.ctx.shadowColor = `rgba(255, ${200 - intensity}, 0, 0.8)`;
      this.ctx.shadowBlur = 10 + intensity / 10;
    }

    // Draw wire
    this.ctx.strokeStyle = current > 0.01 ? `rgb(${100 + intensity}, 50, 0)` : '#555';
    this.ctx.lineWidth = wireWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(p0.x, p0.y);
    this.ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    this.ctx.stroke();

    this.ctx.restore();

    // Draw terminals
    this.renderTerminal(p0);
    this.renderTerminal(p3);
  }

  private renderTerminal(pos: Vector2): void {
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.strokeStyle = '#cc9900';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  renderComponents(components: Component[]): void {
    for (const component of components) {
      this.renderComponent(component);
    }
  }

  private renderComponent(component: Component): void {
    this.ctx.save();

    const pos = component.getPosition();
    this.ctx.translate(pos.x, pos.y);
    this.ctx.rotate(component.getRotation());

    // Heat glow effect
    const temp = component.getTemperature();
    if (temp > 50) {
      const heatIntensity = Math.min((temp - 50) / 100, 1);
      this.ctx.shadowColor = `rgba(255, ${100 * (1 - heatIntensity)}, 0, ${heatIntensity})`;
      this.ctx.shadowBlur = 20 * heatIntensity;
    }

    switch (component.getType()) {
      case ComponentType.BATTERY:
        this.renderBattery(component as unknown as Battery);
        break;
      case ComponentType.RESISTOR:
        this.renderResistor(component as unknown as Resistor);
        break;
      case ComponentType.LED:
        this.renderLED(component as unknown as LED);
        break;
      case ComponentType.SWITCH:
        this.renderSwitch(component as unknown as Switch);
        break;
      case ComponentType.CAPACITOR:
        this.renderCapacitor(component as unknown as Capacitor);
        break;
      case ComponentType.MOTOR:
        this.renderMotor(component as unknown as Motor);
        break;
    }

    this.ctx.restore();

    // Render terminals
    for (const terminal of component.getTerminals()) {
      this.renderTerminal(terminal.position);
    }

    // Burn effect
    if (component.isBurnedOut()) {
      this.renderBurnEffect(component);
    }
  }

  private renderBattery(battery: Battery): void {
    const width = battery.getWidth();
    const height = battery.getHeight();

    // Body
    const gradient = this.ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
    gradient.addColorStop(0, '#34495e');
    gradient.addColorStop(0.5, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');

    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;

    this.ctx.fillRect(-width / 2, -height / 2, width, height);
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);

    // Positive terminal (right)
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(width / 2 - 8, -8, 8, 16);

    // Negative terminal (left)
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(-width / 2, -8, 8, 16);

    // Plus symbol
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2 - 12, 0);
    this.ctx.lineTo(width / 2 - 6, 0);
    this.ctx.moveTo(width / 2 - 9, -3);
    this.ctx.lineTo(width / 2 - 9, 3);
    this.ctx.stroke();

    // Minus symbol
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2 + 6, 0);
    this.ctx.lineTo(-width / 2 + 12, 0);
    this.ctx.stroke();

    // Voltage label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${battery.getVoltage()}V`, 0, 0);
  }

  private renderResistor(resistor: Resistor): void {
    const width = resistor.getWidth();
    const height = resistor.getHeight();

    // Body - zigzag pattern
    this.ctx.fillStyle = '#d4a373';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;

    const bodyWidth = width * 0.6;
    const bodyHeight = height * 0.8;

    // Rounded rectangle body
    this.ctx.beginPath();
    this.ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    // Color bands
    const bands = resistor.getColorBands();
    const bandWidth = 3;
    const startX = -bodyWidth / 2 + 10;
    const spacing = 8;

    bands.forEach((color, index) => {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(startX + index * spacing, -bodyHeight / 2, bandWidth, bodyHeight);
    });

    // Leads
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-bodyWidth / 2, 0);
    this.ctx.moveTo(bodyWidth / 2, 0);
    this.ctx.lineTo(width / 2, 0);
    this.ctx.stroke();

    // Resistance value
    this.ctx.fillStyle = '#000';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const resistance = resistor.getResistance();
    const resistanceText = resistance >= 1000 ? `${(resistance / 1000).toFixed(1)}kΩ` : `${resistance}Ω`;
    this.ctx.fillText(resistanceText, 0, bodyHeight / 2 + 3);
  }

  private renderLED(led: LED): void {
    const width = led.getWidth();
    const brightness = led.getBrightness();

    // LED body - dome shape
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, width / 2);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, led.getLEDColor());
    gradient.addColorStop(1, '#666');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, width / 2 - 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Glow effect when lit
    if (brightness > 0 && !led.isBurnedOut()) {
      this.ctx.shadowColor = led.getLEDColor();
      this.ctx.shadowBlur = 30 * brightness;
      this.ctx.fillStyle = led.getLEDColor();
      this.ctx.globalAlpha = brightness * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }

    // Outline
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, width / 2 - 2, 0, Math.PI * 2);
    this.ctx.stroke();

    // Leads
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-width / 2 + 5, 0);
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2 - 5, 0);
    this.ctx.stroke();

    // Flat side indicator (cathode)
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2 - 10, -8);
    this.ctx.lineTo(width / 2 - 10, 8);
    this.ctx.stroke();
  }

  private renderSwitch(switchComp: Switch): void {
    const width = switchComp.getWidth();
    const height = switchComp.getHeight();
    const isOpen = switchComp.getIsOpen();

    // Base
    this.ctx.fillStyle = '#555';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(-width / 2, -height / 4, width, height / 2);
    this.ctx.strokeRect(-width / 2, -height / 4, width, height / 2);

    // Terminals
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.beginPath();
    this.ctx.arc(-width / 2 + 10, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(width / 2 - 10, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Switch arm
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2 + 10, 0);

    if (isOpen) {
      this.ctx.lineTo(width / 2 - 15, -12);
    } else {
      this.ctx.lineTo(width / 2 - 10, 0);
    }

    this.ctx.stroke();

    // Label
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(isOpen ? 'OPEN' : 'CLOSED', 0, height / 2 + 12);
  }

  private renderCapacitor(capacitor: Capacitor): void {
    const width = capacitor.getWidth();
    const height = capacitor.getHeight();

    // Plates
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(-3, -height / 2, 6, height);
    this.ctx.fillRect(-10, -height / 2 + 10, 3, height - 20);
    this.ctx.fillRect(7, -height / 2 + 10, 3, height - 20);

    // Outer casing
    this.ctx.strokeStyle = '#2980b9';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(-width / 3, -height / 2, width / 3 * 2, height, 4);
    this.ctx.stroke();

    // Leads
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-width / 3, 0);
    this.ctx.moveTo(width / 3, 0);
    this.ctx.lineTo(width / 2, 0);
    this.ctx.stroke();

    // Polarity marker
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('+', -width / 3 + 8, -height / 2 - 5);

    // Value
    this.ctx.fillStyle = '#000';
    this.ctx.font = '10px Arial';
    const capacitance = capacitor['capacitance'];
    const valueText = capacitance >= 0.001 ? `${(capacitance * 1000).toFixed(0)}mF` : `${(capacitance * 1000000).toFixed(0)}µF`;
    this.ctx.fillText(valueText, 0, height / 2 + 12);
  }

  private renderMotor(motor: Motor): void {
    const width = motor.getWidth();
    const height = motor.getHeight();
    const rpm = motor.getRPM();
    const rotorAngle = motor.getRotorAngle();

    // Motor body
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, width / 2);
    gradient.addColorStop(0, '#5a6c7d');
    gradient.addColorStop(1, '#34495e');

    this.ctx.fillStyle = gradient;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(0, 0, width / 2 - 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Rotor
    this.ctx.save();
    this.ctx.rotate(rotorAngle);

    this.ctx.fillStyle = '#c0392b';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -width / 4);
    this.ctx.lineTo(width / 6, 0);
    this.ctx.lineTo(0, width / 4);
    this.ctx.lineTo(-width / 6, 0);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();

    // Center shaft
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // RPM indicator
    this.ctx.fillStyle = '#000';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${rpm.toFixed(0)} RPM`, 0, height / 2 + 12);

    // Terminals
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-width / 2 + 5, 0);
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2 - 5, 0);
    this.ctx.stroke();
  }

  private renderBurnEffect(component: Component): void {
    const pos = component.getPosition();
    const width = component.getWidth();
    const height = component.getHeight();

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);

    // Burn marks
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, width / 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Crack effect
    this.ctx.strokeStyle = 'rgba(50, 30, 20, 0.9)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(
        Math.cos(angle) * width / 2,
        Math.sin(angle) * height / 2
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  snapToGrid(position: Vector2): Vector2 {
    return new Vector2(
      Math.round(position.x / this.gridSize) * this.gridSize,
      Math.round(position.y / this.gridSize) * this.gridSize
    );
  }
}
