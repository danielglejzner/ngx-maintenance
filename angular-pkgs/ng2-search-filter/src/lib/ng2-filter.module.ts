import { NgModule } from '@angular/core';
import { Ng2SearchPipe } from './ng2-filter.pipe';

@NgModule({
  imports: [Ng2SearchPipe],
  exports: [Ng2SearchPipe]
})

export class Ng2SearchPipeModule { }
