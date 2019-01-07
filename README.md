# zendesk-cli

A command line tool for performing bulk operations on Zendesk support tickets

## install

```
npm install -g zdesk
```

## Usage

```
Usage: zdesk [options] [command]

Zendesk support ticket bulk operations

Options:
  -V, --version                                 output the version number
  -h, --help                                    output usage information

Commands:
  login [options]                               Login with your email and API Key. Stored in the OS Keychain or equivalent.
  logout                                        Remove your Zendesk API keys from the OS Keychain or equivalent.
  list|ls [options] <search> [moreTerms...]     List tickets using a search string
  delete|del [options] <search> [moreTerms...]  Delete all tickets that match a search string
```

## Authentication

The `login` command uses [keytar](https://www.npmjs.com/package/keytar) to store your credentials in the OS Keychain or
equivalent. Login will prompt you for your site id, username and API key, or if
you run one of the other commands without credentials configured, you will first
be prompted to login.

To create an API key see the [Zendesk helpsite](https://support.zendesk.com/hc/en-us/articles/226022787-Generating-a-new-API-token-).

Running the `logout` command will remove the credentials.

Example:

```
$ zdesk login
? Enter your Zendesk organization id (???.zendesk.com):  example
? Enter your Zendesk email:  user@example.com
? Enter your API key:  [hidden]
```

## List

```
Usage: list|ls [options] <search> [moreTerms...]

List tickets using a search string

Options:
  -n --num <n>  The number of results to return, default is 100
  -v --verbose  Output some debug logs
  -h, --help    output usage information
```

List all tickets that match the search terms. For example:

```
$ zdesk ls confirmation question -n 3
    0 | Jun 6, 2018 8:12 PM       | Robot Verify and Email Confirmation
    1 | Oct 8, 2018 10:24 AM      | Question
    2 | Dec 19, 2017 5:33 PM      | questionable confirmation email
Total: 3 items
```

## Delete

```
Usage: delete|del [options] <search> [moreTerms...]

Delete all tickets that match a search string

Options:
  -n --num <n>  The number of results to return, default is 100
  -v --verbose  Output some debug logs
  -h, --help    output usage information
```

Delete all tickets that match the search terms. For example:

```
$ zdesk del confirmation question -n 3
Deleted 3 tickets
```
