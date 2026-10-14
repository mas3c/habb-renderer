import { Filter, GlProgram, GpuProgram } from 'pixi.js';

/**
 * El shader del Splash (el «TeleportDissolveFilter» de Hyris tal cual: WGSL para WebGPU y GLSL 300 para WebGL):
 * construye el keko de abajo arriba (rebuilding 1, progress de 0,72 a 0) o lo deshace en celdas que se apagan
 * con un brillo del color del Splash (rebuilding 0, progress de 0 a 1). style elige por dónde empieza.
 */
const VERTICE_GPU = `
struct GlobalFilterUniforms {
    uInputSize: vec4<f32>,
    uInputPixel: vec4<f32>,
    uInputClamp: vec4<f32>,
    uOutputFrame: vec4<f32>,
    uGlobalFrame: vec4<f32>,
    uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return VSOutput(
        vec4<f32>(position, 0.0, 1.0),
        aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw),
    );
}`;

const FRAGMENTO_GPU = `
struct GlobalFilterUniforms {
    uInputSize: vec4<f32>,
    uInputPixel: vec4<f32>,
    uInputClamp: vec4<f32>,
    uOutputFrame: vec4<f32>,
    uGlobalFrame: vec4<f32>,
    uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct TeleportUniforms {
    progress: f32,
    elapsed: f32,
    rebuilding: f32,
    style: f32,
    tint: vec3<f32>,
};

@group(1) @binding(0) var<uniform> teleportUniforms: TeleportUniforms;

fn hash(value: vec2<f32>) -> f32 {
    return fract(sin(dot(value, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

@fragment
fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let original = textureSample(uTexture, uSampler, uv);
    if(original.a <= 0.001) { return original; }

    let cell = floor(uv * vec2<f32>(64.0, 110.0) / 2.0);
    let noise = hash(cell);
    let style = teleportUniforms.style;
    var threshold = clamp((uv.y * 0.68) + (noise * 0.14), 0.0, 0.82);

    if(style > 0.5 && style < 1.5) {
        threshold = clamp(uv.y + ((noise - 0.5) * 0.08), 0.0, 1.0);
    } else if(style > 1.5 && style < 2.5) {
        threshold = clamp(length(uv - vec2<f32>(0.5, 0.5)) * 1.42 + (noise * 0.08), 0.0, 1.0);
    } else if(style > 2.5 && style < 3.5) {
        threshold = clamp((uv.x * 0.56) + (uv.y * 0.32) + ((noise - 0.5) * 0.22), 0.0, 1.0);
    }

    // Estilos de los Splash de 2026-09-29 (4 a 9): en proporcion al muneco (frameUv va de 0 a 1 sobre el).
    let frameUv = uv / (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
    let pix = frameUv * gfu.uOutputFrame.zw;
    var celda = cell;
    var ruido = noise;
    var base = original.rgb;

    if(style > 3.5) {
        celda = floor(pix / 2.0);
        ruido = hash(celda);

        if(style < 4.5) {
            threshold = clamp((hash(vec2<f32>(floor(pix.y / 2.0), 7.0)) * 0.68) + (ruido * 0.14), 0.0, 0.82);
            if(teleportUniforms.progress > 0.02) {
                let fila = floor(pix.y) - (2.0 * floor(floor(pix.y) / 2.0));
                base = mix(original.rgb, teleportUniforms.tint * original.a, 0.22) * (0.78 + (0.22 * fila));
            }
        } else if(style < 5.5) {
            threshold = clamp(((1.0 - frameUv.y) * 0.68) + (ruido * 0.14), 0.0, 0.82);
        } else if(style < 6.5) {
            let r = clamp(length((frameUv - vec2<f32>(0.5, 0.58)) * vec2<f32>(1.3, 1.0)) * 1.6, 0.0, 1.0);
            threshold = clamp(((1.0 - r) * 0.68) + (ruido * 0.14), 0.0, 0.82);
        } else if(style < 7.5) {
            threshold = clamp((hash(floor(pix / 6.0) + vec2<f32>(3.7, 1.3)) * 0.74) + (ruido * 0.06), 0.0, 0.82);
        } else if(style < 8.5) {
            threshold = clamp((frameUv.y * 0.68) + (ruido * 0.14), 0.0, 0.82);
        } else {
            threshold = clamp(((((1.0 - frameUv.x) * 0.5) + (frameUv.y * 0.22)) * 0.95) + (ruido * 0.14), 0.0, 0.82);
        }
    }

    if(teleportUniforms.rebuilding > 0.5) {
        let materialized = step(teleportUniforms.progress, threshold);
        let edge = 1.0 - smoothstep(0.0, 0.12, abs(teleportUniforms.progress - threshold));
        let edgeColor = mix(base * 0.56, teleportUniforms.tint, 0.72);
        let rgb = mix(base, edgeColor, edge);
        let alpha = original.a * max(materialized, edge * 0.92);
        return vec4<f32>(rgb, alpha);
    }

    if(teleportUniforms.progress <= threshold) { return vec4<f32>(base, original.a); }

    let age = clamp((teleportUniforms.progress - threshold) / 0.48, 0.0, 1.0);
    let sparkle = pow(max(0.0, sin((teleportUniforms.elapsed * 7.0) + (ruido * 18.0))), 14.0);
    let visibility = (1.0 - age) * step((age * 0.5) - 0.10, hash(celda + vec2<f32>(19.3, 7.1)));
    let rgb = mix(base * 0.48, teleportUniforms.tint, 0.18 + (sparkle * 0.25)) * visibility;
    return vec4<f32>(rgb, original.a * visibility);
}`;

const VERTICE_GL = `in vec2 aPosition;
                out vec2 vTextureCoord;
                uniform vec4 uInputSize;
                uniform vec4 uOutputFrame;
                uniform vec4 uOutputTexture;
                vec4 filterVertexPosition(void) {
                    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
                    return vec4(position, 0.0, 1.0);
                }
                vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
                void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }`;

const FRAGMENTO_GL = `in vec2 vTextureCoord;
                out vec4 finalColor;
                uniform sampler2D uTexture;
                // Con la misma precision que en el vertex (si no, el programa no enlaza).
                uniform highp vec4 uInputSize;
                uniform highp vec4 uOutputFrame;
                uniform float progress;
                uniform float elapsed;
                uniform float rebuilding;
                uniform float style;
                uniform vec3 tint;
                float hash(vec2 value) { return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123); }
                void main(void) {
                    vec4 original = texture(uTexture, vTextureCoord);
                    if(original.a <= 0.001) { finalColor = original; return; }
                    vec2 cell = floor(vTextureCoord * vec2(64.0, 110.0) / 2.0);
                    float noise = hash(cell);
                    float threshold = clamp((vTextureCoord.y * 0.68) + (noise * 0.14), 0.0, 0.82);
                    if(style > 0.5 && style < 1.5) {
                        threshold = clamp(vTextureCoord.y + ((noise - .5) * .08), 0.0, 1.0);
                    } else if(style > 1.5 && style < 2.5) {
                        threshold = clamp(length(vTextureCoord - vec2(.5, .5)) * 1.42 + (noise * .08), 0.0, 1.0);
                    } else if(style > 2.5 && style < 3.5) {
                        threshold = clamp((vTextureCoord.x * .56) + (vTextureCoord.y * .32) + ((noise - .5) * .22), 0.0, 1.0);
                    }
                    // Estilos de los Splash de 2026-09-29 (4 a 9): en proporcion al muneco.
                    vec2 frameUv = vTextureCoord / (uOutputFrame.zw * uInputSize.zw);
                    vec2 pix = frameUv * uOutputFrame.zw;
                    vec2 celda = cell;
                    float ruido = noise;
                    vec3 base = original.rgb;
                    if(style > 3.5) {
                        celda = floor(pix / 2.0);
                        ruido = hash(celda);
                        if(style < 4.5) {
                            threshold = clamp((hash(vec2(floor(pix.y / 2.0), 7.0)) * .68) + (ruido * .14), 0.0, 0.82);
                            if(progress > 0.02) {
                                float fila = mod(floor(pix.y), 2.0);
                                base = mix(original.rgb, tint * original.a, 0.22) * (0.78 + (0.22 * fila));
                            }
                        } else if(style < 5.5) {
                            threshold = clamp(((1.0 - frameUv.y) * .68) + (ruido * .14), 0.0, 0.82);
                        } else if(style < 6.5) {
                            float r = clamp(length((frameUv - vec2(.5, .58)) * vec2(1.3, 1.0)) * 1.6, 0.0, 1.0);
                            threshold = clamp(((1.0 - r) * .68) + (ruido * .14), 0.0, 0.82);
                        } else if(style < 7.5) {
                            threshold = clamp((hash(floor(pix / 6.0) + vec2(3.7, 1.3)) * .74) + (ruido * .06), 0.0, 0.82);
                        } else if(style < 8.5) {
                            threshold = clamp((frameUv.y * .68) + (ruido * .14), 0.0, 0.82);
                        } else {
                            threshold = clamp(((((1.0 - frameUv.x) * .5) + (frameUv.y * .22)) * .95) + (ruido * .14), 0.0, 0.82);
                        }
                    }
                    if(rebuilding > 0.5) {
                        float materialized = step(progress, threshold);
                        float edge = 1.0 - smoothstep(0.0, 0.12, abs(progress - threshold));
                        vec3 edgeColor = mix(base * 0.56, tint, 0.72);
                        vec3 rgb = mix(base, edgeColor, edge);
                        float alpha = original.a * max(materialized, edge * 0.92);
                        finalColor = vec4(rgb, alpha);
                        return;
                    }
                    if(progress <= threshold) { finalColor = vec4(base, original.a); return; }
                    float age = clamp((progress - threshold) / 0.48, 0.0, 1.0);
                    float sparkle = pow(max(0.0, sin((elapsed * 7.0) + (ruido * 18.0))), 14.0);
                    float visibility = (1.0 - age) * step((age * 0.5) - 0.10, hash(celda + vec2(19.3, 7.1)));
                    finalColor = vec4(mix(base * 0.48, tint, 0.18 + (sparkle * 0.25)) * visibility, original.a * visibility);
                }`;

export class SplashFiltro extends Filter
{
    public uniforms: any;

    constructor(color: number, estilo: number)
    {
        super({
            gpuProgram: GpuProgram.from({ vertex: { source: VERTICE_GPU, entryPoint: 'mainVertex' }, fragment: { source: FRAGMENTO_GPU, entryPoint: 'mainFragment' } }),
            glProgram: GlProgram.from({ name: 'habb-splash', vertex: VERTICE_GL, fragment: FRAGMENTO_GL }),
            resources: {
                teleportUniforms: {
                    progress: { value: 1, type: 'f32' },
                    elapsed: { value: 0, type: 'f32' },
                    rebuilding: { value: 1, type: 'f32' },
                    style: { value: estilo, type: 'f32' },
                    tint: { value: new Float32Array([ ((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255 ]), type: 'vec3<f32>' }
                }
            }
        });

        this.uniforms = this.resources.teleportUniforms.uniforms;
    }

    /** f de 0 a 1 por la duración del shader; entrar = construirse */
    public avanzar(entrar: boolean, f: number, segundos: number): void
    {
        const e = (f * f * (3 - (2 * f)));

        this.uniforms.rebuilding = (entrar ? 1 : 0);
        this.uniforms.progress = (entrar ? (0.72 * (1 - e)) : e);
        this.uniforms.elapsed = segundos;
    }
}
