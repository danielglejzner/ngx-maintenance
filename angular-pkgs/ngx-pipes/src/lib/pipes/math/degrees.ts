import { Pipe, PipeTransform } from '@angular/core';
import { isNumberFinite } from '../helpers/helpers';

@Pipe({
  name: 'degrees',
  standalone: true,
})
export class DegreesPipe implements PipeTransform {
  transform(radians: number | null | undefined): number {
    if (!isNumberFinite(radians)) {
      return NaN;
    }

    return (radians * 180) / Math.PI;
  }
}
