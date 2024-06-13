import winston from "winston";

import { env } from "./env";

/**
 * TODO: Use better logger
 * @see https://www.npmjs.com/package/winston
 * @see https://ithelp.ithome.com.tw/articles/10255101
 */
export function createLogger({
  isDisabled = false,
  isDebugMode = true,
  buildNumber,
}: {
  isDisabled?: boolean;
  isDebugMode?: boolean;
  buildNumber?: string;
}) {
  const logger = winston.createLogger({
    level: "info",
    defaultMeta: buildNumber ? { buildNumber } : undefined,
  });

  if (isDisabled) {
    logger.add(
      new winston.transports.Console({
        silent: true,
      }),
    );
  } else if (isDebugMode) {
    logger.add(
      new winston.transports.Console({
        // e.g. info: 2023-01-18T07:53:19.033Z "Listening to port 8080 in local environment"
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize({}),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${level}: ${timestamp}\n ${
              message?.error ?? JSON.stringify(message, null, 2)
            }`;
          }),
        ),
        eol: "\n",
      }),
    );
  } else {
    logger.add(
      new winston.transports.Console({
        format: winston.format.json(),
      }),
    );
  }

  return logger;
}

// TODO: Inject logger to all services instead of using global logger
export const logger = createLogger({
  isDisabled: env.isLoggerDisabled,
  isDebugMode: env.isDebugMode,
  buildNumber: env.buildNumber,
});

export type Logger = ReturnType<typeof createLogger>;
