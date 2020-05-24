/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import { InputStream } from "../../src/Input/InputStream";
import { OutputStream } from "../../src/Output/OutputStream";

describe("OutputStream", () => {

    describe("stream", () => {

        it("should be writable", async () => {
            // Arrange
            const output = new OutputStream();
            const input = new InputStream("foo");

            // Act
            input.pipe(output);

            // Assert
            await (new Promise((resolve) => {
                output.on("finish", () => {
                    expect(output.toString()).toEqual("foo");
                    expect(output.toBuffer().toString()).toEqual("foo");
                    resolve();
                });
            }));
        });

        it("should be writable for multiple streams", async () => {
            // Arrange
            const output = new OutputStream();
            const input = new InputStream("foo");
            const input2 = new InputStream("bar");

            // Act
            input.pipe(output);
            input2.pipe(output);

            // Assert
            await (new Promise((resolve) => {
                output.on("finish", () => {
                    expect(output.toString()).toEqual("foobar");
                    expect(output.toBuffer().toString()).toEqual("foobar");
                    resolve();
                });
            }));
        });

    });

});
