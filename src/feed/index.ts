import { Register } from "@antora/antora";
import { Feed, FeedOptions } from "feed";
import path from "path";

// @ts-ignore copyright line is not required
const baseFeedOptions: FeedOptions = {
  title: "Pkl Blog",
  description: "Blog site from the maintainers of the Pkl configuration language",
  id: "https://pkl-lang.org/blog/index.html",
  link: "https://pkl-lang.org/blog/index.html",
  language: "en-US",
  favicon: "https://pkl-lang.org/_/img/favicon.svg",
  generator: "Pkl Blog"
}

const register: Register = (context) => {
  context.on("navigationBuilt", function ({ contentCatalog, playbook, siteCatalog }) {
    const feed = new Feed(baseFeedOptions);
    let lastUpdated: Date = new Date(0);
    for (let page of contentCatalog.getPages((it) => it.basename !== "index.adoc" && it.asciidoc?.attributes["page-component-name"] === "blog")) {
      const asciidoc = page.asciidoc!!;
      const date = new Date(asciidoc.attributes.date);
      if (date > lastUpdated) {
        lastUpdated = date;
      }
      feed.addItem({
        title: asciidoc.doctitle!!,
        id: asciidoc.attributes.docname,
        // @ts-ignore
        link: path.join(playbook.site.url, page.out.path),
        date: date,
        published: date,
        author: [
          {
            name: asciidoc.attributes.author,
            link: asciidoc.attributes["author-url"]
          }
        ],
        content: page.contents?.toString(),
      })
    }
    feed.options.updated = lastUpdated;
    siteCatalog.addFile({
      contents: Buffer.from(feed.atom1()),
      out: {
        path: 'blog/feed.xml'
      }
    })
  });
};

module.exports = { register };
