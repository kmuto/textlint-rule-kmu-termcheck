import type { TextlintRuleError, TextlintRuleModule } from "@textlint/types";
import didYouMean from "didyoumean";
import { tokenize } from "kuromojin";
import path from "path";
import fs from "fs";

const defaultOptions = {
    allows: [],
    userDic: [],
    commonDic: true,
    hatenaDic: true,
    awsDic: true,
    compoundMode: true
}
export interface Options {
    // If token match allowed text exactly, does not report.
    allows?: string[];
    // user's dictionary path
    userDic?: string[];
    // system dic
    commonDic?: boolean;
    hatenaDic?: boolean;
    awsDic?: boolean;
    compoundMode?: boolean;
}

const loadDictionaries = (pathes: string[]): string[] => {
    const terms: string[] = [];
    pathes.forEach(path => {
        if (!fs.existsSync(path)) return;
        try {
            const content = fs.readFileSync(path, { encoding: "utf8"});
            if (content) {
                content.split("\n").forEach(line => {
                    if (line.match(/^\#/) || line === "") return;
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

const report: TextlintRuleModule<Options> = (context, options = {}) => {
    const { Syntax, RuleError, report, getSource, locator } = context;
    // add EC2 to avoid misrecognized
    const allows = (options.allows ?? defaultOptions.allows).
        concat(["Amazon EC2"]).
        map(w => w.replace(/ /g, "÷"));
    const dictFiles: string[] = [];
    if (resultTF(options.commonDic, defaultOptions.commonDic)) dictFiles.push(path.join(__dirname, "..", "dict", "common.txt"));
    if (resultTF(options.hatenaDic, defaultOptions.hatenaDic)) dictFiles.push(path.join(__dirname, "..", "dict", "hatena.txt"));
    if (resultTF(options.awsDic, defaultOptions.awsDic)) dictFiles.push(path.join(__dirname, "..", "dict", "aws.txt"));
    const userDics = options.userDic ?? [];
    userDics.forEach(file => {
        dictFiles.push(file);
    });
    const termDictionary = loadDictionaries(dictFiles);

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
                    if (token.surface_form.match(/^[\x21-\x7e\xf7]+$/) && !allows.includes(token.surface_form)) {
                        // check ascii term only
                        const candidate = didYouMean(token.surface_form, termDictionary);
                        if (candidate && candidate !== token.surface_form) {
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
                                if (subcandidate && subcandidate !== subtoken) {
                                    // FIXME: index
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
