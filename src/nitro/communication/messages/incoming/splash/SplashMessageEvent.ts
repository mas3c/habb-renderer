import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { SplashMessageParser } from '../../parser/splash/SplashMessageParser';

export class SplashMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SplashMessageParser);
    }

    public getParser(): SplashMessageParser
    {
        return this.parser as SplashMessageParser;
    }
}
