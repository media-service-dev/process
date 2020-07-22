/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import * as childProcess from "child_process";
import * as os from "os";
import { ArgumentException } from "../Exception/ArgumentException";
import { LogicException } from "../Exception/LogicException";
import { ProcessFailedException } from "../Exception/ProcessFailedException";
import { RuntimeException } from "../Exception/RuntimeException";
import { InputStream } from "../Input/InputStream";
import { OutputStream } from "../Output/OutputStream";
import { ProcessOptions } from "./ProcessOptions";
import { ProcessStatus } from "./ProcessStatus";

export class Process {

    protected static shell: string;

    protected command: string;

    protected args: string[];

    protected exitCode: number | null;

    protected options: ProcessOptions;

    protected stdout: OutputStream;

    protected stderr: OutputStream;

    protected status: ProcessStatus = ProcessStatus.READY;

    protected process: childProcess.ChildProcess;

    public constructor(command: string[], options: Partial<ProcessOptions> = {}) {
        if (command.length === 0) {
            throw new ArgumentException("Missing command.");
        }

        [this.command, ...this.args] = command;
        this.args = this.escapeShellArguments(this.args);
        this.options = {
            directory: process.cwd(),
            input: null,
            environment: null,
            detached: false,
            ...options,
        };

        this.resetProcessData();
    }

    private static async getShell(): Promise<string> {
        if (!this.shell) {
            const command = "win32" === os.platform() ? "where" : "which";

            this.shell = await new Promise((resolve, reject) => {
                childProcess.exec(command + " bash", (error, stdout) => {
                    if (null !== error) {
                        reject(error);
                    } else {
                        const [shellPath] = stdout.replace(/\r?\n/g, "\n").split("\n").filter(item => item.length);
                        resolve(shellPath);
                    }
                });
            });
        }

        return this.shell;
    }

    /**
     * Get the process command.
     *
     * @returns {string}
     */
    public getCommand(): string {
        return this.command;
    }

    /**
     * Get the process arguments
     *
     * @returns {string[]}
     */
    public getArguments() {
        return this.args;
    }

    /**
     * Format the command with the arguments as string
     *
     * @returns {string}
     */
    public toString() {
        return this.getCommand() + " " + this.getArguments().join(" ");
    }

    /**
     * Starts the process.
     *
     * The termination of the process can be awaited with wait().
     *
     * @throws {RuntimeException} If the process is already running
     * @returns {Promise<void>}
     */
    public async start(): Promise<void> {
        if (this.isRunning()) {
            throw new RuntimeException("Process is already running");
        }

        this.resetProcessData();

        const shell = await Process.getShell();
        const options: childProcess.SpawnOptions = {
            cwd: this.options.directory,
            detached: this.options.detached,
            stdio: this.options.detached ? "ignore" : "pipe",
            shell,
        };

        if (null !== this.options.environment) {
            options.env = this.options.environment;
        }

        this.process = childProcess.spawn(this.command, this.args, options);
        this.status = ProcessStatus.STARTED;

        if (this.options.detached) {
            this.process.unref();
            this.status = ProcessStatus.DETACHED;
        }

        if (this.options.input && this.process.stdin) {
            const stream = new InputStream(this.options.input);
            stream.pipe(this.process.stdin);
        }

        if (this.process.stdout) {
            this.process.stdout.pipe(this.stdout);
        }

        if (this.process.stderr) {
            this.process.stderr.pipe(this.stderr);
        }
    }

    /**
     * Waits for the process to terminate.
     *
     * @returns {Promise<number>} The exit code.
     */
    public async wait(): Promise<number> {
        if (!this.isStarted()) {
            throw new LogicException("Process must be started before calling \"wait\".");
        }

        if (this.isDetached()) {
            // Lets assume it would be successfully.
            this.exitCode = 0;

            return 0;
        }

        return new Promise((resolve, reject) => {
            this.process.on("error", (error) => {
                reject(error);
            });

            this.process.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
                if (null !== code) {
                    this.exitCode = code;
                } else {
                    this.exitCode = null !== signal ? 1 : 0;
                }

                this.status = ProcessStatus.TERMINATED;
                resolve(this.exitCode);
            });

            this.process.on("close", (code: number | null) => {
                if (null !== code) {
                    this.exitCode = code;
                } else {
                    this.exitCode = this.exitCode !== null ? this.exitCode : 1;
                }

                this.status = ProcessStatus.TERMINATED;
                resolve(this.exitCode);
            });
        });
    }

    /**
     * Checks if the process is currently running.
     *
     * @returns {boolean}
     */
    public isRunning(): boolean {
        if (ProcessStatus.STARTED !== this.status) {
            return false;
        }

        return null === this.exitCode;
    }

    /**
     * Starts the process and waits for termination.
     *
     * @returns {Promise<number>} The exit code
     */
    public async run(): Promise<number> {
        await this.start();

        return this.wait();
    }

    /**
     * Similar to run, but returns the process and throw if the process fails.
     *
     * @throws {ProcessFailedException} If the process returns an exit code not equal zero
     * @returns {Promise<this>}
     */
    public async mustRun(): Promise<this> {
        const result = await this.run();

        if (0 !== result) {
            throw new ProcessFailedException(this);
        }

        return this;
    }

    /**
     * Returns the output from the process stdout
     *
     * @param {boolean} normalized should the new lines be normalized to `\n`
     * @returns {string}
     */
    public getOutput(normalized: boolean = true): string {
        let output = this.stdout.toString();

        if (normalized) {
            output = output.replace(/\r?\n/g, "\n");
        }

        return output;
    }

    /**
     * Returns the output from the process stderr
     *
     * @param {boolean} normalized should the new lines be normalized to `\n`
     * @returns {string}
     */
    public getErrorOutput(normalized: boolean = true): string {
        let output = this.stderr.toString();

        if (normalized) {
            output = output.replace(/\r?\n/g, "\n");
        }

        return output;
    }

    /**
     * Checks if the process ended successfully.
     *
     * @returns {boolean}
     */
    public isSuccessful(): boolean {
        return this.exitCode === 0;
    }

    /**
     * Returns the exit code returned by the process.
     *
     * @returns {number}
     */
    public getExitCode(): number {
        if (null === this.exitCode) {
            throw new RuntimeException("Missing exit code.");
        }

        return this.exitCode;
    }

    /**
     * Checks if the process is terminated.
     *
     * @returns {boolean}
     */
    public isTerminated(): boolean {
        return ProcessStatus.TERMINATED === this.status;
    }

    /**
     * Checks if the process is detached.
     *
     * @returns {boolean}
     */
    public isDetached(): boolean {
        return ProcessStatus.DETACHED === this.status;
    }

    /**
     * Checks if the process has been started with no regard to the current state.
     *
     * @returns {boolean}
     */
    public isStarted(): boolean {
        return ProcessStatus.READY !== this.status;
    }

    /**
     * The working directory
     *
     * @returns {string}
     */
    public getWorkingDirectory(): string {
        return this.options.directory;
    }

    /**
     * Kill the process
     *
     * @param {string} signal
     */
    public stop(signal: NodeJS.Signals = "SIGINT"): void {
        this.status = ProcessStatus.TERMINATED;
        this.process.kill(signal);
    }

    public getStdout(): OutputStream {
        return this.stdout;
    }

    public getStderr(): OutputStream {
        return this.stderr;
    }

    private escapeShellArguments(args: string[]) {
        return args.map((item: string) => {
            if (/[^A-Za-z0-9_=:-]/.test(item)) {
                return "'" + item.replace(/'/g, "'\\''") + "'";
            }

            return item;
        });
    }

    private resetProcessData() {
        this.status = ProcessStatus.READY;
        this.exitCode = null;
        this.stdout = new OutputStream();
        this.stderr = new OutputStream();
    }

}
