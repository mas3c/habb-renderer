import { IMessageComposer } from '../../../../../api';

/** LatencyPingReport de Habbo: media de la latencia, media sin picos y cuántas medidas. */
export class LatencyPingReportMessageComposer implements IMessageComposer<ConstructorParameters<typeof LatencyPingReportMessageComposer>>
{
    private _data: ConstructorParameters<typeof LatencyPingReportMessageComposer>;

    constructor(average: number, validAverage: number, count: number)
    {
        this._data = [ average, validAverage, count ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
