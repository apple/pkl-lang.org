// ===----------------------------------------------------------------------===//
// Copyright © 2026 Apple Inc. and the Pkl project authors. All rights reserved.
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
import {Asciidoctor} from "asciidoctor";
import InlineMacroProcessor = Asciidoctor.Extensions.InlineMacroProcessor;

export default function pkldoc(this: InlineMacroProcessor, parent: Asciidoctor.Document, target: string, attributes: any) {
    let args = attributes["$positional"]
    let moduleUri: string = args !== undefined ? args[0] : "pkl:base"

    if (!moduleUri.startsWith("pkl:")) {
        console.error("pkldoc macro unexpected non-stdlib module uri", moduleUri)
        return
    }
    let modulePath = moduleUri.split(":", 2)[1]
    let pklVersion = parent.getDocument().getAttribute("pkl-version", "current")
    let linkName = target.replace(modulePath.replaceAll("/", ".") + ".", "")
    let url = `https://pkl-lang.org/package-docs/pkl/${pklVersion}/${modulePath}/${linkName}`
    let displayName = (target.startsWith("#") ? target.substring(1) : target).replaceAll("#", ".")
    let monospace = this.createInline(parent, "quoted", displayName, { type: "monospaced" })
    return this.createInline(parent, "anchor", monospace.convert(), { type: "link", target: url, attributes: { ...attributes, window: "blank" } })
};
