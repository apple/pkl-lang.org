// ===----------------------------------------------------------------------===//
// Copyright © 2025 Apple Inc. and the Pkl project authors. All rights reserved.
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

/**
 * Dark mode theme switcher
 * Supports three modes: light, dark, and system (auto)
 */
;(function () {
  'use strict'

  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
  }

  // Initialize theme on page load (before DOM is ready to avoid flash)
  initializeTheme()

  // Activate the dropdown once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    activateDropdown(document.getElementById('theme-select'))
  })

  function initializeTheme() {
    const savedTheme = getSavedTheme()
    const effectiveTheme = getEffectiveTheme(savedTheme)

    applyTheme(effectiveTheme)
  }

  function activateDropdown(select) {
    if (!select) return

    const savedTheme = getSavedTheme()
    select.value = savedTheme

    // Add change listener
    select.addEventListener('change', onDropdownChange)
  }

  function onDropdownChange(event) {
    const selectedTheme = event.target.value

    saveTheme(selectedTheme)

    const effectiveTheme = getEffectiveTheme(selectedTheme)
    applyTheme(effectiveTheme)
  }

  function getEffectiveTheme(theme) {
    // If system mode, determine based on system preference
    if (theme === THEMES.SYSTEM || theme === null) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? THEMES.DARK : THEMES.LIGHT
    }
    return theme
  }

  function applyTheme(theme) {
    const isDark = theme === THEMES.DARK
    document.documentElement.classList.toggle('dark-theme', isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }

  function getSavedTheme() {
    try {
      return window.localStorage && window.localStorage.getItem('theme') || THEMES.SYSTEM
    } catch (e) {
      return THEMES.SYSTEM
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage && window.localStorage.setItem('theme', theme)
    } catch (e) {
      // localStorage not available
    }
  }

  // Listen for system theme changes (only when in system mode)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      const savedTheme = getSavedTheme()

      // Only auto-switch if user is in system mode
      if (savedTheme === THEMES.SYSTEM) {
        const effectiveTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
        applyTheme(effectiveTheme)
      }
    })
  }
})()
