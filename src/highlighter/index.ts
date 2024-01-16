import { Asciidoctor } from "asciidoctor";
import Registry = Asciidoctor.Extensions.Registry;
import processor from "./processor";

export function register (registry: Registry) {
  registry.treeProcessor(function () {
    this.process(processor);
  })
  return registry;
}
