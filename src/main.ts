/**
 * Elite Circuit Builder - Main Entry Point
 * Advanced educational physics simulation
 */

import { CircuitSimulator } from './core/CircuitSimulator';
import { RenderEngine } from './rendering/RenderEngine';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { ParticleSystem } from './rendering/ParticleSystem';
import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';

class Application {
  private simulator: CircuitSimulator;
  private renderEngine: RenderEngine;
  private physicsEngine: PhysicsEngine;
  private particleSystem: ParticleSystem;
  private inputManager: InputManager;

  private lastTime = 0;
  private fps = 0;
  private frameCount = 0;
  private fpsTime = 0;

  constructor() {
    console.log('🚀 Initializing Elite Circuit Builder...');

    const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    const particleCanvas = document.getElementById('particleCanvas') as HTMLCanvasElement;

    if (!mainCanvas || !particleCanvas) {
      console.error('❌ Canvas elements not found!');
      throw new Error('Canvas elements not found');
    }

    console.log('✅ Canvas elements found');

    // Initialize systems
    this.renderEngine = new RenderEngine(mainCanvas);
    this.particleSystem = new ParticleSystem(particleCanvas);
    this.physicsEngine = new PhysicsEngine();
    this.simulator = new CircuitSimulator(this.physicsEngine);
    this.inputManager = new InputManager(mainCanvas, this.simulator);
    new UIManager(this.simulator, this.inputManager);

    console.log('✅ All systems initialized');

    this.setupCanvasResizing();
    this.hideLoading();
    this.start();

    console.log('✅ Application started! Click components below to add them.');
  }

  private setupCanvasResizing(): void {
    const resize = () => {
      const container = document.querySelector('.canvas-container') as HTMLElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      this.renderEngine.resize(width, height);
      this.particleSystem.resize(width, height);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      setTimeout(() => {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 500);
      }, 500);
    }
  }

  private start(): void {
    this.lastTime = performance.now();
    this.animate(this.lastTime);
  }

  private animate = (currentTime: number): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
      this.updateStats();
    }

    // Update simulation
    this.physicsEngine.update(deltaTime);
    this.particleSystem.update(deltaTime, this.simulator.getComponents(), this.simulator.getWires());

    // Render
    this.renderEngine.clear();
    this.renderEngine.renderGrid(this.simulator.getComponents().length === 0);
    this.renderEngine.renderWires(this.simulator.getWires());
    this.renderEngine.renderComponents(this.simulator.getComponents());
    this.inputManager.render(this.renderEngine);

    this.particleSystem.render();
  }

  private updateStats(): void {
    const fpsElement = document.getElementById('fps');
    const particlesElement = document.getElementById('particles');
    const componentsElement = document.getElementById('components');

    if (fpsElement) fpsElement.textContent = this.fps.toString();
    if (particlesElement) particlesElement.textContent = this.particleSystem.getParticleCount().toString();
    if (componentsElement) componentsElement.textContent = this.simulator.getComponents().length.toString();
  }
}

// Initialize application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Application();
});
