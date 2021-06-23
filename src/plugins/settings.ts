import { Plugin } from "@remixproject/engine";
const profile = {
	name: 'settings',
	displayName: 'Settings',
	methods: ['getGithubAccessToken'],
	events: [],
	icon: 'assets/img/settings.webp',
	description: 'Remix-IDE settings',
	kind: 'settings',
	documentation: '',
	version: '0.0.1',
  }

  export default class SettingsModule extends Plugin {
	constructor() {
		super(profile);
	}
	getGithubAccessToken () {
		return ''
	}
  }