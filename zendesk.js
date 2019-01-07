const keytar = require("keytar");
const { prompt } = require("inquirer");
const request = require("request-promise-native");
const moment = require("moment");

const ZENDESK_CLI_SERVICE_NAME = "zdesk-zendesk-cli";
const ZENDESK_PAGE_SIZE = 100;

async function getLogin() {
  const creds = await keytar.findCredentials(ZENDESK_CLI_SERVICE_NAME);
  if (creds.length > 0) {
    const email = creds[0].account;
    const [domain, apiKey] = creds[0].password.split(":");
    return { email, domain, apiKey };
  } else {
    return { email: null, domain: null, apiKey: null };
  }
}

async function ensureLogin(silent = false) {
  let { email, domain, apiKey } = await getLogin();
  if (!email && !silent) {
    return await login();
  } else if (!email) {
    throw "User not logged in. Silent mode active.";
  }
  return { email, domain, apiKey };
}

/**
 * Prompts user for a name and email address. Overwrites the credentials in the OS level
 * credentials store (Keychain on OSX, equivalent otherwise)
 * @param {*} email
 * @param {*} domain
 */
async function login(domain = null, email = null) {
  let questions = [
    {
      type: "password",
      name: "apiKey",
      message: "Enter your API key: "
    }
  ];
  if (!email) {
    questions.unshift({
      type: "input",
      name: "email",
      message: "Enter your Zendesk email: "
    });
  }
  if (!domain) {
    questions.unshift({
      type: "input",
      name: "domain",
      message: "Enter your Zendesk organization id (???.zendesk.com): "
    });
  }
  const answers = await prompt(questions);
  domain = domain || answers.domain;
  email = email || answers.email;
  await logout();
  keytar.setPassword(
    ZENDESK_CLI_SERVICE_NAME,
    email,
    domain + ":" + answers.apiKey
  );
  return { email, domain, apiKey: answers.apiKey };
}

/**
 * Logs out user. Removes credentials from the OS Keychain or equivalent.
 */
async function logout() {
  const { email } = await getLogin();
  if (email) {
    keytar.deletePassword(ZENDESK_CLI_SERVICE_NAME, email);
  }
}

/**
 * Takes an array of search terms. Prints out the results of the search.
 * See https://support.zendesk.com/hc/en-us/articles/203663226-Zendesk-Support-search-reference
 * @param {*} searchTerms Array of search terms
 * @param {*} options
 * @param {*} silent Returns the results as an object rather than logging to console
 */
async function listTickets(searchTerms, options = {}, silent = false) {
  const { email, domain, apiKey } = await ensureLogin();
  const num = options.num || ZENDESK_PAGE_SIZE;
  const searchStr = encodeURI(searchTerms.join(" ") + " type:ticket");
  let nextUrl = `https://${domain}.zendesk.com/api/v2/search.json?query=${searchStr}`;
  let count = 0,
    results = [];

  while (count < num && nextUrl) {
    const response = await request.get(nextUrl).auth(email + "/token", apiKey);
    const data = JSON.parse(response);
    results = results.concat(data.results.slice(0, num - count));
    count += data.results.length;
    nextUrl = data.next_page;
    if (options.verbose) {
      console.log(`Retrieved ${count} items`);
    }
  }

  if (silent) {
    return results;
  }
  if (options.json) {
    console.log(results);
  } else {
    results.forEach((r, i) => {
      console.log(
        `${i.toString().padStart(5)} | ${moment(r.created_at)
          .format("lll")
          .padEnd(25)} | ${r.subject}`
      );
    });
  }
  console.log(`Total: ${results.length} items`);
}

/**
 * Deletes all tickets that match the searchTerms. See listTickets above.
 * @param {*} searchTerms Array of search terms
 * @param {*} options
 */
async function delTickets(searchTerms, options = {}) {
  const { email, domain, apiKey } = await ensureLogin();
  const tickets = await listTickets(searchTerms, options, true);
  const num = options.num || ZENDESK_PAGE_SIZE;
  if (options.verbose) {
    console.log(`Deleting ${tickets.length} items`);
  }
  for (
    let skip = 0;
    skip < num && skip < tickets.length;
    skip += ZENDESK_PAGE_SIZE
  ) {
    const ids = tickets
      .filter((r, i) => i >= skip && i < skip + ZENDESK_PAGE_SIZE)
      .map(r => r.id);
    const url = `https://${domain}.zendesk.com/api/v2/tickets/destroy_many.json?ids=${ids.join()}`;
    await request.delete(url).auth(email + "/token", apiKey);
    console.log(`Deleted ${skip + ids.length} tickets`);
  }
}

module.exports = {
  login,
  logout,
  listTickets,
  delTickets
};
