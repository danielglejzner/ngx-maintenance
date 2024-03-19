import { Pipe, PipeTransform } from '@angular/core';
import { isString } from '../helpers/helpers';

@Pipe({
  name: 'wrap',
  standalone: true,
})
export class WrapPipe implements PipeTransform {
  transform(str: string | null | undefined, prefix: string = '', suffix: string = '') {
    if (!isString(str)) {
      return str;
    }

    return (!!prefix && isString(prefix) ? prefix : '') + str + (!!suffix && isString(suffix) ? suffix : '');
  }
}
