import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import fs from "fs";
import yaml from "yaml";

import { setupMockServices, setupServer } from "@/server";
import { registry } from "@/utils/api/openapi";

/**
 * 將 openapi 規格產生為 yaml 檔案
 * @param filename - 要產生的檔案名稱
 */
export function generateOpenApiDocs(filename: string) {
  try {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const docs = generator.generateDocument({
      openapi: "3.0.0",
      info: {
        version: "1.0.0",
        title: "API v1",
      },
      servers: [{ url: "http://localhost:8080" }],
    });

    fs.writeFileSync(`${filename}`, yaml.stringify(docs), {
      encoding: "utf-8",
    });
  } catch (e) {
    console.log(e);
  }
}

/**
 * 產生 openapi 規格檔案
 */
export async function exec() {
  // 在 setupServer 函式中註冊所有的 api routes
  // 為了避免在執行時需要真的啟動 server，所以需要使用 mock services
  await setupServer(setupMockServices());
  generateOpenApiDocs("openapi.yaml");
}
