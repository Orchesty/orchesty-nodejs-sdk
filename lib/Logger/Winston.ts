import winston from 'winston';
import Severity from './Severity';
import { appOptions } from '../Config/Config';

let level;
switch (appOptions.env) {
  case 'debug':
    level = Severity.DEBUG;
    break;
  case 'test':
    level = Severity.WARNING;
    break;
  default:
    level = Severity.INFO;
}

const consoleT = new winston.transports.Console({
  format: winston.format.splat(),
});

const winstonLogger = winston.createLogger({
  level,
  transports: [consoleT],
});

export default winstonLogger;
