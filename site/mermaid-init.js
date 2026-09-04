window.addEventListener('load', () => {
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, theme: 'base' });
    window.mermaid.run({ nodes: document.querySelectorAll('.mermaid-block') });
  }
});
