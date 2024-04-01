**NOTICE: This package is now maintained under the Angular Compatibility Maintenance Initiative**

This package has been included in the Angular Compatibility Maintenance Initiative to ensure it remains compatible with the latest versions of Angular, despite not receiving active feature development or bug fixes. This initiative is a community-driven effort to maintain libraries that are critical for Angular projects but are no longer actively developed.

**Important Considerations:**
- **Maintenance Scope**: Updates will focus solely on Angular version compatibility. No new features will be added, and existing bugs will not be addressed outside of compatibility concerns.
- **Temporary Solution**: This maintenance effort is intended as a temporary measure. Users are strongly encouraged to plan for the migration to actively supported alternatives as they become available.
- **Contribution**: If you are interested in contributing to the maintenance of this package or others within the initiative.

By using this package, you acknowledge the limitations of its maintenance under the Angular Compatibility Maintenance Initiative and the recommendation to seek more permanent solutions.

**Package Name:** [@ngx-maintenance/ng2-search-filter](https://npmjs.com/package/@ngx-maintenance/ng2-search-filte)

---
# Original Readme (adjusted for repo):
# Angular 2 / Angular 4 / Angular 5 Search Filter Pipe

[![npm version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://www.npmjs.com/package/@ngx-maintenance/ng2-search-filter) [![](https://david-dm.org/solodynamo/@ngx-maintenance/ng2-search-filter.svg)](https://www.npmjs.com/package/@ngx-maintenance/ng2-search-filter)
[![](https://img.shields.io/badge/downloads-24K%2B-red.svg)](https://www.npmjs.com/package/@ngx-maintenance/ng2-search-filter)

> Filter search items

Angular 2 filter to make custom search. Works with Angular 4 and Angular 5 too.

![demo-image](http://i.imgur.com/dI5Mzvq.gif)



## Install

```
npm i @ngx-maintenance/ng2-search-filter --save
```
```
yarn add @ngx-maintenance/ng2-search-filter
```
## Usage

In case you're using `systemjs` - see configuration [here](https://github.com/solodynamo/@ngx-maintenance/ng2-search-filter/blob/master/SYSTEMJS.md).

Import `Ng2SearchPipeModule` to your module

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { AppComponent } from './app';

import { Ng2SearchPipeModule } from '@ngx-maintenance/ng2-search-filter';

@NgModule({
  imports: [BrowserModule, Ng2SearchPipeModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

And use pipe in your component after declaring and initializing it in your component:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'example-app',
  template: `
    <div>
        <input type="text" [(ngModel)]="term">
        <div *ngFor = "let item of items |filter:term" >
          <p>
            {{item.name}}
          </p>
        </div>

    </div>
  `
})

export class AppComponent {
  items: string[] = [{ name: "archie" }, { name: "jake" }, { name: "richard" }];
  term = '';
}
```

## Support @ngx-maintenance/ng2-search-filter

@ngx-maintenance/ng2-search-filter is completely free and open-source. If you find it useful, you can show your support by 🌟 it or sharing it in your social network.

## Contribute

Please do 🙂

## License

[MIT](https://tldrlegal.com/license/mit-license) © [Solodynamo](https://github.com/solodynamo/@ngx-maintenance/ng2-search-filter)
