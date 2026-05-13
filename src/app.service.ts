import { Injectable } from '@nestjs/common';
import { DOCS_HTML } from './docs.html';

@Injectable()
export class AppService {
  getDocs(): string {
    return DOCS_HTML;
  }
}
