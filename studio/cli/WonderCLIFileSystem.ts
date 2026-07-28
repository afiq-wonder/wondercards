import {
    access,
    copyFile,
    mkdir,
    readFile,
    rename,
    rm,
    writeFile,
  } from "node:fs/promises";
  
  import {
    constants,
  } from "node:fs";
  
  import {
    dirname,
    extname,
    isAbsolute,
    join,
    relative,
    resolve,
  } from "node:path";
  
  import {
    cloneWonderCLIConfig,
  } from "./WonderCLIConfig";
  
  import type {
    WonderCLIConfig,
    WonderCLIOverwriteMode,
  } from "./WonderCLIConfig";
  
  export type WonderCLIFileKey =
    | "brief"
    | "generated"
    | "draft"
    | "validationReport"
    | "catalog"
    | "manifest"
    | "prompt";
  
  export interface WonderCLIResolvedPaths {
    rootDirectory: string;
  
    briefsDirectory: string;
  
    generatedDirectory: string;
  
    draftsDirectory: string;
  
    reportsDirectory: string;
  
    catalogsDirectory: string;
  
    promptsDirectory: string;
  
    briefFile: string;
  
    generatedFile: string;
  
    draftFile: string;
  
    validationReportFile: string;
  
    catalogFile: string;
  
    manifestFile: string;
  
    promptFile: string;
  }
  
  export interface WonderCLIWriteOptions {
    overwriteMode?: WonderCLIOverwriteMode;
  
    encoding?: BufferEncoding;
  }
  
  export interface WonderCLIJSONWriteOptions
    extends WonderCLIWriteOptions {
    prettyPrint?: boolean;
  }
  
  export interface WonderCLIWriteResult {
    success: boolean;
  
    path: string;
  
    backupPath: string | null;
  
    bytesWritten: number;
  
    overwritten: boolean;
  
    createdAt: Date;
  }
  
  export interface WonderCLIReadResult<T> {
    path: string;
  
    value: T;
  
    readAt: Date;
  }
  
  export interface WonderCLIWorkspaceResult {
    rootDirectory: string;
  
    directories: string[];
  
    createdAt: Date;
  }
  
  interface PreparedWrite {
    targetPath: string;
  
    backupPath: string | null;
  
    overwritten: boolean;
  }
  
  const DEFAULT_ENCODING: BufferEncoding =
    "utf8";
  
  /**
   * Handles all local file operations used by WonderOS CLI.
   *
   * Responsibilities:
   *
   * - create Wonder Studio workspace folders
   * - resolve safe file paths
   * - read and write JSON
   * - read and write text
   * - prevent path traversal
   * - enforce overwrite rules
   * - create timestamped backups
   * - save prompts, batches, reports, manifests, and catalogs
   */
  export class WonderCLIFileSystem {
    private readonly config: WonderCLIConfig;
  
    private readonly workingDirectory: string;
  
    private readonly paths: WonderCLIResolvedPaths;
  
    constructor(
      config: WonderCLIConfig,
      workingDirectory =
        process.cwd()
    ) {
      this.config =
        cloneWonderCLIConfig(
          config
        );
  
      this.workingDirectory =
        resolve(
          workingDirectory
        );
  
      this.paths =
        resolveCLIPaths(
          this.config,
          this.workingDirectory
        );
    }
  
    // =========================================================
    // CONFIGURATION
    // =========================================================
  
    getConfig(): WonderCLIConfig {
      return cloneWonderCLIConfig(
        this.config
      );
    }
  
    getWorkingDirectory(): string {
      return this.workingDirectory;
    }
  
    getResolvedPaths(): WonderCLIResolvedPaths {
      return {
        ...this.paths,
      };
    }
  
    getRootDirectory(): string {
      return this.paths.rootDirectory;
    }
  
    // =========================================================
    // WORKSPACE
    // =========================================================
  
    async initialiseWorkspace(): Promise<WonderCLIWorkspaceResult> {
      const directories =
        uniquePaths([
          this.paths.rootDirectory,
  
          this.paths.briefsDirectory,
  
          this.paths.generatedDirectory,
  
          this.paths.draftsDirectory,
  
          this.paths.reportsDirectory,
  
          this.paths.catalogsDirectory,
  
          this.paths.promptsDirectory,
        ]);
  
      for (
        const directory of
          directories
      ) {
        await mkdir(
          directory,
          {
            recursive: true,
          }
        );
      }
  
      return {
        rootDirectory:
          this.paths.rootDirectory,
  
        directories,
  
        createdAt:
          new Date(),
      };
    }
  
    async ensureDirectory(
      directoryPath: string
    ): Promise<string> {
      const safeDirectory =
        this.resolveSafePath(
          directoryPath
        );
  
      await mkdir(
        safeDirectory,
        {
          recursive: true,
        }
      );
  
      return safeDirectory;
    }
  
    // =========================================================
    // CONFIGURED PATHS
    // =========================================================
  
    getFilePath(
      key: WonderCLIFileKey
    ): string {
      switch (key) {
        case "brief":
          return this.paths.briefFile;
  
        case "generated":
          return this.paths.generatedFile;
  
        case "draft":
          return this.paths.draftFile;
  
        case "validationReport":
          return this.paths
            .validationReportFile;
  
        case "catalog":
          return this.paths.catalogFile;
  
        case "manifest":
          return this.paths.manifestFile;
  
        case "prompt":
          return this.paths.promptFile;
  
        default:
          return assertNever(key);
      }
    }
  
    // =========================================================
    // FILE STATUS
    // =========================================================
  
    async exists(
      filePath: string
    ): Promise<boolean> {
      const safePath =
        this.resolveSafePath(
          filePath
        );
  
      try {
        await access(
          safePath,
          constants.F_OK
        );
  
        return true;
      } catch {
        return false;
      }
    }
  
    async configuredFileExists(
      key: WonderCLIFileKey
    ): Promise<boolean> {
      return this.exists(
        this.getFilePath(key)
      );
    }
  
    // =========================================================
    // TEXT READING
    // =========================================================
  
    async readText(
      filePath: string,
      encoding: BufferEncoding =
        DEFAULT_ENCODING
    ): Promise<WonderCLIReadResult<string>> {
      const safePath =
        this.resolveSafePath(
          filePath
        );
  
      const value =
        await readFile(
          safePath,
          {
            encoding,
          }
        );
  
      return {
        path:
          safePath,
  
        value,
  
        readAt:
          new Date(),
      };
    }
  
    async readConfiguredText(
      key: WonderCLIFileKey,
      encoding: BufferEncoding =
        DEFAULT_ENCODING
    ): Promise<WonderCLIReadResult<string>> {
      return this.readText(
        this.getFilePath(key),
        encoding
      );
    }
  
    // =========================================================
    // JSON READING
    // =========================================================
  
    async readJSON<T>(
      filePath: string
    ): Promise<WonderCLIReadResult<T>> {
      const result =
        await this.readText(
          filePath
        );
  
      try {
        return {
          path:
            result.path,
  
          value:
            JSON.parse(
              removeByteOrderMark(
                result.value
              )
            ) as T,
  
          readAt:
            result.readAt,
        };
      } catch (error) {
        throw new Error(
          [
            `WonderCLIFileSystem: invalid JSON in "${result.path}".`,
            getErrorMessage(error),
          ].join(" ")
        );
      }
    }
  
    async readConfiguredJSON<T>(
      key: WonderCLIFileKey
    ): Promise<WonderCLIReadResult<T>> {
      return this.readJSON<T>(
        this.getFilePath(key)
      );
    }
  
    // =========================================================
    // TEXT WRITING
    // =========================================================
  
    async writeText(
      filePath: string,
      content: string,
      options: WonderCLIWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      const encoding =
        options.encoding ??
        DEFAULT_ENCODING;
  
      const prepared =
        await this.prepareWrite(
          filePath,
          options.overwriteMode
        );
  
      await mkdir(
        dirname(
          prepared.targetPath
        ),
        {
          recursive: true,
        }
      );
  
      await writeFile(
        prepared.targetPath,
        content,
        {
          encoding,
        }
      );
  
      return {
        success: true,
  
        path:
          prepared.targetPath,
  
        backupPath:
          prepared.backupPath,
  
        bytesWritten:
          Buffer.byteLength(
            content,
            encoding
          ),
  
        overwritten:
          prepared.overwritten,
  
        createdAt:
          new Date(),
      };
    }
  
    async writeConfiguredText(
      key: WonderCLIFileKey,
      content: string,
      options: WonderCLIWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeText(
        this.getFilePath(key),
        content,
        options
      );
    }
  
    // =========================================================
    // JSON WRITING
    // =========================================================
  
    async writeJSON(
      filePath: string,
      value: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      const prettyPrint =
        options.prettyPrint ??
        this.config.execution
          .prettyPrint;
  
      const content =
        serialiseJSON(
          value,
          prettyPrint
        );
  
      return this.writeText(
        filePath,
        content,
        options
      );
    }
  
    async writeConfiguredJSON(
      key: WonderCLIFileKey,
      value: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeJSON(
        this.getFilePath(key),
        value,
        options
      );
    }
  
    // =========================================================
    // SPECIALISED WRITERS
    // =========================================================
  
    async writePrompt(
      prompt: string,
      options: WonderCLIWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredText(
        "prompt",
        prompt,
        options
      );
    }
  
    async writeGeneratedContent(
      content: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredJSON(
        "generated",
        content,
        options
      );
    }
  
    async writeStudioBatch(
      batch: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredJSON(
        "draft",
        batch,
        options
      );
    }
  
    async writeValidationReport(
      report: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredJSON(
        "validationReport",
        report,
        options
      );
    }
  
    async writeCatalog(
      content: string,
      options: WonderCLIWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredText(
        "catalog",
        content,
        options
      );
    }
  
    async writeManifest(
      manifest: unknown,
      options: WonderCLIJSONWriteOptions = {}
    ): Promise<WonderCLIWriteResult> {
      return this.writeConfiguredJSON(
        "manifest",
        manifest,
        options
      );
    }
  
    // =========================================================
    // SPECIALISED READERS
    // =========================================================
  
    async readBrief<T>(): Promise<WonderCLIReadResult<T>> {
      return this.readConfiguredJSON<T>(
        "brief"
      );
    }
  
    async readGeneratedContent<T>(): Promise<WonderCLIReadResult<T>> {
      return this.readConfiguredJSON<T>(
        "generated"
      );
    }
  
    async readStudioBatch<T>(): Promise<WonderCLIReadResult<T>> {
      return this.readConfiguredJSON<T>(
        "draft"
      );
    }
  
    async readValidationReport<T>(): Promise<WonderCLIReadResult<T>> {
      return this.readConfiguredJSON<T>(
        "validationReport"
      );
    }
  
    async readManifest<T>(): Promise<WonderCLIReadResult<T>> {
      return this.readConfiguredJSON<T>(
        "manifest"
      );
    }
  
    // =========================================================
    // COPY AND MOVE
    // =========================================================
  
    async copy(
      sourcePath: string,
      destinationPath: string,
      overwriteMode:
        WonderCLIOverwriteMode =
        this.config.execution
          .overwriteMode
    ): Promise<WonderCLIWriteResult> {
      const safeSource =
        this.resolveSafePath(
          sourcePath
        );
  
      const prepared =
        await this.prepareWrite(
          destinationPath,
          overwriteMode
        );
  
      await mkdir(
        dirname(
          prepared.targetPath
        ),
        {
          recursive: true,
        }
      );
  
      await copyFile(
        safeSource,
        prepared.targetPath
      );
  
      const copiedContent =
        await readFile(
          prepared.targetPath
        );
  
      return {
        success: true,
  
        path:
          prepared.targetPath,
  
        backupPath:
          prepared.backupPath,
  
        bytesWritten:
          copiedContent.byteLength,
  
        overwritten:
          prepared.overwritten,
  
        createdAt:
          new Date(),
      };
    }
  
    async move(
      sourcePath: string,
      destinationPath: string,
      overwriteMode:
        WonderCLIOverwriteMode =
        this.config.execution
          .overwriteMode
    ): Promise<WonderCLIWriteResult> {
      const safeSource =
        this.resolveSafePath(
          sourcePath
        );
  
      const prepared =
        await this.prepareWrite(
          destinationPath,
          overwriteMode
        );
  
      await mkdir(
        dirname(
          prepared.targetPath
        ),
        {
          recursive: true,
        }
      );
  
      const sourceContent =
        await readFile(
          safeSource
        );
  
      await rename(
        safeSource,
        prepared.targetPath
      );
  
      return {
        success: true,
  
        path:
          prepared.targetPath,
  
        backupPath:
          prepared.backupPath,
  
        bytesWritten:
          sourceContent.byteLength,
  
        overwritten:
          prepared.overwritten,
  
        createdAt:
          new Date(),
      };
    }
  
    // =========================================================
    // DELETE
    // =========================================================
  
    async removeFile(
      filePath: string
    ): Promise<boolean> {
      const safePath =
        this.resolveSafePath(
          filePath
        );
  
      if (
        !(await this.exists(
          safePath
        ))
      ) {
        return false;
      }
  
      await rm(
        safePath,
        {
          force: true,
        }
      );
  
      return true;
    }
  
    async removeConfiguredFile(
      key: WonderCLIFileKey
    ): Promise<boolean> {
      return this.removeFile(
        this.getFilePath(key)
      );
    }
  
    // =========================================================
    // SAFE PATH RESOLUTION
    // =========================================================
  
    resolveSafePath(
      requestedPath: string
    ): string {
      if (
        !hasText(
          requestedPath
        )
      ) {
        throw new Error(
          "WonderCLIFileSystem: path is required."
        );
      }
  
      if (
        requestedPath.includes(
          "\0"
        )
      ) {
        throw new Error(
          "WonderCLIFileSystem: path contains a null byte."
        );
      }
  
      const targetPath =
        isAbsolute(
          requestedPath
        )
          ? resolve(
              requestedPath
            )
          : resolve(
              this.workingDirectory,
              requestedPath
            );
  
      assertPathInsideRoot(
        this.paths.rootDirectory,
        targetPath
      );
  
      return targetPath;
    }
  
    // =========================================================
    // WRITE PREPARATION
    // =========================================================
  
    private async prepareWrite(
      filePath: string,
      overwriteMode:
        WonderCLIOverwriteMode =
        this.config.execution
          .overwriteMode
    ): Promise<PreparedWrite> {
      const targetPath =
        this.resolveSafePath(
          filePath
        );
  
      const targetExists =
        await this.exists(
          targetPath
        );
  
      if (!targetExists) {
        return {
          targetPath,
  
          backupPath: null,
  
          overwritten: false,
        };
      }
  
      if (
        overwriteMode ===
        "never"
      ) {
        throw new Error(
          `WonderCLIFileSystem: file already exists and overwrite mode is "never": "${targetPath}".`
        );
      }
  
      if (
        overwriteMode ===
        "replace"
      ) {
        return {
          targetPath,
  
          backupPath: null,
  
          overwritten: true,
        };
      }
  
      const backupPath =
        createBackupPath(
          targetPath
        );
  
      await mkdir(
        dirname(
          backupPath
        ),
        {
          recursive: true,
        }
      );
  
      await copyFile(
        targetPath,
        backupPath
      );
  
      return {
        targetPath,
  
        backupPath,
  
        overwritten: true,
      };
    }
  }
  
  // =========================================================
  // PATH RESOLUTION
  // =========================================================
  
  function resolveCLIPaths(
    config: WonderCLIConfig,
    workingDirectory: string
  ): WonderCLIResolvedPaths {
    const rootDirectory =
      resolveFromWorkingDirectory(
        workingDirectory,
        config.paths.rootDirectory
      );
  
    const briefsDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.briefsDirectory
      );
  
    const generatedDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.generatedDirectory
      );
  
    const draftsDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.draftsDirectory
      );
  
    const reportsDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.reportsDirectory
      );
  
    const catalogsDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.catalogsDirectory
      );
  
    const promptsDirectory =
      resolveInsideRoot(
        rootDirectory,
        workingDirectory,
        config.paths.promptsDirectory
      );
  
    return {
      rootDirectory,
  
      briefsDirectory,
  
      generatedDirectory,
  
      draftsDirectory,
  
      reportsDirectory,
  
      catalogsDirectory,
  
      promptsDirectory,
  
      briefFile:
        join(
          briefsDirectory,
          config.files.briefFile
        ),
  
      generatedFile:
        join(
          generatedDirectory,
          config.files.generatedFile
        ),
  
      draftFile:
        join(
          draftsDirectory,
          config.files.draftFile
        ),
  
      validationReportFile:
        join(
          reportsDirectory,
          config.files
            .validationReportFile
        ),
  
      catalogFile:
        join(
          catalogsDirectory,
          config.files.catalogFile
        ),
  
      manifestFile:
        join(
          catalogsDirectory,
          config.files.manifestFile
        ),
  
      promptFile:
        join(
          promptsDirectory,
          config.files.promptFile
        ),
    };
  }
  
  function resolveFromWorkingDirectory(
    workingDirectory: string,
    configuredPath: string
  ): string {
    return isAbsolute(
      configuredPath
    )
      ? resolve(
          configuredPath
        )
      : resolve(
          workingDirectory,
          configuredPath
        );
  }
  
  function resolveInsideRoot(
    rootDirectory: string,
    workingDirectory: string,
    configuredPath: string
  ): string {
    const resolvedPath =
      resolveFromWorkingDirectory(
        workingDirectory,
        configuredPath
      );
  
    assertPathInsideRoot(
      rootDirectory,
      resolvedPath
    );
  
    return resolvedPath;
  }
  
  function assertPathInsideRoot(
    rootDirectory: string,
    targetPath: string
  ): void {
    const relativePath =
      relative(
        rootDirectory,
        targetPath
      );
  
    const outsideRoot =
      relativePath === ".." ||
      relativePath.startsWith(
        `..${getPathSeparator(
          relativePath
        )}`
      ) ||
      isAbsolute(
        relativePath
      );
  
    if (outsideRoot) {
      throw new Error(
        `WonderCLIFileSystem: path is outside the configured workspace: "${targetPath}".`
      );
    }
  }
  
  function getPathSeparator(
    pathValue: string
  ): string {
    return pathValue.includes("\\")
      ? "\\"
      : "/";
  }
  
  // =========================================================
  // BACKUPS
  // =========================================================
  
  function createBackupPath(
    targetPath: string
  ): string {
    const extension =
      extname(
        targetPath
      );
  
    const basePath =
      extension.length > 0
        ? targetPath.slice(
            0,
            -extension.length
          )
        : targetPath;
  
    return [
      basePath,
      ".backup-",
      createTimestamp(
        new Date()
      ),
      extension,
    ].join("");
  }
  
  function createTimestamp(
    date: Date
  ): string {
    return [
      date.getFullYear(),
  
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),
  
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      ),
  
      "-",
  
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      ),
  
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      ),
  
      String(
        date.getSeconds()
      ).padStart(
        2,
        "0"
      ),
  
      "-",
  
      String(
        date.getMilliseconds()
      ).padStart(
        3,
        "0"
      ),
    ].join("");
  }
  
  // =========================================================
  // SERIALISATION
  // =========================================================
  
  function serialiseJSON(
    value: unknown,
    prettyPrint: boolean
  ): string {
    const serialised =
      JSON.stringify(
        value,
        createJSONReplacer(),
        prettyPrint
          ? 2
          : undefined
      );
  
    if (
      serialised === undefined
    ) {
      throw new Error(
        "WonderCLIFileSystem: value could not be serialised as JSON."
      );
    }
  
    return `${serialised}\n`;
  }
  
  function createJSONReplacer(): (
    key: string,
    value: unknown
  ) => unknown {
    const seen =
      new WeakSet<object>();
  
    return (
      _key: string,
      value: unknown
    ): unknown => {
      if (
        typeof value ===
          "bigint"
      ) {
        return value.toString();
      }
  
      if (
        typeof value ===
          "object" &&
        value !== null
      ) {
        if (
          seen.has(value)
        ) {
          throw new Error(
            "WonderCLIFileSystem: circular reference detected during JSON serialisation."
          );
        }
  
        seen.add(value);
      }
  
      return value;
    };
  }
  
  function removeByteOrderMark(
    value: string
  ): string {
    return value.replace(
      /^\uFEFF/,
      ""
    );
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function uniquePaths(
    values: readonly string[]
  ): string[] {
    return Array.from(
      new Set(
        values.map(
          (value) =>
            resolve(value)
        )
      )
    );
  }
  
  function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value ===
        "string" &&
      value.trim().length > 0
    );
  }
  
  function getErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }
  
    return String(error);
  }
  
  function assertNever(
    value: never
  ): never {
    throw new Error(
      `WonderCLIFileSystem: unsupported file key "${String(
        value
      )}".`
    );
  }
  
  export default WonderCLIFileSystem;