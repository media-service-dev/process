/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import { Writable, WritableOptions } from "stream";

export class OutputStream extends Writable {

    protected contents = Buffer.from("");

    protected closed: boolean = false;

    public constructor(options?: WritableOptions) {
        super(options);
    }

    public _write(chunk: Buffer, encoding: string, callback: () => void) {
        if (!this.closed) {
            this.contents = Buffer.concat([this.contents, chunk]);
            this.emit("data", chunk);
        }
        callback();
    }

    public toBuffer() {
        return Buffer.from(this.contents);
    }

    public toString(): string {
        return this.contents.toString();
    }

    public isClosed(): boolean {
        return this.closed;
    }

    public close(): this {
        this.closed = true;
        this.emit("close");
        this.emit("finish");

        return this;
    }

}
