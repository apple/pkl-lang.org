// Bare minimum typings needed for our bespoke feed extension.
import * as Vinyl from "vinyl"

export type NavigationBuiltEvent = {
  contentCatalog: ContentCatalog;
  playbook: Playbook;
  uiCatalog: UiCatalog;
  navigationCatalog: {},
  siteCatalog: SiteCatalog;
};

export type Register = (context: Context) => any;
export type Register = (this: Context) => any;

interface SiteCatalog {
  addFile(file: { contents: Buffer; out: { path: string } });
}

interface ContentCatalog {
  getComponent(id: string): Component
  getComponentVeresion(id: string, version: string): Component
  getComponents(): Component[]
  getComponentsSortedBy(property: string): Component[]
  getFiles(): File[]
  getPages(filter?: (file: File) => Boolean): File[]
  getSiteStartPage(): File?;
  addFile(file: any): void;
  /**
   * Attempts to resolve a string contextual page ID spec to a file in the catalog.
   *
   * Parses the specified contextual page ID spec into a page ID object, then attempts to lookup a
   * file with this page ID in the catalog. If a component is specified, but not a version, the
   * latest version of the component stored in the catalog is used. If a page cannot be resolved,
   * the search is attempted again for an "alias". If neither a page or alias can be resolved, the
   * function returns undefined. If the spec does not match the page ID syntax, this function throws
   * an error.
   *
   * @param spec - The contextual page ID spec (e.g., version@component:module:topic/page.adoc).
   * @param ctx - The context to use to qualified the contextual page ID.
   *
   * @returns {File} The virtual file to which the contextual page ID spec refers, or undefined if the
   * file cannot be resolved.
   */
  resolvePage(id: string, ctx: object = {}): File?;
}

interface ContentCatalogModel {

}

interface File extends Vinyl {
    asciidoc: Asciidoc?
}

interface Asciidoc {
    attributes: Record<string, string>;
    doctitle?: string;
    navtitle?: string;
    xreftext?: string;
}

interface Component {
    latest: {
        displayVersion: string
        title: string
        version: string
        name: string
    }
    title: string
    url: string
}

interface Logger {
    info(msg: string): void;
}

interface Context {
    getLogger(id: string): Logger;
    on(event: "navigationBuilt", handler: (event: NavigationBuiltEvent) => any): void;
}

interface Playbook {
  antora: { generator: string; };
  asciidoc: { attributes: Record<string, string>; extensions: string[] };
  output: { dir: string; clean: boolean }
}

interface UiCatalog {

}