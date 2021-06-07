# quizmaster
a discord quiz bot with customizable questions made for a friend
## Usage
~~Uh I sure hope I'll never need to write this actually 😅~~  
Definitely going to have to write up how to use this thing.  
### Environment Variables
Create a `.env` file and on separate lines, `<VARIABLE_NAME>=<description>`  
I will operate under the assumption Discord and Google Sheets API knowledge are prereqs
|Variable name|Description|
|-|-|
|TOKEN|Discord bot token
|EMAIL|Email for the Google Sheets service|
|PRIVATE_KEY|Private key for the Google Sheets service|
|SHEET_ID|ID of the Google Sheet storing the custom trivia questions|
|ACCOUNT|Name (username) of the account ~~sponsoring~~ being featured|
|LINK|Link to the account being featured|
|PFP_LINK|Link to the profile picture of the account being featured|
### Contents of Spreadsheet
The spreadsheet has two tables:
#### Questions
Table to keep track of which trivia questions the bot can ask. All values in this table are kept in strings (question is a string, answer is a string, difficulty can be taken however you want, no precoded thing, topic can also be taken however).
|Question|Answer|Difficulty|Topic|
|-|-|-|-|
|q1|a1|d1|t1|
....etc.
#### Users
Table to keep track of user scores based on Discord ID. All values of this table are integers (Discord user ID is a number, scores are kept in numbers)
|Discord ID|All Time Score|Monthly Score|Weekly Score|Daily Score|
|-|-|-|-|-|
|id1|ats1|ms1|ws1|ds1|
....etc.
### Starting the Bot
To start the bot:
```bash
$ node index.js
```
## TODO
- [ ] finish the bot
- [ ] properly document it *one day*
- [ ] write the usage section *one day*
