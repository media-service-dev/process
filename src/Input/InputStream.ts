/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import { Readable, ReadableOptions } from "stream";

export class InputStream extends Readable {

    protected contents: Buffer;

    public constructor(data: string, options?: ReadableOptions) {
        super(options);
        this.contents = Buffer.from(data);
    }

    public _read(size: number) {
        if (!this.contents.length) {
            this.push(null);
        } else {
            const result = this.contents.slice(0, size);
            this.contents = this.contents.slice(size);
            this.push(result);
        }
    }

}
