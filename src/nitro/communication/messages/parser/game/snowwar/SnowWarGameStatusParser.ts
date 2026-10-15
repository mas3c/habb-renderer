import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { SnowWarSubturnEventData } from './SnowWarSubturnEventData';

/** AIR GameStatus: el checksum del turno simulado y las órdenes de los 3 subturnos del turno siguiente. */
export class SnowWarGameStatusParser implements IMessageParser
{
    private _turn: number;
    private _checksum: number;
    private _subturns: SnowWarSubturnEventData[][];

    public flush(): boolean
    {
        this._turn = -1;
        this._checksum = 0;
        this._subturns = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const status = SnowWarGameStatusParser.readStatus(wrapper);

        this._turn = status.turn;
        this._checksum = status.checksum;
        this._subturns = status.subturns;

        return true;
    }

    /** turno, checksum y subturnos con sus eventos (también va dentro del estado completo). */
    public static readStatus(wrapper: IMessageDataWrapper): { turn: number, checksum: number, subturns: SnowWarSubturnEventData[][] }
    {
        const turn = wrapper.readInt();
        const checksum = wrapper.readInt();
        const subturns: SnowWarSubturnEventData[][] = [];
        let total = wrapper.readInt();

        while(total-- > 0)
        {
            const events: SnowWarSubturnEventData[] = [];
            let count = wrapper.readInt();

            while(count-- > 0) events.push(new SnowWarSubturnEventData(wrapper));

            subturns.push(events);
        }

        return { turn, checksum, subturns };
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
