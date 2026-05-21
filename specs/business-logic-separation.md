# Business Logic Separation

The data usage file is a CSV with the following structure per row.

```
Date,Application,Subsystem,Severity,Priority,Policy name/Parsing rule,type,GB sent
```

The UI should work with a processed version of that file that works as a cache.
- It is an array of elements following the structure described below
- It does not contain "Policy name/Parsing rule" or "type" to simplify things

Array element structure:
```
{
    date: ...,
    application: ...,
    subsystem: ...,
    severity: ...,
    priority: ...,
    amountGbSent: ...,
    billingUnits: ...
}
```

The billing units are calculated as the multiplication of the GB sent and the TCO Priority billing weight.