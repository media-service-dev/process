/*
 * This file is part of the @mscs/process package.
 *
 * Copyright (c) 2020 media-service consulting & solutions GmbH
 *
 * For the full copyright and license information, please view the LICENSE
 * File that was distributed with this source code.
 */

export interface ProcessOptions {

    /**
     * The working directory.
     */
    directory: string;

    /**
     * The stdin for the process.
     */
    input: string | null;

    /**
     * The environment for the process.
     */
    environment: NodeJS.ProcessEnv | null;

    /**
     * Run the process in background.
     */
    detached: boolean;
}
