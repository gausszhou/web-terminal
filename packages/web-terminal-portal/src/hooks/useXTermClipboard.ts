import { Terminal } from 'xterm';

export function useXTermClipboard(terminal: Terminal) {
  // 复制
  terminal.attachCustomKeyEventHandler(arg => {
    if (arg.ctrlKey && arg.code === 'KeyC' && arg.type === 'keydown') {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        return false;
      }
    }
    return true;
  });

  // 粘贴
  const paste = async () => {
    const selection = await navigator.clipboard.readText();
    if (selection) {
      terminal.paste(selection);
      return false;
    }
  };
  terminal.attachCustomKeyEventHandler(arg => {
    if (arg.ctrlKey && arg.code === 'KeyV' && arg.type === 'keydown') {
      paste();
    }
    return true;
  });
}
