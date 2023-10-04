import { writeFile } from "fs/promises";
import { parseLockfile } from "./parseLockfile.js";
import { resolvePackageLockJsonContent } from "./resolvePackageLockJsonContent.js";
import { PackageLockJson } from "./types.js";

const generatePackageLockFor = async (
  lockfileDir: string,
  packageJsonRelativeDir: string
) => {
  const packageLockJsonPath = `${lockfileDir}/${packageJsonRelativeDir}/package-lock.json`;
  const pnpmLockFile = await parseLockfile(lockfileDir);

  const packageLockJson = await resolvePackageLockJsonContent(lockfileDir, pnpmLockFile, packageJsonRelativeDir);
  await writePackageLockJson(packageLockJsonPath, packageLockJson);
};

const generatePackageLockForAll = async (
  lockfileDir: string,
) => {
  const pnpmLockFile = await parseLockfile(lockfileDir);
  const pnpmImporterKeys = Object.keys(pnpmLockFile.importers);
  const generationPromises = pnpmImporterKeys.map(async relativeDir => {
    const packageLockJsonPath = `${lockfileDir}/${relativeDir}/package-lock.json`;
    const packageLockJson = await resolvePackageLockJsonContent(lockfileDir, pnpmLockFile, relativeDir);
    await writePackageLockJson(packageLockJsonPath, packageLockJson);
  });
  await Promise.all(generationPromises);
};

const writePackageLockJson = async (
  packageLockJsonPath: string,
  packageLockJson: PackageLockJson,
): Promise<void> => {
  const packageLockJsonRaw = JSON.stringify(packageLockJson, null, 2);
  console.log(`Writing package-lock.json file under path: ${packageLockJsonPath}`);
  return writeFile(packageLockJsonPath, packageLockJsonRaw, { encoding: "utf8", flag: "w" });
};

export interface PackageLockGenerator {
  generateForImporter: (lockfileDir: string, packageJsonRelativeDir: string) => Promise<void>;
  generateForAll: (lockfileDir: string) => Promise<void>;
}

const generator: PackageLockGenerator = {
  generateForImporter: generatePackageLockFor,
  generateForAll: generatePackageLockForAll,
};
export default generator;
