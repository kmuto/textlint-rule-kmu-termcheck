import TextLintTester from "textlint-tester";
import rule from "../src/index";

const tester = new TextLintTester();
// ruleName, rule, { valid, invalid }
tester.run("rule", rule, {
    valid: [
        // no problem
        {
            text: "Twitter、Instagramを使い、LinkedInに登録しましょう",
        },
        {
            text: "Twitterd",
            options: {
                allows: ["Twitterd"]
            }
        }
    ],
    invalid: [
        // single match
        {
            text: "ここでTwtterを使いましょう。",
            errors: [
                {
                    message: "名称 Twtter -> Twitter",
                    range: [3, 9]
                }
            ]
        },
        // multiple match
        {
            text: `twittter、Instagarmを使い、linkedInに登録しましょう`,
            errors: [
                {
                    message: "名称 twittter -> Twitter",
                    range: [0, 8]
                },
                {
                    message: "名称 Instagarm -> Instagram",
                    range: [9, 18]
                },
                {
                    message: "名称 linkedIn -> LinkedIn",
                    range: [22, 30]
                }
            ]
        },

    ]
});
