/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import { InputStream } from "../../src/Input/InputStream";
import { OutputMock } from "./Mock/OutputMock";

describe("InputStream", () => {

    it("should take input in constructor", () => {
        // Act
        const input = new InputStream("foo");

        // Assert
        expect((input as any).contents.toString()).toBe("foo");
    });

    it("should pipe to output", () => {
        // Arrange
        const input = new InputStream("foo");
        const output = new OutputMock();

        // Act
        input.pipe(output);

        // Assert
        output.on("finish", () => {
            expect(output.toString()).toEqual("foo");
        });
    });

    it("should be empty after read", () => {
        // Arrange
        const input = new InputStream("foo");
        const output = new OutputMock();

        // Act
        input.pipe(output);

        // Assert
        output.on("finish", () => {
            expect(output.toString()).toEqual("foo");
            expect((input as any).contents.toString()).toBe("");
        });
    });

});
