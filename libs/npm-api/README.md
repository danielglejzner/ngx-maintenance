# @ngx-maintenance/npm-api

## Overview
@ngx-maintenance/npm-api is a strongly typed API SDK for the npm registry API, providing easy access to various endpoints and functionalities.

## Installation
To install @ngx-maintenance/npm-api, simply run:

```bash
npm install @ngx-maintenance/npm-api
```

## Usage
```typescript
import { fetchNpmApi, findCompatibleVersion } from '@ngx-maintenance/npm-api';

// Fetch registry information
const registryInfo = await fetchNpmApi('/');

// Find compatible version for a package
const compatibleVersion = await findCompatibleVersion('packageName', 'versionRange', 'peerDependency');
```

## Documentation
For detailed documentation and usage examples please use the docs and jsdocs.
