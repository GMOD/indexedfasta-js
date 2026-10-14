# Contributing

## Development

```sh
pnpm install
pnpm test
pnpm build
```

```sh
pnpm version patch  # or minor/major
```

`pnpm version` runs lint, format, types, tests and build, regenerates
CHANGELOG.md with git-cliff, then pushes the tag, which triggers the publish
workflow.

[docs/api.md](docs/api.md) is written by hand, and `test/apiDocs.test.ts` fails
when a public member of `IndexedFasta`, `BgzipIndexedFasta`,
`FetchableSmallFasta`, or an export, is missing from it. Document the new
member, or add it to the test's `undocumented` list with the reason it is
internal.

## Publishing

GitHub Actions publishes each release to npm with trusted publishing (OIDC, no
stored token). The workflow requires `--provenance` and `id-token: write`
permissions.

indexedfasta-js is already configured for trusted publishing. To set up a new
package, run `npm trust github <pkg> --file publish.yml --repo GMOD/<repo>`
(requires npm >=11.10.0 and 2FA).

Once npm publish succeeds, the `release` job creates the GitHub release for the
tag, taking its notes from that version's CHANGELOG.md section.
`scripts/release-notes.sh` extracts the section, so run the script with a
version to preview a release's notes.
