import type { TextlintRuleError, TextlintRuleModule } from "@textlint/types";
import didYouMean from "didyoumean";
import { tokenize } from "kuromojin";
import path from "path";
import fs from "fs";

// FIXME: how I can avoid URL including small letters?
const implicitOK = ["Amazon EC2", "github"];

const defaultOptions = {
    allows: [],
    userDic: [],
    commonDic: true,
    hatenaDic: true,
    awsDic: true,
    googlecloudDic: true,
    compoundMode: true,
    ignoreFirstCapital: true
}
export interface Options {
    // If a token matches allowed text exactly, don't report.
    allows?: string[];
    // user's dictionary path
    userDic?: string[];
    // system dics
    commonDic?: boolean;
    hatenaDic?: boolean;
    awsDic?: boolean;
    googlecloudDic?: boolean;
    compoundMode?: boolean;
    ignoreFirstCapital?: boolean;
}

const loadDictionaries = (pathes: string[]): string[] => {
    const terms: string[] = [];
    pathes.forEach(path => {
        if (!fs.existsSync(path)) return;
        try {
            const content = fs.readFileSync(path, { encoding: "utf8"});
            if (content) {
                content.split("\n").forEach(line => {
                    if (line.startsWith("#") || line === "") return;
                    terms.push(line.replace(/ /g, "÷")); // replace space with ÷, \xf7. This character will be treated as English alphabet, nice!
                })
            }
        } catch(err) {
            console.error(err);
        }
    });
    return [...new Set(terms.sort())];
}

const resultTF = (optionVal: boolean | undefined, defaultVal: boolean): boolean => {
    if (optionVal == undefined) {
        return defaultVal;
    }
    return optionVal;
};

const firstLower = (s: string): string => {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

const isTypo = (candidate: string | string[], tokenform: string, ignoreFirstCapital: boolean): boolean => {
    if (!candidate) return false;
    const candidateString = candidate.toString();
    if (candidateString === tokenform) return false;
    if (ignoreFirstCapital && (firstLower(candidateString) === firstLower(tokenform))) return false;
    return true;
};

const report: TextlintRuleModule<Options> = (context, options = {}) => {
    const { Syntax, RuleError, report, getSource, locator } = context;
    const allows = (options.allows ?? defaultOptions.allows).
        concat(implicitOK).
        map(w => w.replace(/ /g, "÷"));
    const dictFiles: string[] = [];
    if (resultTF(options.commonDic, defaultOptions.commonDic)) dictFiles.push(path.join(__dirname, "..", "dict", "common.txt"));
    if (resultTF(options.hatenaDic, defaultOptions.hatenaDic)) dictFiles.push(path.join(__dirname, "..", "dict", "hatena.txt"));
    if (resultTF(options.awsDic, defaultOptions.awsDic)) dictFiles.push(path.join(__dirname, "..", "dict", "aws.txt"));
    if (resultTF(options.googlecloudDic, defaultOptions.googlecloudDic)) dictFiles.push(path.join(__dirname, "..", "dict", "googlecloud.txt"));
    const userDics = options.userDic ?? [];
    userDics.forEach(file => {
        dictFiles.push(file);
    });
    const termDictionary = loadDictionaries(dictFiles);
    const ignoreFirstCapital = options.ignoreFirstCapital ?? defaultOptions.ignoreFirstCapital;

    // FIXME: refactoring, refactoring, refactoring.
    return {
        [Syntax.Str](node) { // "Str" node
            const _text = getSource(node); // Get text
            const text = resultTF(options.compoundMode, defaultOptions.compoundMode) ? _text.replace(/([a-z]) ([a-z])/gi, "$1÷$2") : _text;

            if (allows.some(allow => text.includes(allow))) {
                return;
            }

            const results: TextlintRuleError[] = [];

            return tokenize(text).then(tokens => {
                tokens.forEach(token => {
                    // \x7f is ÷
                    if (token.surface_form.match(/^[\x21-\x7e\xf7]+$/) && !allows.includes(token.surface_form)) {
                        // check ascii term only
                        const candidate = didYouMean(token.surface_form, termDictionary);
                        // FIXME: candidate may return string[]
                        if (isTypo(candidate, token.surface_form, ignoreFirstCapital)) {
                            const index = (token.word_position - 1) ?? 0;
                            const matchRange = [index, index + token.surface_form.length] as const;

                            const ruleError = new RuleError(`Name: ${token.surface_form.replace(/÷/g, " ")} -> ${candidate.toString().replace(/÷/g, " ")}`, {
                                padding: locator.range(matchRange)
                            });
                            results.push(ruleError);
                        } else if (token.surface_form.match("÷")) {
                            // split and try checking also
                            token.surface_form.split("÷").forEach(subtoken => {
                                const subcandidate = didYouMean(subtoken, termDictionary);
                                if (isTypo(subcandidate, subtoken, ignoreFirstCapital)) {
                                    // FIXME: index is not correct
                                    const index = (token.word_position - 1) ?? 0;
                                    const matchRange = [index, index + token.surface_form.length] as const;
                                    const ruleError = new RuleError(`Name: ${subtoken.replace(/÷/g, " ")} -> ${subcandidate.toString().replace(/÷/g, " ")}`, {
                                        padding: locator.range(matchRange)
                                    });
                                    results.push(ruleError);
                                }
                            });
                        }
                    }
                });
            }).then(() => {
                results.forEach(error => {
                    report(node, error);
                })
            });
        }
    }
};

export default report;
