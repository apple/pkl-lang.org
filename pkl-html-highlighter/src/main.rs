// ===----------------------------------------------------------------------===//
// Copyright © 2024 Apple Inc. and the Pkl project authors. All rights reserved.
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
use std::process::exit;
use std::{fs, io};
use std::io::Read;
use clap::Parser;
use tree_sitter_highlight::{HighlightConfiguration, Highlighter, HtmlRenderer};
use tree_sitter_pkl;

#[derive(Parser)]
struct CliArgs {
    /// Highlight as a Pkl expression instead of a document.
    #[clap(long)]
    expr: bool,

    /// A tree-sitter queries document to use for highlighting.
    #[clap(long)]
    queries: Option<String>,
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
    "doctag"
];

fn highlight_expr(contents: String, highlights_query: String) -> String {
    let highlighted = highlight(format!("expr = {}", contents), highlights_query, false);
    let stripped = highlighted.strip_prefix("<span class=\"hljs-property\">expr</span> <span class=\"hljs-operator\">=</span> ").unwrap();
    return String::from(stripped);
}

pub fn highlight(contents: String, highlights_query: String, is_expr: bool) -> String {
    // highlight each line as if it were an expression.
    if is_expr {
        return highlight_expr(contents, highlights_query);
    }
    let mut pkl_config = HighlightConfiguration::new(
        tree_sitter_pkl::language(),
        highlights_query.as_str(),
        tree_sitter_pkl::INJECTIONS_QUERY,
        tree_sitter_pkl::LOCALS_QUERY,
    ).unwrap();
    let attrs = &QUERY_NAMES.map(|it| {
        let classes = it
            .split(".")
            .enumerate()
            // The first scope is prefixed with hljs-.
            // Subscopes receive N number of underscores.
            // https://highlightjs.readthedocs.io/en/stable/css-classes-reference.html#a-note-on-scopes-with-sub-scopes
            .map(|(idx, it)|
                 if idx == 0 {
                     format!("hljs-{}", it)
                 } else {
                     format!("{}{}", it, "_".repeat(idx))
                 }
            )
            .collect::<Vec<String>>()
            .join(" ");
        format!("class=\"{}\"", classes)
    });
    pkl_config.configure(&QUERY_NAMES);


    let mut highlighter = Highlighter::new();
    let events = highlighter.highlight(
        &pkl_config,
        contents.as_bytes(),
        None,
        |_| None
    ).unwrap();
    let mut renderer = HtmlRenderer::new();
    renderer.render(
        events,
        contents.as_bytes(),
        &move |it| &attrs[it.0].as_bytes()
    ).unwrap();
    renderer.lines().collect::<Vec<&str>>().join("")
}

fn main() {
    let args: CliArgs = CliArgs::parse();
    if args.queries.is_none() {
        print!("Missing required argument: --queries <query>");
        exit(1)
    }
    let queries = fs::read_to_string(args.queries.unwrap().as_str()).unwrap();
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf).expect("Failed to read stdin!");
    let result = highlight(buf, queries, args.expr);
    print!("{}", result)
}
