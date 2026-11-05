function decodeXml(value) {
  let decoded = value;
  for (let pass = 0; pass < 2; pass++) {
    decoded = decoded.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
      .replace(/&amp;/g, "&");
  }
  return decoded;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? decodeXml(match[1]) : "";
}

export function parseJunitSummary(xml) {
  const failures = [];
  for (const [, attributes, body = ""] of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    for (const [, , failureAttributes, failureBody] of body.matchAll(/<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      const message = attribute(failureAttributes, "message");
      const detail = decodeXml(failureBody.replace(/<[^>]+>/g, "").trim());
      failures.push({
        name: attribute(attributes, "name"),
        file: attribute(attributes, "file"),
        message,
        detail,
      });
    }
  }

  const testCount = [...xml.matchAll(/<testcase\b/g)].length;
  const skippedCount = [...xml.matchAll(/<(?:skipped|todo)\b/g)].length;
  return { testCount, skippedCount, failures };
}
