import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class RoomBuilderCatalogPageParser implements IMessageParser
{
    private _pageId: number = -1;

    public flush(): boolean { this._pageId = -1; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._pageId = wrapper.readInt();
        return true;
    }

    public get pageId(): number { return this._pageId; }
}
