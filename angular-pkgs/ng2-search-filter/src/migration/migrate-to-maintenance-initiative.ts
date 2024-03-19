/* eslint-disable @typescript-eslint/no-unused-vars */
import { Tree } from '@nx/devkit';
import { toMaintenanceInitiative } from '@ngx-maintenance/devkit'

export default function update(tree: Tree) {
  toMaintenanceInitiative(tree, 'ng2-search-filter');
}
