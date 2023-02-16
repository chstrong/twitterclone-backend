function sum(a: number, b: number) {
    console.log(`The result is: ${a + b}`);
    return a + b;
}

sum(20, 30);

/*
import * as fs from 'fs';

const VtlReplace = (filepath:string, attributes:Map<string,string>): string => {
    const mappingTemplate = fs.readFileSync(filepath, 'utf-8');
    var str = mappingTemplate.toString();

    attributes.forEach((value:string, key:string) => {
        str = str.replace(key, value)
    });

    return str;
}

export default VtlReplace;
*/

console.log("hello")