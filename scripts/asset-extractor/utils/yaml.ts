import yaml from "yaml";

export function parseYaml(content: string): ReturnType<typeof yaml.parse> {
  return yaml.parse(content, {
    strict: false,
    // https://eemeli.org/yaml/#built-in-custom-tags
    // avoid parsing floatExp, we only use plain number.
    schema: "failsafe",
    customTags: ["int", "float"],
    version: "1.1",
  });
}
