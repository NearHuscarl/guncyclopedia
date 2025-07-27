import yaml from "yaml";

export function parseYaml(content: string): ReturnType<typeof yaml.parse> {
  return yaml.parse(content, {
    strict: false,
    schema: "core",
    version: "1.1",
  });
}
