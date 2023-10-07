"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const provider_1 = require("./provider");
const common_1 = require("./common");
const fs_1 = __importDefault(require("fs"));
function main(zip, sort, outFile) {
    getProviders(zip, sort).then(res => {
        if ((0, common_1.isNotNil)(outFile)) {
            const data = JSON.stringify(res.providers(), null, 4);
            fs_1.default.writeFile(outFile, data, (err) => {
                if ((0, common_1.isNotNil)(err)) {
                    console.error("Error writing to file: ", outFile, " => ", err);
                }
                else {
                    console.log(`Successfully wrote ${res.providers().length} entries to file: ${outFile}`);
                }
            });
        }
        else {
            console.log(`COUNT: ${res.providers().length} => ${res.providers()}`);
        }
    });
}
async function getProviders(zip, sort) {
    const result = await (0, provider_1.lookupByZipcode)(zip);
    const sortInfos = (0, common_1.takeN)(sort, provider_1.ProviderSortInfo.SORT_MAX)
        .map(c => provider_1.ProviderSortInfo.fromColumn(c))
        // we filter out Non-null members here, tsc cant see that so we cast
        // since we know forsure there are no nulls in sortInfos
        .filter(c => (0, common_1.isNotNil)(c));
    result.sort(sortInfos);
    return result;
}
commander_1.program
    .requiredOption("-z, --zip <number>", "Zip code is required")
    .option("-s, --sort [columns...]", "Specify up to 2 columns to sort on, columns after 2 are ignored")
    .option("-o --out [filename]", "Specify output file to write to")
    .parse();
const { zip, sort, out } = commander_1.program.opts();
main(zip, sort, out);
