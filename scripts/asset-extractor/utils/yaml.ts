import yaml from "yaml";

export function parseYaml(content: string): ReturnType<typeof yaml.parse> {
  return yaml.parse(content, {
    strict: false,
    version: "1.1",
  });
}
