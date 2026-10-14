import { Filter } from '@pixi/core';

/**
 * El shader del Splash (el «TeleportDissolveFilter» de Hyris, en GLSL de WebGL 1 para Pixi 6): construye el
 * keko de abajo arriba (rebuilding 1, progress de 0,72 a 0) o lo deshace en celdas que se apagan con un brillo
 * del color del Splash (rebuilding 0, progress de 0 a 1). style elige por dónde empieza (0-3 los de solo shader,
 * 4-9 los de los Splash con partículas, en proporción al keko).
 */
const FRAGMENTO = `
precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp vec4 outputFrame;
uniform float progress;
uniform float elapsed;
uniform float rebuilding;
uniform float style;
uniform vec3 tint;

float hash(vec2 value) { return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123); }

void main(void)
{
    vec4 original = texture2D(uSampler, vTextureCoord);
    if(original.a <= 0.001) { gl_FragColor = original; return; }
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
    vec2 frameUv = vTextureCoord * inputSize.xy / outputFrame.zw;
    vec2 pix = frameUv * outputFrame.zw;
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
        // premultiplicado: lo que no se ve tampoco suma color
        float k = max(materialized, edge * 0.92);
        gl_FragColor = vec4(rgb * k, original.a * k);
        return;
    }
    if(progress <= threshold) { gl_FragColor = vec4(base, original.a); return; }
    float age = clamp((progress - threshold) / 0.48, 0.0, 1.0);
    float sparkle = pow(max(0.0, sin((elapsed * 7.0) + (ruido * 18.0))), 14.0);
    float visibility = (1.0 - age) * step((age * 0.5) - 0.10, hash(celda + vec2(19.3, 7.1)));
    gl_FragColor = vec4(mix(base * 0.48, tint, 0.18 + (sparkle * 0.25)) * visibility, original.a * visibility);
}`;

export class SplashFiltro extends Filter
{
    constructor(color: number, estilo: number)
    {
        super(undefined, FRAGMENTO, {
            progress: 1,
            elapsed: 0,
            rebuilding: 1,
            style: estilo,
            tint: new Float32Array([ ((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255 ])
        });
    }

    /** del todo invisible (esperando a que el keko tenga su ropa) */
    public ocultar(): void
    {
        this.uniforms.rebuilding = 1;
        this.uniforms.progress = 1;
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
