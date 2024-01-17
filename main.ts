import { App, DropdownComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
    selectedLanguage: string;
	defaultLanguage: string;
	saveDefaultLanguage: boolean;
}

const codeBlockLanguage: Record<string, string> = {
    plaintext: 'plaintext',
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    html: 'html',
    css: 'css',
    markdown: 'markdown',
    typescript: 'typescript',
    bash: 'bash',
    shell: 'shell',
    c: 'c',
    cpp: 'cpp',
    csharp: 'csharp',
    cs: 'cs',
    go: 'go',
    ruby: 'ruby',
    swift: 'swift',
    php: 'php',
    rust: 'rust',
    kotlin: 'kotlin',
    scala: 'scala',
    dart: 'dart',
    xml: 'xml',
    json: 'json',
    sql: 'sql',
    graphql: 'graphql',
    powershell: 'powershell',
    yaml: 'yaml',
    ini: 'ini',
    latex: 'latex',
    apache: 'apache',
    nginx: 'nginx',
    makefile: 'makefile',
    dockerfile: 'dockerfile',
};

const DEFAULT_SETTINGS: MyPluginSettings = {
	selectedLanguage: codeBlockLanguage.plaintext,
	defaultLanguage: codeBlockLanguage.default,
	saveDefaultLanguage: false
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		const ribbonIconEl = this.addRibbonIcon('aperture', 'Xcode Paste Plugin', (evt: MouseEvent) => {
			this.openSampleModal()
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: 'Paste Code',
			name: 'Paste Code',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new SampleModal(this.app, this).open();
					}

					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	openSampleModal() {
		new SampleModal(this.app, this).open();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	private inputCode: HTMLTextAreaElement;
	private languageDropdown: DropdownComponent;

	constructor(app: App, private plugin: MyPlugin) {
        super(app);
    }

	onOpen() {
		const {contentEl} = this;

		this.contentEl.style.width = '100%'
		this.containerEl.style.margin = 'auto'

		this.plugin.settings.selectedLanguage = this.plugin.settings.saveDefaultLanguage ? this.plugin.settings.defaultLanguage : this.plugin.settings.selectedLanguage

		this.languageDropdown = new DropdownComponent(contentEl)
			.addOptions(codeBlockLanguage)
            .setValue(this.plugin.settings.selectedLanguage)
            .onChange(async (value) => {
				this.plugin.settings.selectedLanguage = value;
				await this.plugin.saveSettings();
            });

		contentEl.createEl('h2', { text: 'Paste Your Code' });

        this.inputCode = contentEl.createEl('textarea', { 
			attr: { type: 'textarea' },
		});

		this.inputCode.style.width = '100%'
		this.inputCode.style.height = '400px'
		this.inputCode.style.padding = '10px'
		this.inputCode.style.boxSizing = 'border-box'
		this.inputCode.style.marginBottom = '8px'

        const buttonElement = contentEl.createEl('button', { text: 'Done' });
		buttonElement.style.width = 'fit-content'
		buttonElement.style.margin = 'auto'
		buttonElement.style.display = 'block'

        buttonElement.addEventListener('click', () => {
            this.handleInput();
        });
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	private handleInput() {
        const inputValue = this.inputCode.value;
		const selectedLanguage = this.plugin.settings.selectedLanguage
		const codeBlock = `\`\`\`${selectedLanguage}\n${inputValue}\n\`\`\``;

		const activeMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (activeMarkdownView && codeBlock.trim() !== '') {
            const editor = activeMarkdownView.editor;
            editor.replaceSelection(codeBlock);
            editor.focus();
        }

        this.close();
    }
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
            .setName('Save Default Language')
            .setDesc('Toggle to save the default language')
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.saveDefaultLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.saveDefaultLanguage = value;
						this.plugin.settings.selectedLanguage = this.plugin.settings.defaultLanguage
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.saveDefaultLanguage) {
            new Setting(containerEl)
                .setName('Selected Language')
                .setDesc('Choose the default language for code blocks')
                .addDropdown(dropdown => {
                    dropdown
                        .addOptions(codeBlockLanguage)
                        .setValue(this.plugin.settings.defaultLanguage)
                        .onChange(async (value) => {
                            this.plugin.settings.defaultLanguage = value;
                            await this.plugin.saveSettings();
                        });
                });
        }
	}
}
