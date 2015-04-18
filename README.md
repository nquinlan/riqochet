# RiQochet  ![](https://raw.githubusercontent.com/nquinlan/riqochet/resources/assets/logo.png)
RiQochet is a Google Sheets Add-On to get RelateIQ data into Google Sheets, using formulas.

_RiQochet is currently under active development and not well tested. Use at your own risk._

## Usage

To use RiQochet, you must authorize it, see [Installation](#installation) for more information.


### RIQ_FIELD

RIQ_FIELD is a formula created by the sheet that allows you to get a field from an object (e.g. the number of employees a prospect has).

```
=RIQ_FIELD("List Object Name", "Field Name")
=RIQ_FIELD("ACME Inc", "Number of Employees")
=RIQ_FIELD($A2, B$1) 
```

## Installation
Installation of RiQochet is a pain. _(Sorry)_

1. Navigate to the Google Spreadsheet you want to use.
2. From the menu select "Tools" > "Script Editor…"
3. Under "Create script for", select "Blank Project"
4. Copy this repo's [Code.gs](Code.gs) to your blank project's Code.gs
5. Save the project as "RiQochet"
6. From the menu select "Run" > "RUNME"
7. Follow the authorization instructions. Accept all dialogs.
8. Close the window
9. Navigate back to the Google Spreadsheet you want to use.
10. From the menu select "Add-ons" > "RiQochet" > "Set API Key"
11. Set your API Key & API Secret, these values will be [provided by RelateIQ](https://help.relateiq.com/articles/set-up-api-access)
12. From the menu select "Add-ons" > "RiQochet" > "Set List"
13. Set your List ID, you can find this in the URL bar when you access your list.
	- If your URL looks like: `https://app.relateiq.com/#/list:l=53ea9533e4b04d719d595658&v=stream&s=-` your List ID is `53ea9533e4b04d719d595658`
14. Use the functions provided by the script!