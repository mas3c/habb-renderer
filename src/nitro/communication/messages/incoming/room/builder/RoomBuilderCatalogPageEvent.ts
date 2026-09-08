import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { RoomBuilderCatalogPageParser } from '../../../parser';

export class RoomBuilderCatalogPageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomBuilderCatalogPageParser);
    }

    public getParser(): RoomBuilderCatalogPageParser
    {
        return this.parser as RoomBuilderCatalogPageParser;
    }
}
