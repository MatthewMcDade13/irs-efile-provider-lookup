import { Command, CommandOptions, program } from "commander";
import { LookupResult, Provider, ProviderSortInfo, lookupByZipcode } from "./provider";
import { isNotNil, takeN } from "./common";
import fs from "fs";

function main(zip: string, sort: string[], outFile?: string) {

  getProviders(zip, sort).then(res => {
    if (isNotNil(outFile)) {
      const data = JSON.stringify(res.providers(), null, 4);
      fs.writeFile(outFile, data, (err) => {
        if (isNotNil(err)) {
          console.error("Error writing to file: ", outFile, " => ", err);
        } else {
          console.log(`Successfully wrote ${res.providers().length} entries to file: ${outFile}`);
        }
      });
    } else {
      console.log(`COUNT: ${res.providers().length} => ${res.providers()}`);
    }
  });

}

async function getProviders(zip: string, sort: string[]): Promise<LookupResult> {

  const result = await lookupByZipcode(zip)

  const sortInfos = takeN(sort, ProviderSortInfo.SORT_MAX)
    .map(c => ProviderSortInfo.fromColumn(c))
    // we filter out Non-null members here, tsc cant see that so we cast
    // since we know forsure there are no nulls in sortInfos
    .filter(c => isNotNil(c)) as NonNullable<ProviderSortInfo[]>;

  result.sort(sortInfos);
  return result;

}

program
  .requiredOption("-z, --zip <number>", "Zip code is required")
  .option("-s, --sort [columns...]", "Specify up to 2 columns to sort on, columns after 2 are ignored")
  .option("-o --out [filename]", "Specify output file to write to")
  .parse();

const { zip, sort, out } = program.opts();

main(zip, sort, out);



