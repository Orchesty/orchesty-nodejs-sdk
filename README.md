# NODE.JS Orchesty SDK

## How to use ?
- Install the package `@orchesty/nodejs-sdk`
- Import the package ``import { listen ,container , initiateContainer } from '@orchesty/nodejs-sdk';``
- First you will need to initiate the container by calling `initiateContainer();`
- Then start the server using listen `listen()`
- In between you will need to create node
  - Example: `const getOrderDetail = new getOrderDetail();`
- Finally, you will need to register the node into the DIContainer and you can do that by using this method
  - Example:  `container.setConnector(getOrderDetail)`

## How to develop
1. Run `make init` for start dev environment
1. Tests can be run by `make test` or `make fasttest`

## How to publish new package version
1. Be logged into npmjs.com
1. Increase version number in package.json
1. Run `make publish`
