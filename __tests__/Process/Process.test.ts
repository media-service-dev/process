/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import * as path from "path";
import { LogicException } from "../../src/Exception/LogicException";
import { ProcessFailedException } from "../../src/Exception/ProcessFailedException";
import { RuntimeException } from "../../src/Exception/RuntimeException";
import { OutputStream } from "../../src/Output/OutputStream";
import { Process } from "../../src/Process/Process";

describe("Process", () => {

    describe("run", () => {

        it("should execute the program", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(0);"]);

            // Act
            const actual = await process.run();

            // Assert
            expect(actual).toBe(0);
        });

        it("should return the given exit code", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(6);"]);

            // Act
            const actual = await process.run();

            // Assert
            expect(actual).toBe(6);
        });

    });

    describe("mustRun", () => {

        it("should return the process if run successfully", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(0)"]);

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual).toBe(process);
        });

        it("should throw if the exit code is not equal 0", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(1);"]);

            // Act
            const actual = async () => {
                await process.mustRun();
            };

            // Assert
            await expect(actual()).rejects.toThrow(ProcessFailedException);
        });

    });

    describe("getCommand", () => {

        it("should returns the command", () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(1)"]);

            // Act
            const actual = process.getCommand();

            // Assert
            expect(actual).toBe("node");
        });

    });

    describe("getArguments", () => {

        it("should returns the arguments", () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(1)"]);

            // Act
            const actual = process.getArguments();

            // Assert
            expect(actual).toEqual(["-e", "'process.exit(1)'"]);
        });

    });

    describe("toString", () => {

        it("should returns whole command and arguments", () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(1)"]);

            // Act
            const actual = process.toString();

            // Assert
            expect(actual).toBe("node -e 'process.exit(1)'");
        });

    });

    describe("start", () => {

        it("should start the process", async () => {
            // Arrange
            const process = new Process(["node", "-e", "setTimeout(() => { process.exit(1); }, 10);"]);

            // Act
            await process.start();

            // Assert
            expect(process.isRunning()).toBeTruthy();
            await process.wait();
        });

        it("should throw if the process start was called more than once", async () => {
            // Arrange
            const process = new Process(["node", "-e", "setTimeout(() => { process.exit(1); }, 10);"]);

            // Act
            const actual = async () => {
                await process.start();
                await process.start();
            };

            // Assert
            await expect(actual()).rejects.toThrow(RuntimeException);
        });

    });

    describe("wait", () => {

        it("should wait for finish executing command", async () => {
            // Arrange
            const process = new Process(["node", "-e", "setTimeout(() => { process.exit(1); }, 10);"]);

            // Act and Assert
            await process.start();
            expect(process.isRunning()).toBeTruthy();
            await process.wait();
            expect(process.isRunning()).toBeFalsy();
        });

        it("should throw if wait is called without start", async () => {
            // Arrange
            const process = new Process(["node", "-e", "setTimeout(() => { process.exit(1); }, 10);"]);

            // Act
            const actual = async () => {
                await process.wait();
            };

            // Assert
            await expect(actual()).rejects.toThrow(LogicException);
        });

    });

    describe("getOutput", () => {

        it("should return the command stdout", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stdout.write('foo');"]);

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getOutput()).toBe("foo");
        });

    });

    describe("getErrorOutput", () => {
        it("should return the command stderr", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stderr.write('bar')"]);

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getErrorOutput()).toBe("bar");
        });
    });

    describe("getOutput and getErrorOutput", () => {

        it("should return the correct data", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stdout.write('foo');process.stderr.write('bar');process.stdout.write('lorem');process.stderr.write('ipsum');"]);

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getOutput()).toBe("foolorem");
            expect(actual.getErrorOutput()).toBe("baripsum");
        });

    });

    describe("close", () => {

        it("should terminate the process", async () => {
            // Arrange
            const process = new Process(["node", "-e", "setTimeout(() => { process.exit(0); }, 20);"]);

            // Act
            await process.start();
            setTimeout(() => {
                process.stop();
            }, 10);
            await process.wait();

            // Assert
            expect(process.isRunning()).toBeFalsy();
            expect(process.getExitCode()).toBe(1);
        });

    });

    describe("input", () => {

        it("should pipe input", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stdin.pipe(process.stdout);"], {
                input: "foo",
            });

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getOutput()).toBe("foo");
        });

    });

    describe("getStdout", () => {

        it("should pipe continuously", async () => {
            // Arrange
            const runningProcess = new Process(["node", path.join(__dirname, "test-process.js")]);
            await runningProcess.start();
            const output = new OutputStream();
            const stdout = runningProcess.getStdout();

            interface Message {
                timestamp: number;

                output: {
                    index: number;
                    timestamp: number;
                }
            }

            const messages: Message[] = [];

            output.on("data", (chunk: Buffer) => {
                const now = new Date();
                const timestamp = now.getTime();

                messages.push({
                    timestamp,
                    output: JSON.parse(chunk.toString()),
                });
            });

            // Act
            stdout.pipe(output);
            await runningProcess.wait();

            // Assert
            expect(messages.length).toBe(3);

            for (const message of messages) {
                const difference = message.output.timestamp - message.timestamp;
                expect(difference).toBeLessThan(50);
                expect(difference).toBeGreaterThan(-50);
            }
        });

    });

    describe("stop", () => {

        it("should kill the underlying process", async () => {
            // Arrange
            const runningProcess = new Process(["node", path.join(__dirname, "test-process.js")]);
            await runningProcess.start();
            const output = new OutputStream();
            const stdout = runningProcess.getStdout();

            const messages: string[] = [];

            output.on("data", (chunk: Buffer) => {
                messages.push(chunk.toString());
            });

            // Act
            setTimeout(() => {
                runningProcess.stop("SIGINT");
            }, 2500);

            // Assert
            stdout.pipe(output);
            await runningProcess.wait();

            expect(messages.length).toBe(2);
        });

    });

    describe("getExitCode", () => {

        it("should not throw if exit code is zero", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.exit(0);"]);
            await process.run();

            // Act
            const actual = process.getExitCode();

            // Assert
            expect(actual).toBe(0);
        });

    });

    describe("environment", () => {

        test("app_env is not set", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stdout.write(process.env.APP_FOO||'undefined');"]);

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getOutput()).toBe("undefined");
        });

        it("should set environment vars", async () => {
            // Arrange
            const process = new Process(["node", "-e", "process.stdout.write(process.env.APP_FOO||'undefined');"], {
                environment: {
                    "APP_FOO": "bar",
                },
            });

            // Act
            const actual = await process.mustRun();

            // Assert
            expect(actual.getOutput()).toBe("bar");
        });

    });

});
