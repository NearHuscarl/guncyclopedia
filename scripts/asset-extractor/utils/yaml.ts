import yaml from "yaml";
import type { DocumentOptions, ParseOptions, SchemaOptions, ToJSOptions } from "yaml";

export type TYamlOptions = ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions;

export function parseYaml(content: string, options?: TYamlOptions): ReturnType<typeof yaml.parse> {
  return yaml.parse(content, {
    strict: false,
    schema: "core",
    version: "1.1",
    ...options,
  });
}
