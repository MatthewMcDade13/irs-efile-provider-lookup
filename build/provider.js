"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupResult = exports.ProviderSortInfo = exports.lookupByZipcode = exports.Provider = void 0;
const cheerio = __importStar(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const common_1 = require("./common");
var Provider;
(function (Provider) {
    function isKeyof(key) {
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
    Provider.isKeyof = isKeyof;
    function compareByField(a, b, info) {
        const propValA = a[info.column];
        const propValB = b[info.column];
        const comp = propValA.localeCompare(propValB);
        switch (info.direction) {
            case "asc": {
                return comp;
            }
            case "desc": {
                return -comp;
            }
        }
    }
    Provider.compareByField = compareByField;
})(Provider || (exports.Provider = Provider = {}));
async function lookupByZipcode(zip) {
    const providers = await parseLookupPages(zip);
    const info = {
        zip,
        providers
    };
    return new LookupResult(info);
}
exports.lookupByZipcode = lookupByZipcode;
var ProviderSortInfo;
(function (ProviderSortInfo) {
    ProviderSortInfo.SORT_MAX = 2;
    function _fromColumn(column, direction = "desc") {
        if (Provider.isKeyof(column)) {
            return {
                column,
                direction
            };
        }
        else if (column.match(/[+]/)) {
            return _fromColumn(column.replace("+", ""), "asc");
        }
        else {
            return null;
        }
    }
    function fromColumn(column) {
        return _fromColumn(column);
    }
    ProviderSortInfo.fromColumn = fromColumn;
})(ProviderSortInfo || (exports.ProviderSortInfo = ProviderSortInfo = {}));
class LookupResult {
    info;
    constructor(info) {
        this.info = info;
    }
    sort(sortinfo) {
        if (sortinfo.length === 0)
            return;
        const [sortA, sortB] = sortinfo;
        const sorter = (() => {
            if ((0, common_1.isNotNil)(sortA) && (0, common_1.isNotNil)(sortB)) {
                return (a, b) => {
                    const sortValA = Provider.compareByField(a, b, sortA);
                    const sortValB = Provider.compareByField(a, b, sortB);
                    return sortValA || sortValB;
                };
            }
            else if ((0, common_1.isNotNil)(sortA)) {
                return (a, b) => {
                    return Provider.compareByField(a, b, sortA);
                };
            }
            else {
                return null;
            }
        })();
        if ((0, common_1.isNotNil)(sorter)) {
            this.info.providers.sort(sorter);
        }
    }
    providers() {
        return this.info.providers;
    }
}
exports.LookupResult = LookupResult;
async function parseLookupPages(zip) {
    const providers = [];
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
async function getLookupPage(zip, page = 0, state = 6) {
    const url = `https://www.irs.gov/efile-index-taxpayer-search?zip=${zip}&state=${state}&page=${page}`;
    console.log("Fetching page => ", url);
    const body = await axios_1.default.get(url);
    return body.data;
}
function parseProviders(lookupPage) {
    const $ = cheerio.load(lookupPage);
    const providers = [];
    const cells = $("table .views-field.views-align-left").map(function (_, __) {
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
            const values = c.split("\n");
            const { city, state, zip } = splitLocationString(values[2]);
            const p = {
                businessName: values[0],
                address: values[1],
                city,
                state,
                zip,
                pointOfContact: values[3],
                telephone: values[4],
                serviceType: values[5],
            };
            providers.push(p);
        }
    }
    return providers;
}
function splitLocationString(location) {
    const [city, state, zip] = location.split(" ").map(l => l.replace(",", ""));
    return {
        city, state, zip
    };
}
