const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "css-class-finder" is now active!');

	const disposable = vscode.commands.registerCommand('css-class-finder.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from CSS Class Finder!');
	});

	const disposable2 = vscode.commands.registerCommand('css-class-finder.transferSelectedClasses', async function () {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return
		}

		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);

		if (!selectedText || selectedText.trim().length === 0) {
			vscode.window.showWarningMessage('No text selected.');
			return
		}

		// const document = editor.document;

		let classes = [];
		const reg = /class=["']([^"']+)["']/gm;
		let match;

		while ((match = reg.exec(selectedText)) !== null) {
			const indClass = match[1].split(/\s+/);
			classes.push(...indClass);
		}
		const uniqueClasses = [...new Set(classes)];
		console.log(uniqueClasses);

		const files = await vscode.workspace.findFiles('**/*.css', '**/node-modules/**', 10);
		const pickFiles = files.map(file => ({
			label: vscode.workspace.asRelativePath(file),
			uri: file
		}));

		const fileSelection = await vscode.window.showQuickPick(pickFiles, {
			placeHolder: 'Select a stylesheet to transfer classes to',
			matchOnDetail: true
		});

		if (fileSelection) {
			const document = await vscode.workspace.openTextDocument(fileSelection.uri);
    		await vscode.window.showTextDocument(document);
		}
	});

	context.subscriptions.push(disposable, disposable2);
}


function deactivate() {}

module.exports = {
	activate,
	deactivate
}
