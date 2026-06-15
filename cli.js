#!/usr/bin/env node
/**
 * query-string-x CLI - Parse, manipulate, and build URL query strings
 *
 * Usage:
 *   query-string parse "foo=bar&baz=qux"
 *   query-string stringify '{ "foo": "bar", "baz": "qux" }'
 *   query-string url "https://example.com/path?foo=bar#section"
 *   query-string merge "foo=bar" '{ "baz": "qux" }'
 *   query-string pick "foo=bar&baz=qux" "foo,baz"
 *   query-string omit "foo=bar&baz=qux" "baz"
 */
import { readFileSync } from 'node:fs';
import { argv, exit } from 'node:process';
import * as qs from './index.js';
function parseJSON(input) {
    try {
        return JSON.parse(input);
    }
    catch {
        // Try parsing as query string if JSON fails
        return qs.parse(input);
    }
}
function handleError(error, message) {
    console.error(`Error: ${message}`);
    if (error instanceof Error) {
        console.error(`Details: ${error.message}`);
    }
    exit(1);
}
function showHelp() {
    console.log(`
query-string-x - Zero-dep URL query string parser and manipulator

Usage:
  query-string <command> [options] [input]

Commands:
  parse       Parse query string to JSON
  stringify   Convert object to query string
  url         Parse URL into components
  build       Build URL from components
  merge       Merge two query strings/objects
  pick        Pick specific keys from query
  omit        Omit specific keys from query
  get         Get value from nested object
  set         Set value in nested object
  info        Show library information

Options:
  --array-format      Array format: brackets, repeat, comma (default: brackets)
  --array-separator   Array separator for comma format (default: ',')
  --encode            URL encode values (default: true)
  --decode            URL decode values (default: true)
  --strict-null       Include null values as empty strings
  --plus-space        Encode space as + instead of %20
  --rfc3986           Use RFC 3986 encoding
  --strict-numbers    Parse only numbers that look like numbers
  --strict-booleans   Parse only explicit boolean values
  --sort              Sort keys alphabetically
  --url               Add ? prefix for URLs
  --omit-nulls        Omit null/undefined values
  --input-file        Read input from file
  --output-file       Write output to file
  --pretty            Pretty print JSON output
  --color             Enable color output

Examples:
  query-string parse "foo=bar&baz=qux"
  query-string stringify '{ "foo": "bar", "baz": "qux" }'
  query-string url "https://example.com/path?foo=bar#section"
  query-string build "/path" '{ "foo": "bar" }' "section"
  query-string merge "foo=bar" '{ "baz": "qux" }'
  query-string pick "foo=bar&baz=qux" "foo,baz"
  query-string omit "foo=bar&baz=qux" "baz"
  query-string get '{ "user": { "name": "John" } }' "user.name"
  query-string set '{ "user": {} }' "user.name" "John"
  query-string parse --input-file query.txt --pretty
  query-string stringify --input-file data.json --url --sort
`);
    exit(0);
}
function showVersion() {
    console.log('query-string-x v1.0.0');
    exit(0);
}
function parseCLIOptions(args) {
    const options = {};
    const rest = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            switch (key) {
                case 'array-format':
                    options.arrayFormat = value;
                    break;
                case 'array-separator':
                    options.arraySeparator = value;
                    break;
                case 'encode':
                    options.encode = value === 'false' ? false : true;
                    break;
                case 'decode':
                    options.decode = value === 'false' ? false : true;
                    break;
                case 'strict-null':
                    options.strictNull = value === 'true';
                    break;
                case 'plus-space':
                    options.plusSpace = value === 'true';
                    break;
                case 'rfc3986':
                    options.rfc3986 = value === 'true';
                    break;
                case 'strict-numbers':
                    options.strictNumbers = value === 'true';
                    break;
                case 'strict-booleans':
                    options.strictBooleans = value === 'true';
                    break;
                case 'sort':
                    options.sort = value === 'true';
                    break;
                case 'url':
                    options.url = value === 'true';
                    break;
                case 'omit-nulls':
                    options.omitNulls = value === 'true';
                    break;
                default:
                    rest.push(arg);
            }
        }
        else {
            rest.push(arg);
        }
    }
    return { options, rest };
}
function getInputFromArgs(args, options) {
    if (options.inputFile) {
        try {
            return readFileSync(options.inputFile, 'utf8');
        }
        catch (error) {
            handleError(error, `Failed to read input file: ${options.inputFile}`);
        }
    }
    if (args.length === 0) {
        handleError(new Error(), 'No input provided');
    }
    return args.join(' ');
}
function writeOutput(output, options) {
    const jsonOptions = options.pretty ? { space: 2 } : {};
    if (options.color) {
        jsonOptions.colors = true;
    }
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output, jsonOptions);
    if (options.outputFile) {
        try {
            require('node:fs').writeFileSync(options.outputFile, outputStr + '\n');
        }
        catch (error) {
            handleError(error, `Failed to write output file: ${options.outputFile}`);
        }
    }
    else {
        console.log(outputStr);
    }
}
function main() {
    const command = argv[2];
    if (!command || command === 'help') {
        showHelp();
    }
    if (command === 'version' || command === '--version' || command === '-v') {
        showVersion();
    }
    try {
        const { options, rest } = parseCLIOptions(argv.slice(3));
        const inputFile = options.inputFile || rest.find(arg => arg.startsWith('--input-file='));
        const outputFile = options.outputFile || rest.find(arg => arg.startsWith('--output-file='));
        const pretty = options.pretty || rest.includes('--pretty');
        const color = options.color || rest.includes('--color');
        const fileOptions = {
            inputFile: inputFile ? inputFile.replace('--input-file=', '') : undefined,
            outputFile: outputFile ? outputFile.replace('--output-file=', '') : undefined
        };
        const cleanArgs = rest.filter(arg => !arg.startsWith('--input-file=') &&
            !arg.startsWith('--output-file=') &&
            arg !== '--pretty' &&
            arg !== '--color');
        const input = getInputFromArgs(cleanArgs, fileOptions);
        switch (command) {
            case 'parse': {
                const result = qs.parse(input, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'stringify': {
                const obj = parseJSON(input);
                const result = qs.stringify(obj, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'url': {
                const result = qs.parseUrl(input, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'build': {
                if (cleanArgs.length < 2) {
                    handleError(new Error(), 'build command requires pathname and query/object');
                }
                const pathname = cleanArgs[0];
                const queryObj = parseJSON(cleanArgs[1]);
                const hash = cleanArgs[2] || undefined;
                const result = qs.buildUrl(pathname, queryObj, hash, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'merge': {
                if (cleanArgs.length < 2) {
                    handleError(new Error(), 'merge command requires two query strings/objects');
                }
                const target = parseJSON(cleanArgs[0]);
                const source = parseJSON(cleanArgs[1]);
                const result = qs.merge(target, source, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'pick': {
                if (cleanArgs.length < 2) {
                    handleError(new Error(), 'pick command requires query string and keys');
                }
                const query = cleanArgs[0];
                const keys = cleanArgs[1].split(',');
                const result = qs.pick(query, keys, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'omit': {
                if (cleanArgs.length < 2) {
                    handleError(new Error(), 'omit command requires query string and keys');
                }
                const query = cleanArgs[0];
                const keys = cleanArgs[1].split(',');
                const result = qs.omit(query, keys, options);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'get': {
                if (cleanArgs.length < 2) {
                    handleError(new Error(), 'get command requires object and path');
                }
                const obj = parseJSON(cleanArgs[0]);
                const path = cleanArgs[1];
                const defaultValue = cleanArgs[2] ? parseJSON(cleanArgs[2]) : undefined;
                const result = qs.get(obj, path, defaultValue);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'set': {
                if (cleanArgs.length < 3) {
                    handleError(new Error(), 'set command requires object, path, and value');
                }
                const obj = parseJSON(cleanArgs[0]);
                const path = cleanArgs[1];
                const value = parseJSON(cleanArgs[2]);
                const result = qs.set(obj, path, value);
                writeOutput(result, { ...fileOptions, pretty, color });
                break;
            }
            case 'info': {
                const info = {
                    name: 'query-string-x',
                    version: '1.0.0',
                    description: 'Zero-dep URL query string parser and manipulator',
                    features: [
                        'Parse and stringify query strings',
                        'Nested object support with dot notation',
                        'Array formatting (brackets, repeat, comma)',
                        'Type inference (numbers, booleans, dates)',
                        'URL parsing and building',
                        'Query manipulation (merge, pick, omit)',
                        'Nested object access (get, set)',
                        'Custom encoding/decoding',
                        'Zero dependencies'
                    ],
                    author: 'Sulthonzh'
                };
                writeOutput(info, { ...fileOptions, pretty, color });
                break;
            }
            default:
                handleError(new Error(`Unknown command: ${command}`), 'Use "query-string help" for usage');
        }
    }
    catch (error) {
        handleError(error, 'Command failed');
    }
}
// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { main };
