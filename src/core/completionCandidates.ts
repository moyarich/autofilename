export const FileEntryType = {
  File: 1,
  Directory: 2
} as const;

export interface CompletionEntry {
  name: string;
  type: number;
}

export interface CompletionCandidate {
  name: string;
  insertText: string;
  isDirectory: boolean;
}

export interface CompletionCandidateOptions {
  prefix: string;
  trimExtensions: ReadonlySet<string>;
  showHiddenFiles: boolean;
  foldersFirst: boolean;
  insertTrailingSlash: boolean;
}

export interface DirectoryReader<TUri> {
  readDirectory(uri: TUri): Promise<readonly CompletionEntry[]>;
}

export async function getCompletionCandidates<TUri>(
  reader: DirectoryReader<TUri>,
  directory: TUri,
  options: CompletionCandidateOptions
): Promise<CompletionCandidate[]> {
  let entries: readonly CompletionEntry[];

  try {
    entries = await reader.readDirectory(directory);
  } catch {
    return [];
  }

  return entries
    .filter(entry => options.showHiddenFiles || !entry.name.startsWith('.'))
    .filter(entry =>
      entry.name.toLowerCase().startsWith(options.prefix.toLowerCase())
    )
    .sort((left, right) => compareEntries(left, right, options.foldersFirst))
    .map(entry => {
      const isDirectory = Boolean(entry.type & FileEntryType.Directory);
      return {
        name: entry.name,
        isDirectory,
        insertText: isDirectory
          ? options.insertTrailingSlash
            ? `${entry.name}/`
            : entry.name
          : trimExtension(entry.name, options.trimExtensions)
      };
    });
}

function trimExtension(name: string, extensions: ReadonlySet<string>): string {
  const lastDot = name.lastIndexOf('.');

  if (lastDot <= 0) {
    return name;
  }

  const extension = name.slice(lastDot + 1).toLowerCase();
  return extensions.has(extension) ? name.slice(0, lastDot) : name;
}

function compareEntries(
  left: CompletionEntry,
  right: CompletionEntry,
  foldersFirst: boolean
): number {
  const leftDirectory = Boolean(left.type & FileEntryType.Directory);
  const rightDirectory = Boolean(right.type & FileEntryType.Directory);

  if (foldersFirst && leftDirectory !== rightDirectory) {
    return leftDirectory ? -1 : 1;
  }

  return left.name.localeCompare(right.name);
}
