import { defaultFilterVert, Filter, GlProgram, GpuProgram } from 'pixi.js';

// Zoom alejado (escala 0,5 con resolución x1): la sala se pinta al doble y cada píxel final es la media de 4, así sale
// suave en vez de perder una de cada dos líneas. Con versión WebGL y WebGPU.
const FRAGMENTO = `in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputPixel;
uniform vec4 uInputClamp;

vec4 sampleAt(vec2 delta)
{
    return texture(uTexture, clamp(vTextureCoord + delta * uInputPixel.zw, uInputClamp.xy, uInputClamp.zw));
}

void main(void)
{
    finalColor = (sampleAt(vec2(-0.5, -0.5)) + sampleAt(vec2(0.5, -0.5)) + sampleAt(vec2(-0.5, 0.5)) + sampleAt(vec2(0.5, 0.5))) * 0.25;
}`;

const WGSL = `struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv : vec2<f32>
};

@vertex
fn mainVertex(@location(0) aPosition : vec2<f32>) -> VSOutput
{
  var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
  position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

  return VSOutput(vec4(position, 0.0, 1.0), aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw));
}

fn sampleAt(uv: vec2<f32>, delta: vec2<f32>) -> vec4<f32>
{
  return textureSampleLevel(uTexture, uSampler, clamp(uv + delta * gfu.uInputPixel.zw, gfu.uInputClamp.xy, gfu.uInputClamp.zw), 0.0);
}

@fragment
fn mainFragment(@location(0) uv: vec2<f32>, @builtin(position) position: vec4<f32>) -> @location(0) vec4<f32>
{
  return (sampleAt(uv, vec2<f32>(-0.5, -0.5)) + sampleAt(uv, vec2<f32>(0.5, -0.5)) + sampleAt(uv, vec2<f32>(-0.5, 0.5)) + sampleAt(uv, vec2<f32>(0.5, 0.5))) * 0.25;
}`;

export class RoomDownsampleFilter extends Filter
{
    // Componer al doble cuesta: en equipos justos el zoom alejado iría a menos FPS. Lo enciende el cliente según el
    // perfil de rendimiento (Alto y Máximo).
    public static enabled: boolean = true;

    constructor(resolution: number)
    {
        super({
            glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: FRAGMENTO, name: 'room-downsample-filter' }),
            gpuProgram: GpuProgram.from({ vertex: { source: WGSL, entryPoint: 'mainVertex' }, fragment: { source: WGSL, entryPoint: 'mainFragment' } }),
            resolution,
            antialias: 'off',
            resources: {}
        });
    }
}
