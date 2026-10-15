import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { SnowWarGameObjectData } from './SnowWarGameObjectData';
import { SnowWarGameStatusParser } from './SnowWarGameStatusParser';
import { SnowWarSubturnEventData } from './SnowWarSubturnEventData';

/**
 * Estado completo: segundos que quedan, todos los objetos y un GameStatus. Antes de empezar coloca los objetos; a media
 * partida el cliente salta a ese turno (resincronización tras un checksum distinto).
 */
export class SnowWarFullGameStatusParser implements IMessageParser
{
    private _totalSecondsLeft: number;
    private _objects: SnowWarGameObjectData[];
    private _turn: number;
    private _checksum: number;
    private _subturns: SnowWarSubturnEventData[][];

    public flush(): boolean
    {
        this._totalSecondsLeft = 0;
        this._objects = [];
        this._turn = -1;
        this._checksum = 0;
        this._subturns = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._totalSecondsLeft = wrapper.readInt();

        let total = wrapper.readInt();

        while(total-- > 0) this._objects.push(new SnowWarGameObjectData(wrapper));

        const status = SnowWarGameStatusParser.readStatus(wrapper);

        this._turn = status.turn;
        this._checksum = status.checksum;
        this._subturns = status.subturns;

        return true;
    }

    public get totalSecondsLeft(): number
    {
        return this._totalSecondsLeft;
    }

    public get objects(): SnowWarGameObjectData[]
    {
        return this._objects;
    }

    public get turn(): number
    {
        return this._turn;
    }

    public get checksum(): number
    {
        return this._checksum;
    }

    public get subturns(): SnowWarSubturnEventData[][]
    {
        return this._subturns;
    }
}
