#!/usr/bin/node

import { Command } from "commander";
import packageLockGenerator from "./PackageLockGenerator.js";

const program = (new Command())
  .requiredOption("-i, --input-lock <pnpmLockPath>", "Path to directory with pnpm-lock.yaml file")
  .option("-t, --target-importer <importerPath>", "Path to directory of project importer to generate package-lock.json file for")
  .option("-a, --all", "Flag to generate package-lock.json file for all importers")
  .parse(process.argv);

const options = program.opts();

if (!options.all && !options.targetImporter) {
  console.error("Parameter --target-importer or --all has to be defined");
  process.exit(1);
}

const lockfileDir = options.inputLock as string;

const handleOperationResult = async (
  operationFunc: () => Promise<void>,
) => {
  try {
    await operationFunc();
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
    } else {
      console.error(`Exception thrown: ${err}`);
    }
    process.exit(1);
  }
}

const executeGenerateForAll = async (
  lockfileDir: string,
) => handleOperationResult(() => {
  console.log("Generating package-lock.json for all importers");
  return packageLockGenerator.generateForAll(lockfileDir);
});

const executeGenerateForImporter = async (
  lockfileDir: string,
  importerPath: string,
) => handleOperationResult(() => {
  console.log(`Generating package-lock.json for importer: ${importerPath}`);
  return packageLockGenerator.generateForImporter(lockfileDir, importerPath);
});

if (!!options.all) {
  executeGenerateForAll(lockfileDir);
}

if (!!options.targetImporter) {
  const importerPath = options.targetImporter as string;
  executeGenerateForImporter(lockfileDir, importerPath);
}
