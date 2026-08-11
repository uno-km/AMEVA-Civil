/**
 * AMEVA-Civil Phase 20: WebGPU Parallel Compute Shader Accelerator
 */
export class WebGPUSolverAccelerator {
  private device: GPUDevice | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.initWebGPU();
  }

  private async initWebGPU() {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          this.device = await adapter.requestDevice();
          this.isSupported = !!this.device;
          console.log("⚡ WebGPU Compute Shader Engine Initialized Successfully!");
        }
      } catch (err) {
        console.warn("WebGPU not available, falling back to WASM/CPU MathJS Solver.");
      }
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Parallel matrix-vector multiplication using WebGPU Compute Shader
   */
  public async computeMatrixVectorMult(matrix: number[][], vector: number[]): Promise<number[]> {
    if (!this.device) {
      // CPU Fallback
      return matrix.map(row => row.reduce((sum, val, colIdx) => sum + val * vector[colIdx], 0));
    }

    const numRows = matrix.length;
    const numCols = vector.length;

    const matrixFlat = new Float32Array(matrix.flat());
    const vectorFlat = new Float32Array(vector);
    const resultFlat = new Float32Array(numRows);

    // Create GPUBuffers
    const matrixBuffer = this.device.createBuffer({
      size: matrixFlat.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(matrixBuffer, 0, matrixFlat);

    const vectorBuffer = this.device.createBuffer({
      size: vectorFlat.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(vectorBuffer, 0, vectorFlat);

    const resultBuffer = this.device.createBuffer({
      size: resultFlat.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const readBuffer = this.device.createBuffer({
      size: resultFlat.byteLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    // WGSL Shader Code
    const shaderModule = this.device.createShaderModule({
      code: `
        @group(0) @binding(0) var<storage, read> M : array<f32>;
        @group(0) @binding(1) var<storage, read> V : array<f32>;
        @group(0) @binding(2) var<storage, read_write> R : array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
          let row = global_id.x;
          let numCols = ${numCols}u;
          if (row < ${numRows}u) {
            var sum : f32 = 0.0;
            for (var c = 0u; c < numCols; c = c + 1u) {
              sum = sum + M[row * numCols + c] * V[c];
            }
            R[row] = sum;
          }
        }
      `
    });

    const computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module: shaderModule, entryPoint: 'main' }
    });

    const bindGroup = this.device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: matrixBuffer } },
        { binding: 1, resource: { buffer: vectorBuffer } },
        { binding: 2, resource: { buffer: resultBuffer } }
      ]
    });

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(numRows / 64));
    passEncoder.end();

    commandEncoder.copyBufferToBuffer(resultBuffer, 0, readBuffer, 0, resultFlat.byteLength);
    this.device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const output = Array.from(new Float32Array(arrayBuffer));
    readBuffer.unmap();

    return output;
  }
}

export const webGPUAccelerator = new WebGPUSolverAccelerator();
