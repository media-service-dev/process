
# @mscs/process

**Version:** 0.1.0-DEV

This is a library to handle child processes in typescript for node.

## Installation

```shell script
$ yarn add @mscs/process
```

## Usage

Short example:

```typescript
import { Process } from "@mscs/process";

async function runtime() {
    const listDirectoryProcess = new Process(["ls", "-lar"]);
    const exitCode = await listDirectoryProcess.run();

    if(listDirectoryProcess.isSuccessful()){
        const output = listDirectoryProcess.getOutput();
        // ...
    } else {
        const output = listDirectoryProcess.getErrorOutput();
        // ...    
    }
}

runtime().catch(error => {
    console.log(error);
    process.exit(1);
});
```

# Important note 

Since *Symfony* is, for good reason, a registered trademark, please take note that we are in no way associated with [the Symfony brand](https://symfony.com/) or the [SensioLabs](https://sensiolabs.com/) organization.
Therefore, we don't represent or speak for any of them.
