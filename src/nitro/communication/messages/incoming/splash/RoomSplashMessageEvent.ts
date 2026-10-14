import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomSplashMessageParser } from '../../parser/splash/RoomSplashMessageParser';

export class RoomSplashMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomSplashMessageParser);
    }

    public getParser(): RoomSplashMessageParser
    {
        return this.parser as RoomSplashMessageParser;
    }
}
