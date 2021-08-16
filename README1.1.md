# NODE.JS Orchesty SDK

### How to use ?

- Install the package `npm i pipes-nodejs-sdk`
- Import the package ``import { listen ,container , initiateContainer } from 'pipes-nodejs-sdk';``
- First you will need to initiate the container by calling `initiateContainer();`
- Then start the server using listen `listen()`
- In between you will need to create nodes Example
```
const getOrderDetail = new getOrderDetail();
container.setConnector(getOrderDetail);
```
- Finally you will need to register the node into into the DIContainer and you can do that by using this method `container.setConnector(<Instance of the node>)`

### Template for creating a node :
```
import ProcessDto from 'pipes-nodejs-sdk/dist/lib/Utils/ProcessDto';
import AConnector from 'pipes-nodejs-sdk/dist/lib/Connector/AConnector';
```

``` 
export default class getOrderDetail extends AConnector {
```
as you can see you the node must be an instance of
`AConnector` or `ACommonNode` Basically `Aconnector` is a `ACommonNode` in it's core but it have one more piece of functinality
`setSender` by sender we mean curl sender.
``` 
public getName = (): string => 'shopify-get-order-detail';
```

Fianlly you will need to set the name of the node and in the endpoints section you shell know how to use the name.

  ```
  public async processAction(_dto: ProcessDto): Promise{
    // return response promise;
  }
}
```

### Testing :

To be added ...


