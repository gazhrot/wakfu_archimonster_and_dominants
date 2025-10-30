document.addEventListener('DOMContentLoaded', () => {

    const wakfuFilterApp = {
        
        data: {
            allMonsters: [],
        },

        state: {
            search: '',
            opti: false,
            tranches: new Set()
        },
        
        elements: {},

        init() {
            this.cacheElements();
            this.readStateFromURL();
            this.updateStateFromDOM();
            this.attachListeners();
            this.fetchData();
        },

        cacheElements() {
            this.elements.cardContainer = document.getElementById('card-container');
            this.elements.searchInput = document.getElementById('searchInput');
            this.elements.monsterCount = document.getElementById('monster-count');
            this.elements.optiCheckbox = document.getElementById('filter-opti');
            this.elements.trancheFilterContainer = document.querySelector('.tranche-checkboxes');
            this.elements.monsterCardTemplate = document.getElementById('monster-card-template');
            this.elements.lootCardTemplate = document.getElementById('loot-card-template');
            this.elements.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        },

        attachListeners() {
            this.elements.searchInput.addEventListener('input', () => this.handleFilterChange());
            this.elements.optiCheckbox.addEventListener('change', () => this.handleFilterChange());
            this.elements.trancheFilterContainer.addEventListener('change', () => this.handleFilterChange());
            this.elements.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        },

        fetchData() {
            fetch('data.json')
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    this.data.allMonsters = data;
                    this.render();
                })
                .catch(error => {
                    console.error("Error loading data.json:", error);
                    this.elements.cardContainer.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load <strong>data.json</strong>. Check console (F12).</p>`;
                });
        },

        updateStateFromDOM() {
            this.state.search = this.elements.searchInput.value.toLowerCase().trim();
            this.state.opti = this.elements.optiCheckbox.checked;

            const selectedTrancheNodes = this.elements.trancheFilterContainer.querySelectorAll('input[name="tranche"]:checked');
            this.state.tranches = new Set(Array.from(selectedTrancheNodes).map(input => input.value));
        },

        readStateFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            
            const tranchesFromUrl = urlParams.get('tranche');
            if (tranchesFromUrl) {
                const tranchesToSelect = new Set(tranchesFromUrl.split(','));
                this.elements.trancheFilterContainer.querySelectorAll('input[name="tranche"]').forEach(checkbox => {
                    checkbox.checked = tranchesToSelect.has(checkbox.value);
                });
            }
            
            this.elements.searchInput.value = urlParams.get('search') || '';
            
            this.elements.optiCheckbox.checked = urlParams.get('opti') === 'true';
        },

        updateURLFromState() {
            const urlParams = new URLSearchParams(window.location.search);

            if (this.state.tranches.size > 0) {
                urlParams.set('tranche', [...this.state.tranches].join(','));
            } else {
                urlParams.delete('tranche');
            }
            
            if (this.state.search) {
                urlParams.set('search', this.state.search);
            } else {
                urlParams.delete('search');
            }
            
            if (this.state.opti) {
                urlParams.set('opti', 'true');
            } else {
                urlParams.delete('opti');
            }

            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.replaceState({path: newUrl}, '', newUrl);
        },

        handleFilterChange() {
            this.updateStateFromDOM();
            this.updateURLFromState();
            this.render();
        },

        clearAllFilters() {
            this.elements.searchInput.value = '';
            this.elements.optiCheckbox.checked = false;
            
            this.elements.trancheFilterContainer.querySelectorAll('input[name="tranche"]:checked').forEach(checkbox => {
                checkbox.checked = false;
            });

            this.handleFilterChange();
        },

        getFilteredData() {
            const { search, opti, tranches } = this.state;
            
            const showAllTranches = tranches.size === 0;
            const selectedTranchesNumeric = [...tranches].map(t => parseInt(t, 10)).filter(t => !isNaN(t));
            const showNA = tranches.has('N/A');

            return this.data.allMonsters.filter(monster => {
                if (opti && !(monster.loots && monster.loots.some(loot => loot.is_opti === true))) {
                    return false;
                }

                if (!showAllTranches) {
                    const monsterTranche = monster.tranche;
                    if (monsterTranche === 'N/A') {
                        if (!showNA) return false;
                    } else {
                        if (!selectedTranchesNumeric.includes(monsterTranche)) return false;
                    }
                }
                
                if (search) {
                    const nameMatch = (monster.nom || '').toLowerCase().includes(search);
                    const locMatch = (monster.localisation || '').toLowerCase().includes(search);
                    const lootMatch = (monster.loots || []).some(loot => (loot.nom || '').toLowerCase().includes(search));
                    const trancheMatch = (monster.tranche || '').toString().includes(search);
                    
                    if (!(nameMatch || locMatch || lootMatch || trancheMatch)) {
                        return false;
                    }
                }
                
                return true; 
            });
        },

        render() {
            const filteredData = this.getFilteredData();
            
            this.elements.cardContainer.innerHTML = '';
            
            this.elements.monsterCount.textContent = `${filteredData.length} monster(s) found.`;

            if (filteredData.length === 0) {
                 this.elements.cardContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No monsters match your search.</p>`;
                return;
            }

            const fragment = document.createDocumentFragment();
            filteredData.forEach(monster => {
                const monsterCard = this.createMonsterCard(monster);
                fragment.appendChild(monsterCard);
            });
            
            this.elements.cardContainer.appendChild(fragment);
        },

        createMonsterCard(monster) {
            const clone = this.elements.monsterCardTemplate.content.cloneNode(true);
            const cardElement = clone.querySelector('.monster-card');
            
            cardElement.querySelector('[data-name]').textContent = monster.nom || 'N/A';
            cardElement.querySelector('[data-name]').href = monster.url_monstre || '#';
            cardElement.querySelector('[data-url-monstre]').href = monster.url_monstre || '#';
            cardElement.querySelector('[data-image-src]').src = monster.image || '';
            cardElement.querySelector('[data-image-src]').alt = monster.nom || '';
            cardElement.querySelector('[data-location]').textContent = monster.localisation || 'N/A';
            cardElement.querySelector('[data-respawn]').textContent = monster.source_event || 'N/A';
            
            const trancheText = (monster.tranche === 'N/A' || !monster.tranche) ? 'N/A' : `${monster.tranche}`;
            cardElement.querySelector('[data-tranche]').textContent = trancheText;
            
            const lootsGrid = cardElement.querySelector('[data-loots-grid]');
            if (monster.loots && monster.loots.length > 0) {
                monster.loots.forEach(loot => {
                    const lootCard = this.createLootCard(loot);
                    lootsGrid.appendChild(lootCard);
                });
            }

            return cardElement;
        },

        createLootCard(loot) {
            const clone = this.elements.lootCardTemplate.content.cloneNode(true);
            const lootElement = clone.querySelector('a.loot-card');
            
            const cleanName = (loot.nom || '').replace(/ \((épique|relique|déco|ressource)\)/i, '');
            
            lootElement.href = loot.url || '#';
            lootElement.title = loot.nom || '';
            lootElement.classList.add(`rarity-${loot.rarity_key || 'common'}`);
            
            lootElement.querySelector('[data-name]').textContent = cleanName;
            lootElement.querySelector('[data-image-src]').src = loot.image_url || '';
            lootElement.querySelector('[data-image-src]').alt = cleanName;
            
            if (loot.is_opti) {
                lootElement.classList.add('loot-is-opti');
            }
            
            return lootElement;
        }

    };

    wakfuFilterApp.init();
});