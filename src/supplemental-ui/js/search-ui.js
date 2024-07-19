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
;(function (globalScope) {
  /* eslint-disable no-var */
  const config = document.getElementById('search-ui-script').dataset;
  const snippetLength = parseInt(config.snippetLength || 100, 10);
  const siteRootPath = config.siteRootPath || '';
  appendStylesheet(config.stylesheet)
  const searchInput = document.getElementById('search-input');
  const searchResult = document.createElement('div');
  searchResult.classList.add('search-result-dropdown-menu')
  searchInput.parentNode.appendChild(searchResult)

  function appendStylesheet (href) {
    if (!href) return
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: href }))
  }

  function highlightText (doc, position) {
    const hits = [];
    const start = position[0];
    const length = position[1];

    const text = doc.text;
    const highlightSpan = document.createElement('span');
    highlightSpan.classList.add('search-result-highlight')
    highlightSpan.innerText = text.substr(start, length)

    const end = start + length;
    const textEnd = text.length - 1;
    const contextAfter = end + snippetLength > textEnd ? textEnd : end + snippetLength;
    const contextBefore = start - snippetLength < 0 ? 0 : start - snippetLength;
    if (start === 0 && end === textEnd) {
      hits.push(highlightSpan)
    } else if (start === 0) {
      hits.push(highlightSpan)
      hits.push(document.createTextNode(text.substr(end, contextAfter)))
    } else if (end === textEnd) {
      hits.push(document.createTextNode(text.substr(0, start)))
      hits.push(highlightSpan)
    } else {
      hits.push(document.createTextNode('...' + text.substr(contextBefore, start - contextBefore)))
      hits.push(highlightSpan)
      hits.push(document.createTextNode(text.substr(end, contextAfter - end) + '...'))
    }
    return hits
  }

  function highlightTitle (hash, doc, position) {
    const hits = [];
    const start = position[0];
    const length = position[1];

    const highlightSpan = document.createElement('span');
    highlightSpan.classList.add('search-result-highlight')
    let title;
    if (hash) {
      title = doc.titles.filter(function (item) {
        return item.id === hash
      })[0].text
    } else {
      title = doc.title
    }
    highlightSpan.innerText = title.substr(start, length)

    const end = start + length;
    const titleEnd = title.length - 1;
    if (start === 0 && end === titleEnd) {
      hits.push(highlightSpan)
    } else if (start === 0) {
      hits.push(highlightSpan)
      hits.push(document.createTextNode(title.substr(length, titleEnd)))
    } else if (end === titleEnd) {
      hits.push(document.createTextNode(title.substr(0, start)))
      hits.push(highlightSpan)
    } else {
      hits.push(document.createTextNode(title.substr(0, start)))
      hits.push(highlightSpan)
      hits.push(document.createTextNode(title.substr(end, titleEnd)))
    }
    return hits
  }

  function highlightHit (metadata, hash, doc) {
    let hits = [];
    for (const token in metadata) {
      const fields = metadata[token];
      for (const field in fields) {
        const positions = fields[field];
        if (positions.position) {
          const position = positions.position[0]; // only higlight the first match
          if (field === 'title') {
            hits = highlightTitle(hash, doc, position)
          } else if (field === 'text') {
            hits = highlightText(doc, position)
          }
        }
      }
    }
    return hits
  }

  function createSearchResult (result, store, searchResultDataset) {
    result.forEach(function (item) {
      let url = item.ref;
      let hash;
      if (url.includes('#')) {
        hash = url.substring(url.indexOf('#') + 1)
        url = url.replace('#' + hash, '')
      }
      const doc = store[url];
      const metadata = item.matchData.metadata;
      const hits = highlightHit(metadata, hash, doc);
      searchResultDataset.appendChild(createSearchResultItem(doc, item, hits))
    })
  }

  function createSearchResultItem (doc, item, hits) {
    const documentTitle = document.createElement('div');
    documentTitle.classList.add('search-result-document-title')
    documentTitle.innerText = doc.title
    const documentHit = document.createElement('div');
    documentHit.classList.add('search-result-document-hit')
    const documentHitLink = document.createElement('a');
    documentHitLink.href = siteRootPath + item.ref
    documentHit.appendChild(documentHitLink)
    hits.forEach(function (hit) {
      documentHitLink.appendChild(hit)
    })
    const searchResultItem = document.createElement('div');
    searchResultItem.classList.add('search-result-item')
    searchResultItem.appendChild(documentTitle)
    searchResultItem.appendChild(documentHit)
    searchResultItem.addEventListener('mousedown', function (e) {
      e.preventDefault()
    })
    return searchResultItem
  }

  function createNoResult (text) {
    const searchResultItem = document.createElement('div');
    searchResultItem.classList.add('search-result-item')
    const documentHit = document.createElement('div');
    documentHit.classList.add('search-result-document-hit')
    const message = document.createElement('strong');
    message.innerText = 'No results found for query "' + text + '"'
    documentHit.appendChild(message)
    searchResultItem.appendChild(documentHit)
    return searchResultItem
  }

  function clearSearchResults (reset) {
    if (reset === true) searchInput.value = ''
    searchResult.innerHTML = ''
  }

  function search (index, text) {
    // execute an exact match search
    let result = index.search(text);
    if (result.length > 0) {
      return result
    }
    // no result, use a begins with search
    result = index.search(text + '*')
    if (result.length > 0) {
      return result
    }
    // no result, use a contains search
    result = index.search('*' + text + '*')
    return result
  }

  function searchIndex (index, store, text) {
    clearSearchResults(false)
    if (text.trim() === '') {
      return
    }
    const result = search(index, text);
    const searchResultDataset = document.createElement('div');
    searchResultDataset.classList.add('search-result-dataset')
    searchResult.appendChild(searchResultDataset)
    if (result.length > 0) {
      createSearchResult(result, store, searchResultDataset)
    } else {
      searchResultDataset.appendChild(createNoResult(text))
    }
  }

  function confineEvent (e) {
    e.stopPropagation()
  }

  function debounce (func, wait, immediate) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null
        if (!immediate) func.apply(context, args)
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(context, args)
    }
  }

  function initSearch (lunr, data) {
    const index = Object.assign({index: lunr.Index.load(data.index), store: data.store});
    const debug = 'URLSearchParams' in globalScope && new URLSearchParams(globalScope.location.search).has('lunr-debug');
    searchInput.addEventListener(
      'keydown',
      debounce(function (e) {
        const query = searchInput.value;
        if (e.key === 'Escape' || e.key === 'Esc') return clearSearchResults(true)
        try {
          if (!query) return clearSearchResults()
          searchIndex(index.index, index.store, searchInput.value)
        } catch (err) {
          if (debug) console.debug('Invalid search query: ' + query + ' (' + err.message + ')')
        }
      }, 100)
    )
    searchInput.addEventListener('click', confineEvent)
    searchResult.addEventListener('click', confineEvent)
    document.documentElement.addEventListener('click', clearSearchResults)
  }

  globalScope.initSearch = initSearch
})(typeof globalThis !== 'undefined' ? globalThis : window)
