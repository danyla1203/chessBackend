import { Request } from './ExtendContext';
import * as Busboy from 'busboy';
import * as path from 'path';
import * as fs from 'fs';

export class PostBody {
  private async handleMultipart(req: Request) {
    const busboy = Busboy({ headers: req.headers });
    const body: any = {};

    return new Promise((resolve) => {
      busboy.on('file', function (fieldName: string, file, fileName: string) {
        body[fieldName] = { fileName };
        if (fileName.length < 2) {
          req.body = body;
          resolve('');
          return;
        }
        const saveTo = path.join('uploaded_img', path.basename(fileName));
        fs.writeFile(saveTo, '', (err) => {
          if (err) throw err;
          file.pipe(fs.createWriteStream(saveTo));
        });
      });
      busboy.on('field', function (fieldName, val) {
        body[fieldName] = { val };
      });
      busboy.on('finish', function () {
        req.body = body;
        resolve('');
      });
      req.pipe(busboy);
    });
  }

  private async handleUrlencoded(req: Request) {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        req.body = new Map();
        data.split('&').map((keyValue) => {
          let keyValArr = keyValue.split('=');
          req.body[keyValArr[0]] = keyValArr[1];
        });
        resolve('');
      });
    });
  }

  public async handle(req: Request): Promise<void> {
    if (req.method != 'POST' && req.method != 'PUT') {
      return;
    }
    const contentType = req.headers['content-type'];
    if (!contentType) {
      return null;
    }

    switch (contentType.split(';')[0]) {
    case 'multipart/form-data':
      await this.handleMultipart(req);
      break;
    case 'application/x-www-form-urlencoded':
      await this.handleUrlencoded(req);
      break;
    }
  }
}