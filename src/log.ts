import { createLogger, format, transports } from 'winston';
import type { TransformableInfo } from 'logform';

const {
  colorize,
  combine,
  errors,
  printf,
  simple,
} = format;

const template = ({
  level,
  message,
  stack,
  ...rest
}: TransformableInfo): string => {
  const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
  const stacktrace = typeof stack === 'string' ? `\n${stack}` : '';
  const timestamp = new Date().toLocaleString();
  return `${timestamp} ${level}: ${message}${meta}${stacktrace}`;
};

const logger = createLogger({
  format: combine(
    errors({ stack: true }),
    colorize(),
    printf(template),
  ),
  level: process.env.LOG_LEVEL ?? 'debug',
  transports: [
    new transports.Console(),
  ],
});

export { logger };
