import { parsePackageJson } from "./packageJson.js";
import { Package, PackageAnalysis, PackageLockJson, PackageToAnalyze } from "./types.js";
import { analyzePackage } from "./analyzePackage.js";
import { groomVersion } from "./groomVersion.js";
import { Lockfile, ProjectId } from "@pnpm/lockfile.fs";

export const resolvePackageLockJsonContent = async (
  lockfileDir: string,
  pnpmLockFile: Lockfile,
  packageJsonRelativeDir: string
): Promise<PackageLockJson> => {
  const pnpmImporters = pnpmLockFile.importers ?? {};
  const pnpmPackages = pnpmLockFile.packages ?? {};
  const packageJsonPath = `${lockfileDir}/${packageJsonRelativeDir}/package.json`;
  const packageJson = await parsePackageJson(packageJsonPath);
  const mainPackageKey = packageJsonRelativeDir.replace("\\", "/") as ProjectId;
  if (!pnpmImporters.hasOwnProperty(mainPackageKey)) {
    throw new Error(`Cannot determine importer: ${mainPackageKey} in pnpm lockfile`);
  }
  const mainPnpmImporterDependencies = {
    ...pnpmImporters[mainPackageKey].dependencies,
    ...pnpmImporters[mainPackageKey].devDependencies,
  };
  const optionalPnpmImporterDependencies = pnpmImporters[mainPackageKey].optionalDependencies ?? {};

  const requiredPackageAnalysis: PackageToAnalyze[] = Object.keys(mainPnpmImporterDependencies)
    .map(dependencyName => ({
      name: dependencyName,
      fullVersion: mainPnpmImporterDependencies[dependencyName],
      version: groomVersion(mainPnpmImporterDependencies[dependencyName]),
      required: true,
    }));
  const optionalPackageAnalysis: PackageToAnalyze[] = Object.keys(optionalPnpmImporterDependencies)
    .map(dependencyName => ({
      name: dependencyName,
      fullVersion: optionalPnpmImporterDependencies[dependencyName],
      version: groomVersion(optionalPnpmImporterDependencies[dependencyName]),
      required: false,
    }));
  let packageAnalysis: PackageAnalysis = {
    packages: {},
    toAnalyze: requiredPackageAnalysis.concat(optionalPackageAnalysis),
  };

  while (packageAnalysis.toAnalyze.length > 0) {
    packageAnalysis = analyzePackage(pnpmPackages, packageAnalysis);
  }

  const packagesResult = Object.keys(packageAnalysis.packages)
    .reduce(
      (acc, key) => (
        acc[`node_modules/${key}`] = packageAnalysis.packages[key],
        acc
      ),
      {} as Record<string, Package>);

  const packageLockJson: PackageLockJson = {
    name: packageJson.name,
    version: packageJson.version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: filterOutWorkspaceDependencies(packageJson.dependencies ?? {}),
        devDependencies: filterOutWorkspaceDependencies(packageJson.devDependencies ?? {}),
      },
      ...packagesResult,
    },
  };

  return packageLockJson;
};

const filterOutWorkspaceDependencies = (
  dependencies: Record<string, string>
) => Object.keys(dependencies)
  .filter(key => !dependencies[key].startsWith("workspace"))
  .reduce(
    (acc, key) => (acc[key] = groomVersion(dependencies[key]), acc),
    {} as Record<string, string>
  );
