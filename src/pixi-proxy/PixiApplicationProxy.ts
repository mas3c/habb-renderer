import { Application } from 'pixi.js';

export class PixiApplicationProxy extends Application
{
    private static INSTANCE: Application = null;

    constructor()
    {
        super();

        if(!PixiApplicationProxy.INSTANCE) PixiApplicationProxy.INSTANCE = this;
    }

    public static get instance(): Application
    {
        return this.INSTANCE || null;
    }
}
