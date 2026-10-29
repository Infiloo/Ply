import * as close from "./close.js";
import * as configExport from "./config_export.js";
import * as configImport from "./config_import.js";
import * as exportServer from "./export_server.js";
import * as panel from "./panel.js";

export const commands = [configImport, configExport, exportServer, panel, close];

export function commandMap() {
  return new Map(commands.map((command) => [command.data.name, command]));
}
