import * as genAccessToken from "@/genAccessToken";
import * as geAPIDocs from "@/genAPIDocs";
import * as server from "@/server";

/**
 * 整個專案的 entry point，根據 command line arguments 執行不同的功能。
 * - server: 開始執行 api server
 * - gen-openapi: 產生 openapi 規格檔案
 * - gen-access-token: 產生一個 access token 供 demo 使用
 */
function main() {
  const command = process.argv[2];

  if (command === undefined || command.length === 0) {
    server.exec();
    return;
  }

  switch (command) {
    case "server":
      server.exec();
      break;
    case "gen-api-docs":
      geAPIDocs.exec();
      break;
    case "gen-access-token":
      genAccessToken.exec();
      break;
    default:
      console.error("Unknown command");
      break;
  }
}

main();
