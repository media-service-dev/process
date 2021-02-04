/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

import * as util from "util";

import { Process } from "../Process/Process";
import { ArgumentException } from "./ArgumentException";
import { RuntimeException } from "./RuntimeException";

export class ProcessFailedException extends RuntimeException {

    private process: Process;

    public constructor(process: Process) {
        super();

        if (process.isSuccessful()) {
            throw new ArgumentException("Expected a failed process, but the given process was successful.");
        }

        this.message = util.format("The command \"%s\" failed." + "\n\nExit Code: %s\n\nWorking directory: %s\n\nError Output: %s",
            process.getCommand(),
            process.getExitCode(),
            process.getWorkingDirectory(),
            process.getErrorOutput(true),
        );

        this.process = process;
    }

    public getProcess() {
        return this.process;
    }

}
