import { Component } from '@angular/core';
import { TuiLoader } from '@taiga-ui/core';

@Component({
	selector: 'app-loader',
	imports: [TuiLoader],
	templateUrl: './loader.component.html',
	styleUrl: './loader.component.less',
})
export class LoaderComponent {}
