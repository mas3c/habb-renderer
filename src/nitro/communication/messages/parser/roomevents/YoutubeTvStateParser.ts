import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

export interface YoutubeTvVideo
{
    videoId: string;
    title: string;
    duration: number;
}

export interface YoutubeTvViewer
{
    id: number;
    name: string;
    figure: string;
}

/** Estado completo de la TV de la sala: llega entero en cada cambio. */
export class YoutubeTvStateParser implements IMessageParser
{
    private _active: boolean;
    private _index: number;
    private _second: number;
    private _paused: boolean;
    private _queue: YoutubeTvVideo[];
    private _viewers: YoutubeTvViewer[];

    public flush(): boolean
    {
        this._active = false;
        this._index = 0;
        this._second = 0;
        this._paused = false;
        this._queue = [];
        this._viewers = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._active = wrapper.readBoolean();
        this._index = wrapper.readInt();
        this._second = wrapper.readInt();
        this._paused = wrapper.readBoolean();

        this._queue = [];

        let total = wrapper.readInt();

        while(total > 0)
        {
            this._queue.push({
                videoId: wrapper.readString(),
                title: wrapper.readString(),
                duration: wrapper.readInt()
            });

            total--;
        }

        this._viewers = [];

        let viewers = wrapper.readInt();

        while(viewers > 0)
        {
            this._viewers.push({
                id: wrapper.readInt(),
                name: wrapper.readString(),
                figure: wrapper.readString()
            });

            viewers--;
        }

        return true;
    }

    public get active(): boolean { return this._active; }
    public get index(): number { return this._index; }
    public get second(): number { return this._second; }
    public get paused(): boolean { return this._paused; }
    public get queue(): YoutubeTvVideo[] { return this._queue; }
    public get viewers(): YoutubeTvViewer[] { return this._viewers; }
}
