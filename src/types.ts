export interface Package {
  version: string;
  integrity?: string;
  resolved?: string;
  bundled?: boolean;
  dev?: boolean;
  optional?: boolean;
  engines?: Record<string, string> & {
    node: string;
  };
  os?: string[];
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface MainPackage {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface PackageToAnalyze {
  name: string;
  version: string;
  fullVersion: string;
  required: boolean;
}

export interface PackageAnalysis {
  packages: Record<string, Package>;
  toAnalyze: PackageToAnalyze[]
}

export interface PackageLockJson {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: Packages;
}

export type Packages = {
  [key: string]: Package | MainPackage;
};