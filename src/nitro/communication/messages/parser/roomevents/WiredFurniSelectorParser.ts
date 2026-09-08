import { IMessageDataWrapper, IMessageParser } from '../../../../../api';
import { SelectorDefinition } from './SelectorDefinition';

export class WiredFurniSelectorParser implements IMessageParser
{
    private _definition: SelectorDefinition;

    public flush(): boolean
    {
        this._definition = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._definition = new SelectorDefinition(wrapper);

        return true;
    }

    public get definition(): SelectorDefinition
    {
        return this._definition;
    }
}
