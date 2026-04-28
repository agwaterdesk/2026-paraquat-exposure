# Svelte template

## To get started

### Using degit

`degit` is a package that makes copies of a git repository's most recent commit. This allows for generating the scaffolding from this template directly from the command line.

Since this is a private repository, you'll need to set up SSH keys with your Github account. More information on how to do that [here](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).

To install degit: `npm install -g degit`

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit axiosvisuals/svelte-template --mode=git test-app
cd test-app
```

### Using 'Use this template'

Click the `Use this template` button above and follow the instructions prompted by GitHub.

### Post-clone setup

In your local repo:

- Install the dependencies: `npm install`
- Ctrl+F the term `[insert slug]` and replace it with your project slug. Also update the page title by ctrl+F'ing `[insert name]` and replacing it with a project name. (Or, you can manually update these in `index.html` and `project.config.json`.)
- Start the development server: `npm run dev`
- Navigate to [localhost:3000](http://localhost:3000). The app should run and update on changes.

## Google Docs/Archie ML for copy

- Create a Google Doc or Sheet
- Click Share button -> advanced -> Change... -> to "Anyone with this link"
- In the address bar, grab the ID - eg. ...com/document/d/**1IiA5a5iCjbjOYvZVgPcjGzMy5PyfCzpPF-LnQdCdFI0**/edit
  paste in the ID above into `project.config.json`, and set the filepath to where you want the file saved
- If you want to do a Google Sheet, be sure to include the gid value in the url as well
- Running `npm run fetch-doc` at any point (even in new tab while server is running) will fetch the latest from all Docs and Sheets.
- Make sure any elements that include this copy use [@html](https://svelte.dev/tutorial/html-tags), so links/styling from the google doc can be properly incorporated

## Publishing

- Before publishing please make sure to fill out the `[alt text]` in `App.svelte`
- Make sure your changes are committed to `main`
- Run `make github`