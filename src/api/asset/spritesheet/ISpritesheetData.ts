import { SpritesheetData as PixiSpritesheet } from 'pixi.js';
import { ISpritesheetMeta } from './ISpritesheetMeta';

export interface ISpritesheetData extends PixiSpritesheet
{
    meta: ISpritesheetMeta;
}
