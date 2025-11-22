/**
 * Physics Engine - Modified Nodal Analysis (MNA) for circuit simulation
 * This is the heart of accurate circuit simulation
 */

import { Component } from '../core/Component';
import { Wire } from '../core/Wire';

interface CircuitNode {
  id: number;
  voltage: number;
  components: Component[];
}

export class PhysicsEngine {
  private components: Component[] = [];
  private wires: Wire[] = [];
  private nodes: Map<number, CircuitNode> = new Map();
  private groundNode: number = 0;

  // Simulation parameters
  private timeStep: number = 0.001; // 1ms
  private accumulator: number = 0;

  addComponent(component: Component): void {
    this.components.push(component);
    this.rebuildCircuit();
  }

  removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index > -1) {
      this.components.splice(index, 1);
      this.rebuildCircuit();
    }
  }

  addWire(wire: Wire): void {
    this.wires.push(wire);
    this.rebuildCircuit();
  }

  removeWire(wire: Wire): void {
    const index = this.wires.indexOf(wire);
    if (index > -1) {
      this.wires.splice(index, 1);
      this.rebuildCircuit();
    }
  }

  clear(): void {
    this.components = [];
    this.wires = [];
    this.nodes.clear();
  }

  update(deltaTime: number): void {
    // Fixed timestep simulation for stability
    this.accumulator += deltaTime;

    while (this.accumulator >= this.timeStep) {
      this.simulate(this.timeStep);
      this.accumulator -= this.timeStep;
    }

    // Update components
    for (const component of this.components) {
      component.update(deltaTime);
    }
  }

  private simulate(_dt: number): void {
    if (this.components.length === 0) return;

    // Solve circuit using Modified Nodal Analysis
    this.solveCircuit();
  }

  private rebuildCircuit(): void {
    // Rebuild node connectivity
    this.nodes.clear();

    // Assign nodes to component terminals
    for (const component of this.components) {
      const terminals = component.getTerminals();
      for (const terminal of terminals) {
        if (!this.nodes.has(terminal.node)) {
          this.nodes.set(terminal.node, {
            id: terminal.node,
            voltage: 0,
            components: []
          });
        }
      }
    }

    // Connect nodes via wires
    for (const wire of this.wires) {
      const startTerminal = wire.getStartComponent().getTerminal(wire.getStartTerminal());
      const endTerminal = wire.getEndComponent().getTerminal(wire.getEndTerminal());

      if (startTerminal && endTerminal) {
        // Merge nodes (wires connect nodes)
        const minNode = Math.min(startTerminal.node, endTerminal.node);
        const maxNode = Math.max(startTerminal.node, endTerminal.node);

        // Update all terminals with maxNode to use minNode
        for (const component of this.components) {
          for (const terminal of component.getTerminals()) {
            if (terminal.node === maxNode) {
              terminal.node = minNode;
            }
          }
        }
      }
    }
  }

  private solveCircuit(): void {
    // Build MNA matrices
    const nodeCount = this.nodes.size;
    const voltageSourceCount = this.countVoltageSources();
    const matrixSize = nodeCount + voltageSourceCount;

    if (matrixSize === 0) return;

    // G matrix (conductances) and b vector (currents/voltages)
    const G: number[][] = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(0));
    const b: number[] = Array(matrixSize).fill(0);

    // Build conductance matrix
    this.buildConductanceMatrix(G, b);

    // Solve using Gaussian elimination
    const x = this.gaussianElimination(G, b);

    if (x) {
      // Apply solution to nodes
      let nodeIndex = 0;
      for (const [nodeId, node] of this.nodes) {
        if (nodeId !== this.groundNode && nodeIndex < x.length) {
          node.voltage = x[nodeIndex];
          nodeIndex++;
        }
      }

      // Update component voltages and currents
      this.updateComponentValues(x);
    }
  }

  private buildConductanceMatrix(G: number[][], b: number[]): void {
    // Simplified circuit analysis
    // In a full implementation, this would build the complete MNA matrix
    // For now, we'll use a simplified approach for basic components

    let nodeIndex = 0;
    const nodeMap = new Map<number, number>();

    for (const [nodeId] of this.nodes) {
      if (nodeId !== this.groundNode) {
        nodeMap.set(nodeId, nodeIndex);
        nodeIndex++;
      }
    }

    // Add component contributions
    for (const component of this.components) {
      const terminals = component.getTerminals();
      if (terminals.length === 2) {
        const resistance = component.getResistance();
        const voltage = component.getVoltage();

        if (resistance > 0) {
          const conductance = 1 / resistance;
          const n1 = nodeMap.get(terminals[0].node);
          const n2 = nodeMap.get(terminals[1].node);

          if (n1 !== undefined && n2 !== undefined) {
            G[n1][n1] += conductance;
            G[n1][n2] -= conductance;
            G[n2][n1] -= conductance;
            G[n2][n2] += conductance;
          }
        }

        // Add voltage source
        if (voltage !== 0) {
          const n1 = nodeMap.get(terminals[0].node);
          const n2 = nodeMap.get(terminals[1].node);

          if (n1 !== undefined) {
            b[n1] += voltage / (resistance || 1);
          }
          if (n2 !== undefined) {
            b[n2] -= voltage / (resistance || 1);
          }
        }
      }
    }
  }

  private gaussianElimination(A: number[][], b: number[]): number[] | null {
    const n = b.length;
    if (n === 0) return null;

    // Augmented matrix
    const augmented: number[][] = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Skip if pivot is too small
      if (Math.abs(augmented[i][i]) < 1e-10) continue;

      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const x: number[] = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      if (Math.abs(augmented[i][i]) < 1e-10) {
        x[i] = 0;
        continue;
      }

      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  private countVoltageSources(): number {
    return this.components.filter(c => c.getVoltage() !== 0).length;
  }

  private updateComponentValues(_solution: number[]): void {
    // Update currents through components based on voltage solution
    for (const wire of this.wires) {
      const startTerm = wire.getStartComponent().getTerminal(wire.getStartTerminal());
      const endTerm = wire.getEndComponent().getTerminal(wire.getEndTerminal());

      if (startTerm && endTerm) {
        const voltageDiff = startTerm.voltage - endTerm.voltage;
        const current = voltageDiff / wire.getResistance();
        wire.setCurrent(current);

        startTerm.current = current;
        endTerm.current = -current;
      }
    }
  }
}
