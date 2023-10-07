import * as cheerio from "cheerio";
import axios from "axios";
import { CompareResult, isNotNil, takeN } from "./common";



export type Provider = Readonly<{

  businessName: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  pointOfContact: string,
  telephone: string,
  serviceType: string,
}>;

export module Provider {
  export function isKeyof(key: string): key is keyof Provider {
    switch (key) {
      case "businessName":
      case "address":
      case "city":
      case "state":
      case "zip":
      case "pointOfContact":
      case "telephone":
      case "serviceType": {
        return true;
      }
      default: {
        return false;
      }
    }
  }

  export function compareByField(a: Provider, b: Provider, info: ProviderSortInfo): CompareResult {

    const propValA = a[info.column];
    const propValB = b[info.column];

    const comp = propValA.localeCompare(propValB) as CompareResult;
    switch (info.direction) {
      case "asc": {
        return comp;
      }
      case "desc": {
        return -comp as CompareResult;
      }
    }

  }
}

export interface ProviderLookupInfo {
  zip: string,

  providers: Provider[],
}


export async function lookupByZipcode(zip: string): Promise<LookupResult> {
  const providers: Provider[] = await parseLookupPages(zip);

  const info: ProviderLookupInfo = {
    zip,
    providers
  }
  return new LookupResult(info);

}

export interface ProviderSortInfo {
  column: keyof Provider,
  direction: "asc" | "desc",
}

export module ProviderSortInfo {

  export const SORT_MAX: number = 2;


  function _fromColumn(column: string | keyof Provider, direction: ProviderSortInfo["direction"] = "desc"): ProviderSortInfo | null {

    if (Provider.isKeyof(column)) {
      return {
        column,
        direction
      };
    } else if (column.match(/[+]/)) {
      return _fromColumn(column.replace("+", ""), "asc");

    } else {
      return null;
    }
  }

  export function fromColumn(column: string | keyof Provider): ProviderSortInfo | null {
    return _fromColumn(column);
  }

}

export class LookupResult {
  constructor(private info: ProviderLookupInfo) { }

  public sort(sortinfo: ProviderSortInfo[]): void {
    if (sortinfo.length === 0) return;

    const [sortA, sortB] = sortinfo;
    const sorter = (() => {
      if (isNotNil(sortA) && isNotNil(sortB)) {

        return (a: Provider, b: Provider) => {

          const sortValA = Provider.compareByField(a, b, sortA);
          const sortValB = Provider.compareByField(a, b, sortB);

          return sortValA || sortValB;


        };
      } else if (isNotNil(sortA)) {
        return (a: Provider, b: Provider) => {
          return Provider.compareByField(a, b, sortA);
        }
      } else {
        return null;
      }
    })();

    if (isNotNil(sorter)) {
      this.info.providers.sort(sorter);
    }

  }

  public providers(): Provider[] {
    return this.info.providers;
  }
}



async function parseLookupPages(zip: string): Promise<Provider[]> | never {

  const providers: Provider[] = [];
  let pageNum = 0;

  while (true) {

    try {

      const lookupPage = await getLookupPage(zip, pageNum);
      const ps = parseProviders(lookupPage);

      if (ps.length === 0) {

        // Parse didnt return any providers, so we must be done 
        // paging through all providers

        return providers;
      }
      providers.push(...ps);
      pageNum++;
    }
    catch (err) {
      console.error(err);
      return providers;
    }
  }
}

// default state = 6 for California.
async function getLookupPage(zip: string, page: number = 0, state: number = 6): Promise<string> {
  const url = `https://www.irs.gov/efile-index-taxpayer-search?zip=${zip}&state=${state}&page=${page}`;
  console.log("Fetching page => ", url);

  const body = await axios.get(url);

  return body.data;

}

function parseProviders(lookupPage: string): Provider[] {

  const $ = cheerio.load(lookupPage);

  const providers: Provider[] = [];


  const cells = $("table .views-field.views-align-left").map(function(_, __) {
    return $(this).text();
  }).toArray();



  if (cells.length > 0) {

    /* *
     * 
     * We could search through row.values[0].innerText, to try and find the 
     * index that corresponds to the value in row.values[1]. Seeing as this page probably doesnt change much,
     * I think we are safe to hard-code the values[index] access.
     *
     * - row.values[0] --   -- index --  --- property ---
     *
     * Name of Business  :: values[0] => Provider.businessName
     * Address           :: values[1] => Provider.address 
     * City/State/ZIP:   :: values[2] => Provider.city, Provider.state, Provider.zip
     * Point of Contact: :: values[3] => Provider.pointOfContact
     * Telephone:        :: values[4] => Provider.telephone
     * Type of Service:  :: values[5] => Provider.serviceType  
     * 
     * */

    for (const c of cells) {
      const values = c.split("\n")

      const { city, state, zip } = splitLocationString(values[2]);

      const p: Provider = {
        businessName: values[0],
        address: values[1],
        city,
        state,
        zip,
        pointOfContact: values[3],
        telephone: values[4],
        serviceType: values[5],
      }
      providers.push(p);
    }
  }

  return providers;
}


interface LocationInfo {
  city: string,
  state: string,
  zip: string,
}

function splitLocationString(location: string): LocationInfo {
  const [city, state, zip] = location.split(" ").map(l => l.replace(",", ""));
  return {
    city, state, zip
  }
} 
