# @kmuto/textlint-rule-kmu-termcheck

textlint rules to detect typos, such as service names.

[README in Japanese](README_ja.md) for details.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @kmuto/textlint-rule-kmu-termcheck

## Usage

Via `.textlintrc.json`(Recommended)

```json
{
    "rules": {
        "@kmuto/kmu-termcheck": true
    }
}
```

Via CLI

```
textlint --rule @kmuto/kmu-termcheck README.md
```

You can specify some options.

- `allows: ["word1", "word2", ...]`: Specify words that are allowed even if they are recognized as errors.
- `userDic: ["file1", "file2", ...]`: Specify additional dictionary files. The dictionary file consists of one line per word, separated by newlines, and lines beginning with `#` are ignored.
- `commonDic: true|false`: Control common dictionary loading. (default: true)
- `hatenaDic: true|false`: Control hatena dictionary loading. (default: true)
- `awsDic: true|false`: Control aws dictionary loading. (default: true)
- `compoundMode: true|false`: Control word compound mode. (default: true)
- `ignoreFirstCapital: true|false`: Control of ignoring leading capitalization. (default: true)

### Build

Builds source codes for publish to the `lib` folder.
You can write ES2015+ source codes in `src/` folder.

    npm run build

### Tests

Run test code in `test` folder.
Test textlint rule by [textlint-tester](https://github.com/textlint/textlint-tester).

    npm test

## License

```
MIT License

Copyright (c) 2023 Kenshi Muto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
