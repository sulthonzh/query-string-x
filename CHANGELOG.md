# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-07-08

### Fixed
- `plusSpace` option now actually controls space encoding (`+` vs `%20`) instead of being ignored
- `rfc3986` option now percent-encodes RFC 3986 reserved characters (`!*'()`) when enabled
- `strictNull` option in `stringify()` now renders null as empty string (`key=`) when enabled, instead of being ignored
- `parse()` now strips leading `?` from input strings (was creating phantom `?foo` keys)
- `parseUrl()` with `noSearch` no longer incorrectly strips the hash fragment
- `defaultEncode` and `defaultDecode` now accept parameters instead of using hardcoded behavior

### Added
- 30 edge-case tests (57 → 87): leading `?` stripping, plusSpace variants, rfc3986 encoding, strictNull behavior, noSearch/noHash combinations, merge strategies, get/set edge cases, custom encode/decode functions, encoded brackets, repeat format, sort option, buildUrl with hash, pick/omit edge cases
- STATUS.md with full exceptional checklist audit
- CHANGELOG.md

## [1.0.0] - 2026-07-05

### Added
- Initial release
- `parse()` — query string to object with type inference (numbers, booleans, dates)
- `stringify()` — object to query string with encoding
- `parseUrl()` — full URL parser with pathname, query, hash, search
- `buildUrl()` — URL builder from components
- `merge()` — merge query strings/objects with array strategies
- `pick()` / `omit()` — select/exclude keys
- `get()` / `set()` — nested dot-notation access
- CLI tool for command-line query string manipulation
- Zero runtime dependencies
