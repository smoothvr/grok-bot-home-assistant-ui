// SPDX-License-Identifier: MIT
// Runtime gaps on iOS 10. Syntax is handled by the legacy bundle.

if (typeof Object.fromEntries !== 'function') {
  Object.fromEntries = function fromEntries(entries) {
    const out = {};
    const list = Array.isArray(entries) ? entries : Array.from(entries);
    for (let i = 0; i < list.length; i++) out[list[i][0]] = list[i][1];
    return out;
  };
}

if (typeof String.prototype.replaceAll !== 'function') {
  String.prototype.replaceAll = function replaceAll(search, replacement) {
    if (search instanceof RegExp) {
      if (!search.global) throw new TypeError('replaceAll called with a non-global RegExp');
      return this.replace(search, replacement);
    }
    return String(this).split(String(search)).join(String(replacement));
  };
}

if (typeof Element !== 'undefined' && typeof Element.prototype.replaceChildren !== 'function') {
  Element.prototype.replaceChildren = function replaceChildren() {
    while (this.firstChild) this.removeChild(this.firstChild);
    for (let i = 0; i < arguments.length; i++) {
      const node = arguments[i];
      this.appendChild(node && node.nodeType ? node : document.createTextNode(String(node)));
    }
  };
}
