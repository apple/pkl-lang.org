import { Component, ContentCatalog, ContentCatalogModel } from "@antora/antora";

export interface SiteUiModel {
  title: string;
  ui: {
    url: string;
    defaultLayout: string;
  };
  homeUrl: string;
  components: { [string]: Component }
}

export interface BaseUiModel {
  antoraVersion: string;
  contentCatalog: ContentCatalogModel;
  env: Record<string, string>;
  site: SiteUiModel;
}

export interface UiModel extends BaseUiModel {
  siteRootPath: string;
  uiRootPath: string;
}

export function buildSiteUiModel(playbook, contentCatalog): SiteUiModel;

export function buildUiModel(baseUiMode, file, contentCatalog, navigationCatalog): UiModel