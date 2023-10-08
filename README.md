# irs-efile-provider-lookup

Uses IRS site to query data about irs efile providers given an area code in California.


```bash
git clone https://github.com/MatthewMcDade13/irs-efile-provider-lookup.git
```

```bash
cd efile-index-taxpayer-search
npm install
```

### Example

- passing --zip is mandatory.
- default sorting is DESC, to sort by ASC, include a '+' in front of field name.
- if no output flag is given, writes output to console (stdio)


```bash
npm run main -- [-z --zip] <ZIPCODE> [-o --out] <FILEPATH> [-s --sort] <SORT_COLUMNS...>
npm run main -- --zip 93030 -o "out.json" --sort +businessName telephone 

```

### Possible inputs for --sort option
- use fields of Provider interface, given below
- indexes directly into Provider interface:


```typescript
interface Provider {
  businessName: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  pointOfContact: string,
  telephone: string,
  serviceType: string,
}
```
