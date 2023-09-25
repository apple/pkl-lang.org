// ===----------------------------------------------------------------------===//
// Copyright © 2024 Apple Inc. and the Pkl project authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===----------------------------------------------------------------------===//
(function () {
  // Opens <details> blocks if anchor tags target elements inside them.
  const openTarget = () => {
    const hash = window.location.hash;
    if (hash.length === 0) {
      return;
    }
    const target = document.querySelector(hash);
    if (!target) {
      return;
    }
    const details = target.closest("details");
    if (!details) {
      return;
    }
    details.open = true;
  }
  window.addEventListener("hashchange", openTarget);
  openTarget();

  window.addEventListener("load", function () {
    const tablists = document.querySelectorAll('[role=tablist].automatic');
    for (let i = 0; i < tablists.length; i++) {
      new Tabs(tablists[i], i === 0);
    }
  });
})();

class Tabs {
  constructor(node, autoScroll) {
    this.tabs = [];
    this.firstTab = null;
    this.lastTab = null;
    this.tabSelected = false;
    this.tabIndex = 0;

    this.tabs = Array.from(node.querySelectorAll('[role=tab]'));
    this.tabpanels = [];

    for (let i = 0; i < this.tabs.length; i += 1) {
      const tab = this.tabs[i];
      const tabpanel = document.getElementById(tab.getAttribute('aria-controls'));

      tab.tabIndex = -1;
      tab.setAttribute('aria-selected', 'false');
      this.tabpanels.push(tabpanel);

      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tab;
      }
      this.lastTab = tab;
    }

    this.setSelectedTab(this.firstTab, false);
  }

  setSelectedTab(currentTab, setFocus = true) {
    for (let i = 0; i < this.tabs.length; i += 1) {
      const tab = this.tabs[i];
      if (currentTab === tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.removeAttribute('tabindex');
        this.tabpanels[i].classList.remove('is-hidden');
        if (setFocus) {
          tab.focus();
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.tabIndex = -1;
        this.tabpanels[i].classList.add('is-hidden');
      }
    }
  }

  setSelectedToPreviousTab(currentTab) {
    let index;
    if (currentTab === this.firstTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab, setFocus = true) {
    let index;
    if (currentTab === this.lastTab) {
      this.setSelectedTab(this.firstTab, setFocus);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index + 1], setFocus);
    }
  }

  /* EVENT HANDLERS */

  onKeydown(event) {
    const tgt = event.currentTarget;
    let flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.setSelectedToPreviousTab(tgt);
        this.tabSelected = true;
        flag = true;
        break;

      case 'ArrowRight':
        this.setSelectedToNextTab(tgt);
        this.tabSelected = true;
        flag = true;
        break;

      case 'Home':
        this.setSelectedTab(this.firstTab);
        this.tabSelected = true;
        flag = true;
        break;

      case 'End':
        this.setSelectedTab(this.lastTab);
        this.tabSelected = true;
        flag = true;
        break;

      default:
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event) {
    this.setSelectedTab(event.currentTarget);
    this.tabSelected = true;
  }

}
