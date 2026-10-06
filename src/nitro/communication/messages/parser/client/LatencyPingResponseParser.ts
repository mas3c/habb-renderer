import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

export class LatencyPingResponseParser implements IMessageParser
{
    private _id: number;

    public flush(): boolean
    {
        this._id = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._id = wrapper.readInt();

        return true;
    }

    public get id(): number
    {
        return this._id;
    }
}
