#!/usr/bin/env node

const program = require("commander");
const { listTickets, delTickets, login, logout } = require("./zendesk");

/**
 * If in debug mode, delays execution long enough for the debugger to attach.
 */
function debuggable(fn, wait = 2000) {
  var debugging =
    typeof v8debug === "object" ||
    /--debug|--inspect/.test(process.execArgv.join(" "));
  return (...args) =>
    new Promise(resolve => {
      setTimeout(
        () => {
          resolve(fn(...args));
        },
        debugging ? wait : 0
      );
    });
}

program.version("0.0.1").description("Zendesk support ticket bulk operations");

program
  .command("login")
  .description(
    "Login with your email and API Key. Stored in the OS Keychain or equivalent."
  )
  .option("-u --user", "The email address of the user with API access")
  .action(
    debuggable(options => {
      login(options.user).catch(e => console.error(e));
    })
  );

program
  .command("logout")
  .description(
    "Remove your Zendesk API keys from the OS Keychain or equivalent."
  )
  .action(
    debuggable(options => {
      logout().catch(e => console.error(e));
    })
  );

program
  .command("list <search> [moreTerms...]")
  .alias("ls")
  .option(
    "-n --num <n>",
    "The number of results to return, default is 100",
    parseInt
  )
  .option("-v --verbose", "Output some debug logs")
  .description("List tickets using a search string")
  .action(
    debuggable((search, moreTerms, options) => {
      const searchTerms = moreTerms ? [search, ...moreTerms] : [search];
      listTickets(searchTerms, options);
    })
  );

program
  .command("delete <search> [moreTerms...]")
  .alias("del")
  .option(
    "-n --num <n>",
    "The number of results to return, default is 100",
    parseInt
  )
  .option("-v --verbose", "Output some debug logs")
  .description("Delete all tickets that match a search string")
  .action(
    debuggable((search, moreTerms, options) => {
      const searchTerms = moreTerms ? [search, ...moreTerms] : [search];
      delTickets(searchTerms, options);
    })
  );

program.parse(process.argv);
if (program.args.length === 0) {
  program.help();
}
