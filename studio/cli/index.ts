#!/usr/bin/env node

import {
    readFile,
  } from "node:fs/promises";
  
  import {
    resolve,
  } from "node:path";
  
  import {
    createWonderCLIConfig,
    parseWonderCLIConfig,
  } from "./WonderCLIConfig";
  
  import type {
    WonderCLICommand,
    WonderCLIConfig,
  } from "./WonderCLIConfig";
  
  import {
    WonderCLIReporter,
  } from "./WonderCLIReporter";
  
  import {
    WonderStudioCLI,
  } from "./WonderStudioCLI";
  
  import type {
    WonderStudioCLIResult,
  } from "./WonderStudioCLI";
  
  export const WONDER_OS_CLI_VERSION =
    "0.1.0";
  
  export interface WonderCLIArguments {
    command: WonderCLICommand;
  
    configPath: string | null;
  
    workingDirectory: string;
  
    verbose: boolean | null;
  
    quiet: boolean;
  
    useColours: boolean;
  
    help: boolean;
  
    version: boolean;
  }
  
  export interface WonderCLIRunResult {
    exitCode: number;
  
    result:
      | WonderStudioCLIResult
      | null;
  
    error: Error | null;
  }
  
  // =========================================================
  // ENTRY POINT
  // =========================================================
  
  async function main(): Promise<void> {
    const runResult =
      await runWonderStudioCLI(
        process.argv.slice(2)
      );
  
    process.exitCode =
      runResult.exitCode;
  }
  
  /**
   * Runs WonderOS CLI using raw terminal arguments.
   *
   * This function is exported so the CLI can also be tested
   * without spawning another Node.js process.
   */
  export async function runWonderStudioCLI(
    rawArguments: readonly string[],
    currentWorkingDirectory =
      process.cwd()
  ): Promise<WonderCLIRunResult> {
    try {
      const argumentsResult =
        parseCLIArguments(
          rawArguments,
          currentWorkingDirectory
        );
  
      if (argumentsResult.help) {
        printHelp();
  
        return {
          exitCode: 0,
  
          result: null,
  
          error: null,
        };
      }
  
      if (argumentsResult.version) {
        console.log(
          `WonderOS CLI ${WONDER_OS_CLI_VERSION}`
        );
  
        return {
          exitCode: 0,
  
          result: null,
  
          error: null,
        };
      }
  
      const config =
        await loadCLIConfig(
          argumentsResult
        );
  
      const reporter =
        new WonderCLIReporter({
          verbose:
            config.execution.verbose,
  
          useColours:
            argumentsResult.useColours,
  
          showTimestamp: false,
  
          showDetails: true,
  
          silent:
            argumentsResult.quiet,
        });
  
      const cli =
        new WonderStudioCLI(
          config,
          argumentsResult
            .workingDirectory,
          undefined,
          reporter
        );
  
      const result =
        await cli.run(
          argumentsResult.command
        );
  
      return {
        exitCode:
          result.success
            ? 0
            : 1,
  
        result,
  
        error: null,
      };
    } catch (error) {
      const resolvedError =
        toError(error);
  
      console.error(
        `WonderOS CLI Error: ${resolvedError.message}`
      );
  
      return {
        exitCode: 1,
  
        result: null,
  
        error:
          resolvedError,
      };
    }
  }
  
  // =========================================================
  // ARGUMENT PARSING
  // =========================================================
  
  export function parseCLIArguments(
    rawArguments: readonly string[],
    currentWorkingDirectory =
      process.cwd()
  ): WonderCLIArguments {
    let command: WonderCLICommand =
      "pipeline";
  
    let commandWasSet =
      false;
  
    let configPath:
      | string
      | null = null;
  
    let workingDirectory =
      resolve(
        currentWorkingDirectory
      );
  
    let verbose:
      | boolean
      | null = null;
  
    let quiet = false;
  
    let useColours = true;
  
    let help = false;
  
    let version = false;
  
    for (
      let index = 0;
      index < rawArguments.length;
      index += 1
    ) {
      const argument =
        rawArguments[index];
  
      if (
        argument === "--help" ||
        argument === "-h"
      ) {
        help = true;
  
        continue;
      }
  
      if (
        argument === "--version" ||
        argument === "-V"
      ) {
        version = true;
  
        continue;
      }
  
      if (
        argument === "--verbose" ||
        argument === "-v"
      ) {
        verbose = true;
  
        continue;
      }
  
      if (
        argument === "--quiet" ||
        argument === "-q"
      ) {
        quiet = true;
  
        continue;
      }
  
      if (
        argument === "--no-colour" ||
        argument === "--no-color"
      ) {
        useColours = false;
  
        continue;
      }
  
      if (
        argument === "--colour" ||
        argument === "--color"
      ) {
        useColours = true;
  
        continue;
      }
  
      if (
        argument === "--config" ||
        argument === "-c"
      ) {
        const value =
          readNextArgument(
            rawArguments,
            index,
            argument
          );
  
        configPath =
          resolve(
            currentWorkingDirectory,
            value
          );
  
        index += 1;
  
        continue;
      }
  
      if (
        argument.startsWith(
          "--config="
        )
      ) {
        const value =
          argument.slice(
            "--config=".length
          );
  
        assertNonEmptyArgument(
          value,
          "--config"
        );
  
        configPath =
          resolve(
            currentWorkingDirectory,
            value
          );
  
        continue;
      }
  
      if (
        argument === "--cwd"
      ) {
        const value =
          readNextArgument(
            rawArguments,
            index,
            argument
          );
  
        workingDirectory =
          resolve(
            currentWorkingDirectory,
            value
          );
  
        index += 1;
  
        continue;
      }
  
      if (
        argument.startsWith(
          "--cwd="
        )
      ) {
        const value =
          argument.slice(
            "--cwd=".length
          );
  
        assertNonEmptyArgument(
          value,
          "--cwd"
        );
  
        workingDirectory =
          resolve(
            currentWorkingDirectory,
            value
          );
  
        continue;
      }
  
      if (
        argument === "--command"
      ) {
        const value =
          readNextArgument(
            rawArguments,
            index,
            argument
          );
  
        command =
          parseCommand(value);
  
        commandWasSet = true;
  
        index += 1;
  
        continue;
      }
  
      if (
        argument.startsWith(
          "--command="
        )
      ) {
        const value =
          argument.slice(
            "--command=".length
          );
  
        command =
          parseCommand(value);
  
        commandWasSet = true;
  
        continue;
      }
  
      if (
        argument.startsWith("-")
      ) {
        throw new Error(
          `Unknown CLI option "${argument}".`
        );
      }
  
      if (commandWasSet) {
        throw new Error(
          `Unexpected argument "${argument}". Only one command may be supplied.`
        );
      }
  
      command =
        parseCommand(argument);
  
      commandWasSet = true;
    }
  
    if (
      quiet &&
      verbose === true
    ) {
      throw new Error(
        'Options "--quiet" and "--verbose" cannot be used together.'
      );
    }
  
    return {
      command,
  
      configPath,
  
      workingDirectory,
  
      verbose,
  
      quiet,
  
      useColours,
  
      help,
  
      version,
    };
  }
  
  // =========================================================
  // CONFIG LOADING
  // =========================================================
  
  async function loadCLIConfig(
    argumentsResult: WonderCLIArguments
  ): Promise<WonderCLIConfig> {
    const loadedConfig =
      argumentsResult.configPath
        ? await readConfigFile(
            argumentsResult.configPath
          )
        : createWonderCLIConfig();
  
    return createWonderCLIConfig({
      version:
        loadedConfig.version,
  
      paths: {
        ...loadedConfig.paths,
      },
  
      files: {
        ...loadedConfig.files,
      },
  
      quality: {
        ...loadedConfig.quality,
      },
  
      publish: {
        ...loadedConfig.publish,
      },
  
      execution: {
        ...loadedConfig.execution,
  
        command:
          argumentsResult.command,
  
        verbose:
          argumentsResult.verbose ??
          (
            argumentsResult.quiet
              ? false
              : loadedConfig.execution
                  .verbose
          ),
      },
    });
  }
  
  async function readConfigFile(
    configPath: string
  ): Promise<WonderCLIConfig> {
    let fileContent: string;
  
    try {
      fileContent =
        await readFile(
          configPath,
          {
            encoding: "utf8",
          }
        );
    } catch (error) {
      throw new Error(
        [
          `Could not read WonderOS CLI config "${configPath}".`,
          getErrorMessage(error),
        ].join(" ")
      );
    }
  
    let parsedValue: unknown;
  
    try {
      parsedValue =
        JSON.parse(
          removeByteOrderMark(
            fileContent
          )
        );
    } catch (error) {
      throw new Error(
        [
          `WonderOS CLI config contains invalid JSON: "${configPath}".`,
          getErrorMessage(error),
        ].join(" ")
      );
    }
  
    return parseWonderCLIConfig(
      parsedValue
    );
  }
  
  // =========================================================
  // COMMAND PARSING
  // =========================================================
  
  function parseCommand(
    value: string
  ): WonderCLICommand {
    const normalisedValue =
      value
        .trim()
        .toLowerCase();
  
    if (
      isCLICommand(
        normalisedValue
      )
    ) {
      return normalisedValue;
    }
  
    throw new Error(
      [
        `Unknown WonderOS command "${value}".`,
        'Supported commands are "prompt", "validate", "publish", and "pipeline".',
      ].join(" ")
    );
  }
  
  function isCLICommand(
    value: string
  ): value is WonderCLICommand {
    return (
      value === "prompt" ||
      value === "validate" ||
      value === "publish" ||
      value === "pipeline"
    );
  }
  
  // =========================================================
  // HELP
  // =========================================================
  
  function printHelp(): void {
    console.log(
      [
        "",
        "WonderOS CLI",
        "",
        "Educational content production pipeline for Wonder Studio.",
        "",
        "USAGE",
        "",
        "  npx tsx studio/cli/index.ts <command> [options]",
        "",
        "COMMANDS",
        "",
        "  prompt",
        "    Read the content brief and create AI prompt files.",
        "",
        "  validate",
        "    Ingest or load drafts, validate content, and create a report.",
        "",
        "  publish",
        "    Import approved drafts and publish the runtime catalog.",
        "",
        "  pipeline",
        "    Run ingestion, validation, approval, import, publication, and export.",
        "",
        "OPTIONS",
        "",
        "  -c, --config <path>",
        "    Load a WonderOS CLI JSON configuration file.",
        "",
        "  --cwd <path>",
        "    Set the working directory used by the CLI.",
        "",
        "  -v, --verbose",
        "    Enable verbose reporting.",
        "",
        "  -q, --quiet",
        "    Suppress normal terminal reporting.",
        "",
        "  --no-colour",
        "    Disable ANSI terminal colours.",
        "",
        "  -h, --help",
        "    Display this help message.",
        "",
        "  -V, --version",
        "    Display the WonderOS CLI version.",
        "",
        "EXAMPLES",
        "",
        "  npx tsx studio/cli/index.ts prompt",
        "",
        "  npx tsx studio/cli/index.ts validate",
        "",
        "  npx tsx studio/cli/index.ts publish",
        "",
        "  npx tsx studio/cli/index.ts pipeline",
        "",
        "  npx tsx studio/cli/index.ts pipeline --config wonder-cli.config.json",
        "",
        "  npx tsx studio/cli/index.ts prompt --cwd C:\\Projects\\WonderLabs",
        "",
        "EXPECTED WORKSPACE",
        "",
        "  wonder-studio/",
        "  ├── briefs/content-brief.json",
        "  ├── generated/generated-content.json",
        "  ├── drafts/studio-batch.json",
        "  ├── reports/",
        "  ├── catalogs/",
        "  └── prompts/",
        "",
      ].join("\n")
    );
  }
  
  // =========================================================
  // ARGUMENT HELPERS
  // =========================================================
  
  function readNextArgument(
    argumentsList: readonly string[],
    currentIndex: number,
    optionName: string
  ): string {
    const value =
      argumentsList[
        currentIndex + 1
      ];
  
    if (
      value === undefined ||
      value.startsWith("-")
    ) {
      throw new Error(
        `Option "${optionName}" requires a value.`
      );
    }
  
    assertNonEmptyArgument(
      value,
      optionName
    );
  
    return value;
  }
  
  function assertNonEmptyArgument(
    value: string,
    optionName: string
  ): void {
    if (
      value.trim().length === 0
    ) {
      throw new Error(
        `Option "${optionName}" requires a non-empty value.`
      );
    }
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function removeByteOrderMark(
    value: string
  ): string {
    return value.replace(
      /^\uFEFF/,
      ""
    );
  }
  
  function toError(
    error: unknown
  ): Error {
    if (
      error instanceof Error
    ) {
      return error;
    }
  
    return new Error(
      String(error)
    );
  }
  
  function getErrorMessage(
    error: unknown
  ): string {
    return toError(
      error
    ).message;
  }
  
  // =========================================================
  // EXECUTION
  // =========================================================
  
  const isDirectExecution =
    typeof process !== "undefined" &&
    process.argv[1] !== undefined &&
    (
      process.argv[1].endsWith(
        "studio/cli/index.ts"
      ) ||
      process.argv[1].endsWith(
        "studio\\cli\\index.ts"
      ) ||
      process.argv[1].endsWith(
        "studio/cli/index.js"
      ) ||
      process.argv[1].endsWith(
        "studio\\cli\\index.js"
      )
    );
  
  if (isDirectExecution) {
    void main();
  }
  
  export {
    WonderStudioCLI,
  } from "./WonderStudioCLI";
  
  export {
    WonderCLIFileSystem,
  } from "./WonderCLIFileSystem";
  
  export {
    WonderCLIReporter,
  } from "./WonderCLIReporter";
  
  export {
    createWonderCLIConfig,
    parseWonderCLIConfig,
  } from "./WonderCLIConfig";
  
  export type {
    WonderCLICommand,
    WonderCLIConfig,
    WonderCLIConfigOverrides,
    WonderCLIExecutionConfig,
    WonderCLIExportFormat,
    WonderCLIFileConfig,
    WonderCLIOverwriteMode,
    WonderCLIPathConfig,
    WonderCLIPublishConfig,
    WonderCLIQualityConfig,
  } from "./WonderCLIConfig";
  
  export type {
    WonderCLICommandResult,
    WonderCLIInitialiseResult,
    WonderCLIPipelineCommandResult,
    WonderCLIPromptCommandResult,
    WonderCLIPublishCommandResult,
    WonderCLIValidateCommandResult,
    WonderStudioCLIResult,
  } from "./WonderStudioCLI";
  
  export type {
    WonderCLIFileKey,
    WonderCLIJSONWriteOptions,
    WonderCLIReadResult,
    WonderCLIResolvedPaths,
    WonderCLIWorkspaceResult,
    WonderCLIWriteOptions,
    WonderCLIWriteResult,
  } from "./WonderCLIFileSystem";
  
  export type {
    WonderCLICommandSummary,
    WonderCLIDraftValidationReport,
    WonderCLIImportReport,
    WonderCLIPipelineReport,
    WonderCLIPublishReport,
    WonderCLIReportEntry,
    WonderCLIReporterOptions,
    WonderCLIValidationReport,
  } from "./WonderCLIReporter";