import { NitroBlendMode } from '../../pixi-proxy';

export class SpriteUtilities
{
    public static hex2int(hex: string): number
    {
        return parseInt(hex, 16);
    }

    public static inkToBlendMode(ink: string | number): number
    {
        if(ink == 'ADD' || ink == 33) return NitroBlendMode.ADD;

        if(ink == 'SUBTRACT') return NitroBlendMode.SUBTRACT;

        if(ink == 'DARKEN') return NitroBlendMode.DARKEN;

        return NitroBlendMode.NORMAL;
    }
}
