import { Lockfile, readWantedLockfile } from "@pnpm/lockfile-file";

export const parseLockfile = async (
  lockfileDir: string
): Promise<Lockfile> => {
  const lock = await readWantedLockfile(lockfileDir, { ignoreIncompatible: false });

  if (!lock) {
    throw new Error('pnpm lockfile not found');
  }

  return lock;
};
