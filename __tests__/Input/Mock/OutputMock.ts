/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2021 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import { Writable, WritableOptions } from "stream";

export class OutputMock extends Writable {

    protected contents = Buffer.from("");

    public constructor(options?: WritableOptions) {
        super(options);
    }

    public _write(chunk: Buffer, encoding: string, callback: () => void) {
        this.contents = Buffer.concat([this.contents, chunk]);
        callback();
    }

    public toString(): string {
        return this.contents.toString();
    }

}
