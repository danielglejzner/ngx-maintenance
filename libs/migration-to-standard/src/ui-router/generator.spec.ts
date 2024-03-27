import { Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import migrateToAngularRouter from './generator';
import { GeneratorSchema } from './schema';

// Thank you to ngxtension for helping with setup https://github.com/nartc/ngxtension-platform/blob/main/libs/plugin/src/generators/convert-signal-inputs/generator.spec.ts
const template = `
  <div #dialogdiv></div>
    <div class="navheader">
      <ul *ngIf="isAuthenticated" class="nav nav-tabs">

        <li uiSrefActive="active"> <a uiSref="mymessages" role="button"> Messages </a> </li>
        <li uiSrefActive="active"> <a uiSref="contacts" role="button"> Contacts </a> </li>
        <li uiSrefActive="active"> <a uiSref="prefs" role="button"> Preferences </a> </li>

        <li class="navbar-right">
          <button class="btn btn-primary fa fa-home" uiSref="home"></button>
          <button style="margin-right: 15px;" class="btn btn-primary" uiSref="mymessages.compose">
            <i class="fa fa-envelope"></i> New Message
          </button>
        </li>

        <li class="navbar-text navbar-right logged-in-user" style="margin: 0.5em 1.5em;">
          <div>
            {{emailAddress}} <i class="fa fa-chevron-down"></i>
            <div class="hoverdrop">
              <button class="btn btn-primary" (click)="logout()">Log Out</button>
            </div>
          </div>
        </li>

      </ul>
    </div>

    <div ui-view></div>
`

const filesMap = {
  componentWithInline: `
  import { Component, ViewChild, ViewContainerRef, OnInit } from '@angular/core';
import { DialogService } from './global/dialog.service';
import { StateService } from '@uirouter/core';
import { AuthService } from './global/auth.service';
import { AppConfigService } from './global/app-config.service';

    @Component({
  selector: 'app-root',
  template: \`${template}\`
  ,
  styles: []
})
export class AppComponent implements OnInit {
  @ViewChild('dialogdiv', { read: ViewContainerRef, static: true }) dialogdiv;

  // data
  emailAddress;
  isAuthenticated;

  constructor(appConfig: AppConfigService,
              public authService: AuthService,
              public $state: StateService,
              private dialog: DialogService
  ) {
    this.emailAddress = appConfig.emailAddress;
    this.isAuthenticated = authService.isAuthenticated();
  }

  ngOnInit() {
    this.dialog.vcRef = this.dialogdiv;
  }

  show() {
    this.dialog.confirm('foo');
  }

  logout() {
    const { authService, $state } = this;
    authService.logout();
    // Reload states after authentication change
    return $state.go('welcome', {}, { reload: true });
  }
}
  `,
  componentWithTemplateUrl: `
    import { Component, ViewChild, ViewContainerRef, OnInit } from '@angular/core';
import { DialogService } from './global/dialog.service';
import { StateService } from '@uirouter/core';
import { AuthService } from './global/auth.service';
import { AppConfigService } from './global/app-config.service';
    @Component({
  selector: 'app-root',
  templateUrl: './my-file.html'
  ,
  styles: []
})
export class AppComponent implements OnInit {
  @ViewChild('dialogdiv', { read: ViewContainerRef, static: true }) dialogdiv;

  // data
  emailAddress;
  isAuthenticated;

  constructor(appConfig: AppConfigService,
              public authService: AuthService,
              public $state: StateService,
              private dialog: DialogService
  ) {
    this.emailAddress = appConfig.emailAddress;
    this.isAuthenticated = authService.isAuthenticated();
  }

  ngOnInit() {
    this.dialog.vcRef = this.dialogdiv;
  }

  show() {
    this.dialog.confirm('foo');
  }

  logout() {
    const { authService, $state } = this;
    authService.logout();
    // Reload states after authentication change
    return $state.go('welcome', {}, { reload: true });
  }
}
  `
} as const;

describe('migrateToAngularRouter', () => {
  let tree: Tree;


  function setup(file: keyof typeof filesMap) {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    addProjectConfiguration(tree, 'my-angular-app', {
      root: `my-angular-app`,
      sourceRoot: `my-angular-app/src`,
      targets: {
      },
    });

    tree.write('package.json', `{"dependencies": {"@uirouter/angular": "13.0.0"}}`);
    tree.write(`my-angular-app/my-file.ts`, filesMap[file]);

    if (file === 'componentWithTemplateUrl') {
      tree.write(`my-angular-app/my-file.html`, template);
      return () => {
        return [
          tree.read('my-angular-app/my-file.ts', 'utf8'),
          filesMap[file],
          tree.read('my-angular-app/my-file.html', 'utf8'),
          template,
        ];
      };
    }

    return () => {
      return [tree.read('my-angular-app/my-file.ts', 'utf8'), filesMap[file]];
    };
  }

  it('should show convert with templateURL', async () => {
    const readContent = setup('componentWithTemplateUrl');
    await migrateToAngularRouter(tree, {});
    const [updated, updatedHtml] = readContent();
    expect(updated).toMatchSnapshot();
    expect(updatedHtml).toMatchSnapshot();
  });

  it('should convert with inline html', async () => {
    const readContent = setup('componentWithInline');
    await migrateToAngularRouter(tree, {});
    const [updated] = readContent();
    expect(updated).toMatchSnapshot();
  });

});