import { PackageSnapshots, TarballResolution } from "@pnpm/lockfile-file";
import { pkgSnapshotToResolution } from "@pnpm/lockfile-utils";
import { Package, PackageAnalysis, PackageToAnalyze } from "./types.js";
import { groomVersion } from "./groomVersion.js";

export const analyzePackage = (
  pnpmPackages: PackageSnapshots,
  packageAnalysis: PackageAnalysis
): PackageAnalysis => {
  const current = packageAnalysis.toAnalyze[0];
  const fullPackageName = pnpmPackages.hasOwnProperty(current.fullVersion)
    ? current.fullVersion
    : `/${current.name}/${current.fullVersion}`;
  if (fullPackageName.includes("/link:")) {
    console.log(`Ignoring package from pnpm-lock.yaml, that is unhandled by npm: ${fullPackageName}`);
    return {
      ...packageAnalysis,
      toAnalyze: packageAnalysis.toAnalyze.slice(1),
    };
  }

  const pnpmPackage = pnpmPackages.hasOwnProperty(fullPackageName) 
    ? pnpmPackages[fullPackageName] 
    : null;
  if (!pnpmPackage) {
    if (current.required) {
      throw new Error(`Cannot determine package dependency: ${fullPackageName} in pnpm lockfile`);
    } else {
      return {
        ...packageAnalysis,
        toAnalyze: packageAnalysis.toAnalyze.slice(1),
      };
    }
  }

  const newDependenciesToAnalyze = resolveDependenciesToAnalyze(pnpmPackage.dependencies ?? {}, packageAnalysis, true);
  const newOptionalDependenciesToAnalyze = resolveDependenciesToAnalyze(pnpmPackage.optionalDependencies ?? {}, packageAnalysis, false);
  const newPeerDependenciesToAnalyze = resolveDependenciesToAnalyze(pnpmPackage.peerDependencies ?? {}, packageAnalysis, false);

  const resolution = pkgSnapshotToResolution(
    fullPackageName,
    pnpmPackage,
    { default: 'https://registry.npmjs.org/' }) as TarballResolution;
  const newPackage: Package = {
    version: current.version,
    integrity: resolution.integrity,
    resolved: resolution.tarball,
    dev: pnpmPackage.dev,
    optional: pnpmPackage.optional,
    engines: pnpmPackage.engines,
    os: pnpmPackage.os,
    dependencies: !!pnpmPackage.dependencies ? deobfuscateDependencyVersions(pnpmPackage.dependencies) : undefined,
    optionalDependencies: !!pnpmPackage.optionalDependencies ? deobfuscateDependencyVersions(pnpmPackage.optionalDependencies) : undefined,
    peerDependencies: !!pnpmPackage.peerDependencies ? deobfuscateDependencyVersions(pnpmPackage.peerDependencies) : undefined,
  };
  return {
    packages: {
      ...packageAnalysis.packages,
      [current.name]: newPackage,
    },
    toAnalyze: [
      ...packageAnalysis.toAnalyze.slice(1),
      ...newDependenciesToAnalyze,
      ...newOptionalDependenciesToAnalyze,
      ...newPeerDependenciesToAnalyze,
    ]
  };
};

const resolveDependenciesToAnalyze = (
  dependencies: Record<string, string>,
  packageAnalysis: PackageAnalysis,
  required: boolean,
): PackageToAnalyze[] => Object.keys(dependencies)
  .filter(dependencyName => !packageAnalysis.packages.hasOwnProperty(dependencyName))
  .map(dependencyName => ({
    name: dependencyName,
    version: groomVersion(dependencies[dependencyName]),
    fullVersion: dependencies[dependencyName],
    required,
  }));

const deobfuscateDependencyVersions = (
  dependencies: Record<string, string>
) => Object.keys(dependencies)
  .reduce(
    (acc, key) => (acc[key] = groomVersion(dependencies[key]), acc),
    {} as Record<string, string>
  );

