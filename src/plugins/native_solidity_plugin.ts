import { CommandPlugin } from "@remixproject/engine-vscode";
import { window } from "vscode";
import { fork, ChildProcess } from "child_process";
import * as path from "path";
import { ISources } from "./type";

const profile = {
  name: 'solidity',
  displayName: 'Solidity compiler',
  description: 'Compile solidity contracts',
  kind: 'compiler',
  permission: true,
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/solidity_editor.html',
  version: '0.0.1',
  methods: ['getCompilationResult', 'compile', 'compileWithParameters', 'setCompilerConfig']
};

export default class NativeSolcPlugin extends CommandPlugin {
  private version: string = 'latest';
  constructor() {
    super(profile);
  }
  getVersion() {
    return 0.1;
  }
  private createWorker(): ChildProcess {
    // enable --inspect for debug
    // return fork(path.join(__dirname, "compile_worker.js"), [], {
    //   execArgv: ["--inspect=" + (process.debugPort + 1)]
    // });
    return fork(path.join(__dirname, "compile_worker.js"));
  }
  compile() {
    const fileName = window.activeTextEditor ? window.activeTextEditor.document.fileName : undefined;
    const editorContent = window.activeTextEditor ? window.activeTextEditor.document.getText() : undefined;
    const sources: ISources = {};
    if (fileName) {
      sources[fileName] = {
        content: editorContent,
      };
    }
    const solcWorker = this.createWorker();
    console.log(`Solidity compiler invoked with WorkerID: ${solcWorker.pid}`);
    console.log(`Compiling with solidity version ${this.version}`);
    var input = {
      language: "Solidity",
      sources,
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    solcWorker.send({
      command: "compile",
      payload: input,
      version: this.version,
    });
    solcWorker.on("message", (m: any) => {
      console.log(`............................Solidity worker message............................`);
      console.log(m);
      if (m.error) {
        console.error(m.error);
      } else if (m.data && m.path) {
        sources[m.path] = {
          content: m.data.content,
        };
        solcWorker.send({
          command: "compile",
          payload: input,
          version: this.version,
        });
      } else if (m.compiled) {
        const compiled = JSON.parse(m.compiled);
        if(compiled.contracts) {
          const source = sources;
          const languageVersion = this.version;
          const data = m.compiled;
          this.emit('compilationFinished', fileName, source, languageVersion, data);
        }
      }
    })
  }
}