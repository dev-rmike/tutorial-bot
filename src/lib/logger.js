// This is the logger to log everything in a pretty way.

// Import the packages.
const chalk = require("chalk");
const moment = require("moment");

// Make the logger class with functions.
module.exports = class Logger {
  static ok(txt) {
    console.log(
      `${chalk.gray(`[${moment().format("HH:mm:ss")}]`)} ${chalk.green(
        "[OK]"
      )} ${txt}`
    );
  }

  static log(txt) {
    console.log(
      `${chalk.gray(`[${moment().format("HH:mm:ss")}]`)} ${chalk.blue(
        "[INFO]"
      )} ${txt}`
    );
  }

  static warn(txt) {
    console.log(
      `${chalk.gray(`[${moment().format("HH:mm:ss")}]`)} ${chalk.yellow(
        "[WARN]"
      )} ${txt}`
    );
  }

  static error(txt) {
    console.log(
      `${chalk.gray(`[${moment().format("HH:mm:ss")}]`)} ${chalk.red(
        "[ERR]"
      )} ${txt}`
    );
  }
};
