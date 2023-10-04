import { readFile } from "fs/promises";

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export const parsePackageJson = async (
  packageJsonPath: string
): Promise<PackageJson> => {
  const packageJsonBuffer = await readFile(packageJsonPath);
  const packageJson = JSON.parse(packageJsonBuffer.toString("utf8")) as PackageJson;
  if (!packageJson) {
    throw new Error(`Cannot parse package.json file under path: ${packageJsonPath}`);
  }

  return packageJson;
};
