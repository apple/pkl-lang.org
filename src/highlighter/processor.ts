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
import { Asciidoctor } from "asciidoctor";
import { spawnSync } from "child_process";
import TreeProcessor = Asciidoctor.Extensions.TreeProcessor;
import calloutSubstituter from "./calloutSubstituter";
import path from "path";
import hljs from "highlight.js/lib/common"

export function highlightPkl(source: string, lang: string): string {
  const pklHtmlHighlighterPath = process.env["PKL_HTML_HIGHLIGHTER"] || "pkl-html-highlighter";
  // pkl-html-highlighter is a subproject of this repo
  const cmd = spawnSync(
    pklHtmlHighlighterPath,
    [
      "--queries",
      path.join(__dirname, "queries/highlights.scm"),
      ...(lang == "pkl expression" ? ["--expr"] : [])
    ],
    {
      encoding: "utf-8",
      input: source
    }
  );
  if (cmd.error != null) {
    throw cmd.error;
  }
  if (cmd.stderr != null && cmd.stderr.length > 0) {
    console.error(cmd.stderr);
  }
  return cmd.stdout;
}

function removeSubstitution (block: Asciidoctor.Document, name: string): string | undefined {
  // @ts-ignore
  if (block.hasSubstitution(name)) {
    // @ts-ignore
    block.removeSubstitution(name)
    return name
  }
}

function processSourceBlock(processor: TreeProcessor, block: Asciidoctor.Document) {
  // noinspection TypeScriptValidateJSTypes
  const blockLanguage: string = block.getAttribute("language")
    || block.getDocument().getAttribute("highlightjs-default-lang", "none");
  if (blockLanguage != "pkl-snippet" && blockLanguage != "pkl" && blockLanguage != "pkl expression") {
    return;
  }
  let callouts: ReturnType<typeof calloutSubstituter> | null = null;
  let source = block.getSource();
  // removeSubstitution(block, "macros");
  if (removeSubstitution(block, "callouts")) {
    callouts = calloutSubstituter(processor, block);
    source = callouts.extract(source);
  }
  // Apply subs before 'specialcharacters', keep subs after 'specialcharacters'.
  const subs = block.getSubstitutions()
  const idx = subs.indexOf('specialcharacters')
  if (idx >= 0) {
    source = block.applySubstitutions(source, subs.slice(0, idx)) as string
    subs.splice(0, idx + 1)  // remove subs until specialcharacters (incl.)
  }

  const html = highlightPkl(source, blockLanguage);
  let lines = html.split("\n");

  if (callouts != null) {
    lines = lines.map((line, ln) => line + (callouts!.convertLine(ln) || ''))
  }

  // @ts-ignore
  block.lines = lines;
}

export default function processor(this: TreeProcessor, doc: Asciidoctor.Document) {
  const sourceBlocks = doc.findBy({ context: "listing", style: "source" });
  for (const block of sourceBlocks) {
    processSourceBlock(this, block as Asciidoctor.Document);
  }
};
