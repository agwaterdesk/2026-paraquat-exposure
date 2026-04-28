import clipboardy from "clipboardy";
import fs from "fs-extra";
import { projectConfig } from "./config.js";

const GOOGLE_DOC_TEMPLATE_URL =
  "https://docs.google.com/document/d/1AQDmqk14eLLwASAOlI-EBFSA83SZLiH0ShksVCzwjog/edit?tab=t.0";

function extractFromApp() {
  const CWD = process.cwd();
  const appPath = `${CWD}/src/App.svelte`;
  const appSource = fs.readFileSync(appPath, "utf-8");

  // Hed: from main <h1> in App.svelte
  const hedMatch = appSource.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const hed = hedMatch ? hedMatch[1].trim().replace(/\s+/g, " ") : "";

  // Dek: from first block-level element with class "dek" (e.g., <p class="dek">…</p>)
  const dekMatch = appSource.match(/class="dek"[^>]*>([\s\S]*?)<\/p>/);
  const dek = dekMatch ? dekMatch[1].trim().replace(/\s+/g, " ") : "";

  // Alt text: from element with class "sr-only"
  const srOnlyMatch = appSource.match(/class="sr-only"[^>]*>([\s\S]*?)<\/p>/);
  const altText = srOnlyMatch
    ? srOnlyMatch[1].trim().replace(/\s+/g, " ")
    : dek || hed;

  // Data credit: try to grab linked text inside the credit block
  let dataCredit = "USDA Wildlife Services";
  const creditBlockMatch = appSource.match(
    /<div class="credit">([\s\S]*?)<\/div>/
  );
  if (creditBlockMatch) {
    const block = creditBlockMatch[1];
    const linkTextMatch = block.match(/Data:\s*<a[^>]*>([^<]+)<\/a>/);
    if (linkTextMatch) {
      dataCredit = linkTextMatch[1].trim().replace(/\s+/g, " ");
    }
  }

  return { hed, dek, altText, dataCredit };
}

function buildTemplate({ slug, link, hed, dek, altText, dataCredit }) {
  return [
    `Link: ${link}`,
    "",
    `Hed: ${hed}`,
    "",
    `Dek: ${dek}`,
    "",
    `Alt text for screen readers: ${altText}`,
    "",
    `Credit: Data: ${dataCredit}; Graphic by Jared Whalen / Ag & Water Desk`,
    "",
    `Static images: https://github.com/agwaterdesk/${slug}/tree/main/public/fallbacks`,
    "",
    `GitHub repo: https://github.com/agwaterdesk/${slug}`,
    "",
    "Embeds",
    "",
    "With credits",
    `<div id="g-${slug}"></div>`,
    '<script type="text/javascript" src="https://pym.nprapps.org/pym.v1.min.js"></script>',
    "<script>",
    `    var pymRunoffTileMap = new pym.Parent('g-${slug}', 'https://agwaterdesk.github.io/${slug}', {});`,
    "</script>",
    "",
    "Without credits",
    `<div id="g-${slug}"></div>`,
    '<script type="text/javascript" src="https://pym.nprapps.org/pym.v1.min.js"></script>',
    "<script>",
    `    var pymRunoffTileMap = new pym.Parent('g-${slug}', 'https://agwaterdesk.github.io/${slug}/?credit=false', {});`,
    "</script>",
    "",
    "Google Doc template (make a copy and paste this content in):",
    GOOGLE_DOC_TEMPLATE_URL,
    "",
  ].join("\n");
}

async function main() {
  try {
    const { project } = projectConfig;
    const slug = project.slug;

    const { hed, dek, altText, dataCredit } = extractFromApp();

    const link = `https://agwaterdesk.github.io/${slug}`;

    const answers = { slug, link, hed, dek, altText, dataCredit };
    const output = buildTemplate(answers);

    // Log to console
    console.log("\n================ SHARE TEMPLATE ================\n");
    console.log(output);
    console.log("================================================\n");

    // Copy to clipboard
    await clipboardy.write(output);
    console.log("Template copied to clipboard.");
  } catch (err) {
    console.error("Error generating share template:", err);
    process.exit(1);
  }
}

main();

