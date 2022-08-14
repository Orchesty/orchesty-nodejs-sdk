import winston from 'winston';
import { appOptions } from '../Config/Config';
import Severity from './Severity';

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
