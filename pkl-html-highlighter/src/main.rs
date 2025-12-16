// ===----------------------------------------------------------------------===//
// Copyright © 2024-2025 Apple Inc. and the Pkl project authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===----------------------------------------------------------------------===//

use clap::Parser;
use std::io;
use std::io::Read;
use tree_sitter_highlight::{HighlightConfiguration, Highlighter, HtmlRenderer};
use tree_sitter_pkl;

const QUERIES: &str = include_str!("../queries/highlights.scm");

#[derive(Parser)]
struct CliArgs {
    /// Highlight as a Pkl expression instead of a document.
    #[clap(long)]
    expr: bool,
}

static QUERY_NAMES: [&str; 26] = [
    "keyword",
    "built_in",
    "type",
    "literal",
    "number",
    "operator",
    "punctuation",
    "property",
    "regexp",
    "string",
    "char.escape",
    "subst",
    "symbol",
    "class",
    "function",
    "variable",
    "variable.language",
    "variable.constant",
    "title",
    "title.class",
    "title.class.inherited",
    "title.function",
    "title.function.invoke",
    "params",
    "comment",
    "doctag",
];

fn highlight_expr(contents: String) -> String {
    let highlighted = highlight(format!("expr = {}", contents), false);
    let stripped = highlighted
        .strip_prefix(
            "<span class=\"hljs-property\">expr</span> <span class=\"hljs-operator\">=</span> ",
        )
        .unwrap();
    String::from(stripped)
}

pub fn highlight(contents: String, is_expr: bool) -> String {
    // highlight each line as if it were an expression.
    if is_expr {
        return highlight_expr(contents);
    }
    let pkl_language = tree_sitter_pkl::LANGUAGE.into();
    let mut pkl_config = HighlightConfiguration::new(pkl_language, "pkl", QUERIES, "", "").unwrap();
    let attrs = &QUERY_NAMES.map(|it| {
        let classes = it
            .split(".")
            .enumerate()
            // The first scope is prefixed with hljs-.
            // Subscopes receive N number of underscores.
            // https://highlightjs.readthedocs.io/en/stable/css-classes-reference.html#a-note-on-scopes-with-sub-scopes
            .map(|(idx, it)| {
                if idx == 0 {
                    format!("hljs-{}", it)
                } else {
                    format!("{}{}", it, "_".repeat(idx))
                }
            })
            .collect::<Vec<String>>()
            .join(" ");
        format!("class=\"{}\"", classes)
    });
    pkl_config.configure(&QUERY_NAMES);

    let mut highlighter = Highlighter::new();
    let events = highlighter
        .highlight(&pkl_config, contents.as_bytes(), None, |_| None)
        .unwrap();
    let mut renderer = HtmlRenderer::new();
    renderer
        .render(
            events,
            contents.as_bytes(),
            &|highlight, out: &mut Vec<u8>| {
                out.extend_from_slice(attrs[highlight.0].as_bytes());
            },
        )
        .unwrap();
    renderer.lines().collect::<Vec<&str>>().join("")
}

fn main() {
    let args: CliArgs = CliArgs::parse();
    let mut buf = String::new();
    io::stdin()
        .read_to_string(&mut buf)
        .expect("Failed to read stdin!");
    let result = highlight(buf, args.expr);
    print!("{}", result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_highlight() {
        let pkl_code = r#"name = "Alice"
age = 42
"#;
        let result = highlight(pkl_code.to_string(), false);

        assert_eq!(
            result,
            r#"<span class="hljs-property">name</span> <span class="hljs-operator">=</span> <span class="hljs-string">&quot;Alice&quot;</span>
<span class="hljs-property">age</span> <span class="hljs-operator">=</span> <span class="hljs-number">42</span>
"#
        );
    }

    #[test]
    fn test_highlight_class() {
        let pkl_code = r#"class Foo extends Bar"#;

        let result = highlight(pkl_code.to_string(), false);

        assert_eq!(
            result,
            r#"<span class="hljs-keyword">class</span> <span class="hljs-title class_">Foo</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">Bar</span>
"#
        );
    }

    #[test]
    fn test_highlight_expr() {
        let result = highlight_expr("123".to_string());
        assert!(result.contains("hljs-number"));
    }
}
