const REPLACEMENTS = {
  'connection': 'friend',
  'connections': 'friends'
};

const OBSERVER_CONFIG = {
  childList: true,
  subtree: true,
  characterData: true,
  characterDataOldValue: true
};

const regex = new RegExp(
  `\\b(${Object.keys(REPLACEMENTS).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'gi'
);

const adjustCase = (original, replacement) => {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

function replaceNodeText(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    const newText = root.textContent.replace(regex, match => {
      const lower = match.toLowerCase();
      return REPLACEMENTS[lower]
        ? adjustCase(match, REPLACEMENTS[lower])
        : match;
    });
    if (newText !== root.textContent) {
      root.textContent = newText;
    }
    return;
  }

  const skipTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'IFRAME', 'OPTION']);
  if (skipTags.has(root.nodeName)) return;

  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node =>
        node.parentNode && !skipTags.has(node.parentNode.nodeName)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
    }
  );

  const textNodes = [];
  while (treeWalker.nextNode()) {
    textNodes.push(treeWalker.currentNode);
  }

  textNodes.forEach(node => {
    const newText = node.textContent.replace(regex, match => {
      const lower = match.toLowerCase();
      return REPLACEMENTS[lower]
        ? adjustCase(match, REPLACEMENTS[lower])
        : match;
    });
    if (newText !== node.textContent) {
      node.textContent = newText;
    }
  });
}

function initObserver() {
  if (window.textObserver) window.textObserver.disconnect();

  window.textObserver = new MutationObserver(mutations => {
    textObserver.disconnect();

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        if (mutation.target.textContent !== mutation.oldValue) {
          replaceNodeText(mutation.target);
        }
      }
      else if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            replaceNodeText(node);
          }
          else if (node.nodeType === Node.ELEMENT_NODE) {
            replaceNodeText(node);
          }
        }
      }
    }

    textObserver.observe(document.body, OBSERVER_CONFIG);
  });

  textObserver.observe(document.body, OBSERVER_CONFIG);
}

function init() {
  replaceNodeText(document.body);
  initObserver();
}

if (document.body) {
  init();
} 
else {
  const bodyObserver = new MutationObserver((_, observer) => {
    if (document.body) {
      observer.disconnect();
      init();
    }
  });
  bodyObserver.observe(document.documentElement, { childList: true });
}

document.addEventListener('DOMContentLoaded', init);