# atomic-text



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute | Description                  | Type                  | Default     |
| -------------------- | --------- | ---------------------------- | --------------------- | ----------- |
| `count`              | `count`   | Count value used for plurals | `number \| undefined` | `undefined` |
| `value` _(required)_ | `value`   | String key value             | `string`              | `undefined` |


## Dependencies

### Used by

 - [atomic-search-box](../atomic-search-box)

### Depends on

- [atomic-component-error](../atomic-component-error)

### Graph
```mermaid
graph TD;
  atomic-text --> atomic-component-error
  atomic-search-box --> atomic-text
  style atomic-text fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*