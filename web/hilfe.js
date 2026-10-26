// SPDX-License-Identifier: MIT
// One base address for the project help page. Section links add a hash.

import { REPO_PUBLIC } from './version.js';

export const HILFE_BASIS = 'https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/';

export const HILFE_ANKER = ['display', 'sound', 'home-assistant', 'gestures', 'corners', 'states', 'security', 'demo', 'credits', 'requirements', 'dashboard', 'phone'];

const GITHUB = {
  maintainer: 'https://github.com/stefanvr82',
  repo: 'https://github.com/stefanvr82/grok-bot-home-assistant-ui',
  sponsors: 'https://github.com/sponsors/stefanvr82',
};

// Pass true or false to check both states. The default follows REPO_PUBLIC.
export function repoLinks(offen = REPO_PUBLIC) {
  if (offen) {
    return {
      public: true,
      maintainer: GITHUB.maintainer,
      repo: GITHUB.repo,
      sponsors: GITHUB.sponsors,
      repoLabel: 'GitHub',
      supportLabel: 'GitHub Sponsors',
    };
  }
  return {
    public: false,
    maintainer: '',
    repo: '',
    sponsors: '',
    repoLabel: '',
    supportLabel: '',
  };
}

const github = repoLinks();

export const LINKS = {
  changelog: `${HILFE_BASIS}#changelog`,
  credits: `${HILFE_BASIS}#credits`,
  hvuz: 'https://www.herrvonundzu.eu/digitalisierung-automatisierung-4',
  idea: 'https://x.com/Texas_Twins_Dad/status/2114196344025878632',
};
if (github.maintainer) LINKS.maintainer = github.maintainer;
if (github.repo) LINKS.repo = github.repo;
if (github.sponsors) LINKS.sponsors = github.sponsors;

export function hilfeUrl(anker) {
  const id = HILFE_ANKER.includes(anker) ? anker : 'display';
  return `${HILFE_BASIS}#${id}`;
}
