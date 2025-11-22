/**
 * Particle System - Beautiful electron flow visualization
 * This makes the simulation truly stunning
 */

import { Component } from '../core/Component';
import { Wire } from '../core/Wire';
import { Vector2 } from '../math/Vector2';

interface Particle {
  position: Vector2;
  velocity: Vector2;
  wireId: string;
  t: number; // Position along wire (0-1)
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width: number;
  private height: number;

  // Particle spawn settings
  private particleSpawnRate: number = 0.02; // particles per frame per wire
  private maxParticles: number = 5000;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get 2D context for particles');
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

  update(deltaTime: number, _components: Component[], wires: Wire[]): void {
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update lifetime
      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      // Move along wire
      const wire = wires.find(w => w.getId() === particle.wireId);
      if (!wire) {
        this.particles.splice(i, 1);
        continue;
      }

      const current = wire.getCurrent();
      const speed = Math.abs(current) * 0.5; // Speed based on current

      // Update position along wire
      particle.t += speed * deltaTime * (current >= 0 ? 1 : -1);

      // Remove if off the wire
      if (particle.t < 0 || particle.t > 1) {
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.position = wire.getPointAt(particle.t);
    }

    // Spawn new particles
    if (this.particles.length < this.maxParticles) {
      this.spawnParticles(wires);
    }
  }

  private spawnParticles(wires: Wire[]): void {
    for (const wire of wires) {
      const current = Math.abs(wire.getCurrent());

      if (current < 0.001) continue; // No flow, no particles

      // Spawn probability based on current
      const spawnProbability = this.particleSpawnRate * Math.min(current * 100, 10);

      if (Math.random() < spawnProbability) {
        const isForward = wire.getCurrent() >= 0;

        // Create particle
        const particle: Particle = {
          position: isForward ? wire.getStartPosition() : wire.getEndPosition(),
          velocity: Vector2.zero(),
          wireId: wire.getId(),
          t: isForward ? 0 : 1,
          lifetime: 0,
          maxLifetime: 2 + Math.random(), // 2-3 seconds
          size: 2 + Math.random() * 2,
          color: this.getParticleColor(current)
        };

        this.particles.push(particle);
      }
    }
  }

  private getParticleColor(current: number): string {
    // Color based on current intensity
    const intensity = Math.min(current * 100, 1);

    if (intensity > 0.5) {
      // High current - orange/red
      const red = 255;
      const green = Math.floor(165 * (1 - intensity));
      return `rgb(${red}, ${green}, 0)`;
    } else {
      // Low current - blue/cyan
      const blue = 255;
      const green = Math.floor(intensity * 200);
      return `rgb(0, ${green}, ${blue})`;
    }
  }

  render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render particles with additive blending
    this.ctx.globalCompositeOperation = 'lighter';

    for (const particle of this.particles) {
      const fade = 1 - (particle.lifetime / particle.maxLifetime);
      const alpha = fade * 0.8;

      // Glow effect
      const gradient = this.ctx.createRadialGradient(
        particle.position.x, particle.position.y, 0,
        particle.position.x, particle.position.y, particle.size * 3
      );

      gradient.addColorStop(0, particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
      gradient.addColorStop(0.5, particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.5})`));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(particle.position.x, particle.position.y, particle.size * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Core
      this.ctx.fillStyle = particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      this.ctx.beginPath();
      this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }
}
