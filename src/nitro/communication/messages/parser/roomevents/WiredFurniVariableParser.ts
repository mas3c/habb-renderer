import { IMessageDataWrapper, IMessageParser } from '../../../../../api';
import { VariableDefinition } from './VariableDefinition';

export class WiredFurniVariableParser implements IMessageParser
{
    private _definition: VariableDefinition;

    public flush(): boolean
    {
        this._definition = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._definition = new VariableDefinition(wrapper);

        return true;
    }

    public get definition(): VariableDefinition
    {
        return this._definition;
    }
}
