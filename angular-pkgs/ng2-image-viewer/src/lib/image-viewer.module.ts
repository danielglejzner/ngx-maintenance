import { ModuleWithProviders, NgModule } from '@angular/core';
import { ImageViewerComponent } from './image-viewer.component';

export * from './image-viewer.component'

@NgModule({
	imports: [
		ImageViewerComponent
	],
	exports: [
		ImageViewerComponent,
	]
})
export class ImageViewerModule {
	static forRoot(): ModuleWithProviders<ImageViewerModule> {
		return {
			ngModule: ImageViewerModule,
		};
	}
}