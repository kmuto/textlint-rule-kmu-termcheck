import type { TextlintRuleError, TextlintRuleModule } from "@textlint/types";
import didYouMean from "didyoumean";
import { tokenize } from "kuromojin";
import path from "path";
import fs from "fs";

export interface Options {
    // If token match allowed text exactly, does not report.
    allows?: string[];
    // user dictionary
    dic?: string[];
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
                    terms.push(line);
                })
            } 
        } catch(err) {
            console.error(err);
        }
    });
    return [...new Set(terms.sort())];
}

const report: TextlintRuleModule<Options> = (context, options = {}) => {
    const { Syntax, RuleError, report, getSource, locator } = context;
    const allows = options.allows ?? [];
    const dictFiles: string[] = [
        path.join(__dirname, "..", "dict", "common.txt"),
        path.join(__dirname, "..", "dict", "hatena.txt"),
        path.join(__dirname, "..", "dict", "aws.txt")
    ];
    const userDics = options.dic ?? [];
    userDics.forEach(file => {
        dictFiles.push(file);
    });
    const termDictionary = loadDictionaries(dictFiles);

    return {
        [Syntax.Str](node) { // "Str" node
            const text = getSource(node); // Get text
  
            if (allows.some(allow => text.includes(allow))) {
                return;
            }

            const results: TextlintRuleError[] = [];

            return tokenize(text).then(tokens => {
                tokens.forEach(token => {
                    if (token.surface_form.match(/^[\x21-\x7e]+$/) && !allows.includes(token.surface_form)) {
                        // check ascii term only
                        const candidate = didYouMean(token.surface_form, termDictionary);
                        if (candidate && candidate !== token.surface_form) {
                            const index = (token.word_position - 1) ?? 0;
                            const matchRange = [index, index + token.surface_form.length] as const;

                            const ruleError = new RuleError(`Name: ${token.surface_form} -> ${candidate}`, {
                                padding: locator.range(matchRange)
                            });
                            results.push(ruleError);
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
