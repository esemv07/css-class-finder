const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let allClasses = new Array();
	let transferedClasses = new Array();
	let htmlFile = "";
	let cssFile = "";

	console.log('Congratulations, your extension "css-class-finder" is now active!');

	const disposable = vscode.commands.registerCommand('css-class-finder.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from CSS Class Finder!');
	});

	const disposable2 = vscode.commands.registerCommand('css-class-finder.transferSelectedClasses', async function () {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return
		} else if (!editor.document.uri.toString().includes('.html')) {
			vscode.window.showWarningMessage('Current file not of .html format.');
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
		if (uniqueClasses.length == 0) {
			vscode.window.showWarningMessage('No classes in selected text.');
			return
		}

		const files = await vscode.workspace.findFiles('**/*.css', '**/node_modules/**', 10);
		if (files.length === 0) {
			vscode.window.showWarningMessage('No Stylesheets to select.')
			return
		}
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
			const edit = new vscode.WorkspaceEdit()
			let stylesText = "";
			uniqueClasses.forEach( function(uniqueClass) {
				stylesText += `
.${uniqueClass} {
	/* insert ${uniqueClass} styles */
}\n\n`
			});
			const lastLine = document.lineAt(document.lineCount - 1);
			const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
			edit.insert(fileSelection.uri, position, ('\n' + stylesText));
			await vscode.workspace.applyEdit(edit);
    		await vscode.window.showTextDocument(document);
		}
	});

	const disposable3 = vscode.commands.registerCommand('css-class-finder.autoSuggestClasses', async function () {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return
		} else if (!editor.document.uri.toString().includes('.css') && !editor.document.uri.toString().includes('.scss')) {
			vscode.window.showWarningMessage('Current file not of .css or .scss format.');
			return
		}

		const files = await vscode.workspace.findFiles('**/*.html', '**/node_modules/**', 10);
		if (files.length === 0) {
			vscode.window.showWarningMessage('No HTML files to select.')
			return
		}
		const pickFiles = files.map(file => ({
			label: vscode.workspace.asRelativePath(file),
			uri: file
		}));

		const fileSelection = await vscode.window.showQuickPick(pickFiles, {
			placeHolder: 'Select a HTML file to fetch classes from',
			matchOnDetail: true
		});

		if (fileSelection) {
			htmlFile = fileSelection.label;
			const fileContent = await vscode.workspace.fs.readFile(fileSelection.uri);
			const fileText = new TextDecoder().decode(fileContent);

			let classes = [];
			const reg = /class=["']([^"']+)["']/gm;
			let match;

			while ((match = reg.exec(fileText)) !== null) {
				const indClass = match[1].split(/\s+/);
				classes.push(...indClass);
			}
			allClasses = [...new Set(classes)];
			if (allClasses.length == 0) {
				vscode.window.showWarningMessage('No classes in selected file.');
				return
			}
		}
	});

	const provider = vscode.languages.registerCompletionItemProvider('css', {
		provideCompletionItems(document, position, token, context) {
			return allClasses.map(indClass => new vscode.CompletionItem("." + indClass + ` {
	
}`))
		}
	})

	const saveListener = vscode.workspace.onDidSaveTextDocument(async document => {
		const fileContent = await vscode.workspace.fs.readFile(document.uri);
		const fileText = new TextDecoder().decode(fileContent);
		
		if (vscode.workspace.asRelativePath(document.uri) == htmlFile) {
			let classes = [];
			const reg = /class=["']([^"']+)["']/gm;
			let match;

			while ((match = reg.exec(fileText)) !== null) {
				const indClass = match[1].split(/\s+/);
				classes.push(...indClass);
			}
			allClasses = [...new Set(classes)];
			if (allClasses.length == 0) {
				vscode.window.showWarningMessage('No classes in selected file.');
				return
			}
			vscode.commands.executeCommand('editor.action.triggerSuggest');
		}

		if ((vscode.workspace.asRelativePath(document.uri).includes(".html")) && cssFile.length > 0) {
			let classes = [];
			const reg = /class=["']([^"']+)["']/gm;
			let match;

			while ((match = reg.exec(fileText)) !== null) {
				const indClass = match[1].split(/\s+/);
				classes.push(...indClass);
			}
			const uniqueClasses = [...new Set(classes)];
			if (uniqueClasses.length == 0) {
				vscode.window.showWarningMessage('No classes in current file.');
				return
			}

			const newClasses = uniqueClasses.filter(indClass => !transferedClasses.includes(indClass));

			const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(cssFile));
			const edit = new vscode.WorkspaceEdit()
			let stylesText = "";
			newClasses.forEach( function(newClass) {
				transferedClasses.push(newClass);
				stylesText += `
.${newClass} {
	/* insert ${newClass} styles */
}\n\n`
			});
			const lastLine = document.lineAt(document.lineCount - 1);
			const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
			edit.insert(vscode.Uri.parse(cssFile), position, (stylesText));
			await vscode.workspace.applyEdit(edit);
		}
	})

	const disposable4 = vscode.commands.registerCommand('css-class-finder.autoTransferClasses', async function () {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return
		} else if (!editor.document.uri.toString().includes('.html')) {
			vscode.window.showWarningMessage('Current file not of .html format.');
			return
		}

		const files = await vscode.workspace.findFiles('**/*.css', '**/node_modules/**', 10);
		if (files.length === 0) {
			vscode.window.showWarningMessage('No stylesheets to select.')
			return
		}
		const pickFiles = files.map(file => ({
			label: vscode.workspace.asRelativePath(file),
			uri: file
		}));

		const fileSelection = await vscode.window.showQuickPick(pickFiles, {
			placeHolder: 'Select a stylesheet to transfer classes to',
			matchOnDetail: true
		});

		if (fileSelection) {
			cssFile = fileSelection.uri.toString();
			vscode.window.showInformationMessage('Save the current HTML file to transfer any new classes.')
		}
	})

	context.subscriptions.push(disposable2, disposable3, provider, saveListener, disposable4);
}


function deactivate() {}

module.exports = {
	activate,
	deactivate
}
