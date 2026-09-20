export interface IAvatarFigureContainer
{
    getPartTypeIds(_arg_1?: string): IterableIterator<string>;
    getPartType(_arg_1: string): string;
    hasPartType(_arg_1: string): boolean;
    getPartSetId(_arg_1: string): number;
    getPartColorIds(_arg_1: string): number[];
    updatePart(_arg_1: string, _arg_2: number, _arg_3: number[]): void;
    addPart(_arg_1: string, _arg_2: number, _arg_3: number[]): string;
    removePart(_arg_1: string): void;
    getFigureString(): string;
}
