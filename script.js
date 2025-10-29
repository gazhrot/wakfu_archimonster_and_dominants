document.addEventListener('DOMContentLoaded', () => {

    const cardContainer = document.getElementById('card-container');
    const searchInput = document.getElementById('searchInput');
    const monsterCount = document.getElementById('monster-count');
    const filterResetBtn = document.getElementById('filterReset');
    const optiCheckbox = document.getElementById('filter-opti');

    let allData = [];
    let currentData = [];
    const tranches = [230, 215, 200, 185, 170, 155, 140, 125, 110, 95, 80, 65, 50, 35, 20];

    /**
     * @param {number} level - (ex: monster.niveau_min)
     * @returns {number|string} - La tranche (ex: 20, 35...) ou 'N/A'
     */
    function getTrancheForLevel(level) {
        return tranches.find(tranche => level >= tranche) || 'N/A';
    }

    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allData = data.map(monster => {
                 const mappedLoots = (monster.loots || []).map(loot => ({
                     ...loot,
                     image_url: loot.image_url || 'https://via.placeholder.com/48?text=?',
                     rarity_key: loot.rarity_key || 'common'
                 }));

                return {
                    ...monster,
                    loots: mappedLoots
                };
            });

            currentData = [...allData];
            renderCards(currentData);
        })
        .catch(error => {
            console.error("Error loading data.json:", error);
            cardContainer.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load <strong>data.json</strong>. Check console (F12).</p>`;
        });

    function renderCards(dataToRender) {
        cardContainer.innerHTML = '';
        monsterCount.textContent = `${dataToRender.length} monster(s) found.`;

        if (dataToRender.length === 0) {
             cardContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No monsters match your search.</p>`;
            return;
        }

        dataToRender.forEach(monster => {
            const card = document.createElement('div');
            card.className = 'monster-card';

            const monsterLevel = monster.niveau_min; // On utilise le niveau minimum
            const trancheMonster = getTrancheForLevel(monsterLevel);

            const lootsHtml = monster.loots.map(loot => {
                const rarityKey = loot.rarity_key;
                const cleanName = loot.nom.replace(/ \((épique|relique|déco|ressource)\)/i, '');
                const optiClass = loot.is_opti ? 'loot-is-opti' : '';

                return `
                <a href="${loot.url}" target="_blank" class="loot-card rarity-${rarityKey} ${optiClass}" title="${loot.nom}">
                    <div class="loot-image-wrapper">
                        <img src="${loot.image_url}" alt="${cleanName}" class="loot-image" loading="lazy">
                    </div>
                    <span class="loot-name">${cleanName}</span>
                </a>
                `;
            }).join('');

            card.innerHTML = `
                <div class="card-header">
                    <div class="monster-image-wrapper">
                        <img src="${monster.image}" alt="${monster.nom}" class="monster-image" loading="lazy">
                    </div>
                    <div class="monster-info">
                        <h2 class="monster-name"><a href="${monster.url_monstre}" target="_blank" style="color: inherit; text-decoration: none;">${monster.nom}</a></h2>
                        <p class="monster-location">${monster.localisation || 'N/A'}</p>
                    </div>
                </div>
                <div class="loots-section">
                    <div class="loots-grid">
                        ${lootsHtml}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="footer-item">
                        <span class="footer-label">Tranche</span>
                        <span class="footer-value">${trancheMonster || 'N/A'}</span>
                    </div>
                    <div class="footer-divider"></div>
                    <div class="footer-item">
                        <span class="footer-label">Respawn</span>
                        <span class="footer-value">${monster.source_event || 'N/A'}</span>
                    </div>
                </div>
            `;
            cardContainer.appendChild(card);
        });
    }

    function applyFiltersAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const isOptiChecked = optiCheckbox.checked;

        let filteredData = allData;

        if (isOptiChecked) {
            filteredData = filteredData.filter(monstre => {
                return monstre.loots && monstre.loots.some(loot => loot.is_opti === true);
            });
        }

        if (searchTerm) {
            filteredData = filteredData.filter(monster => {
                const nameMatch = monster.nom.toLowerCase().includes(searchTerm);
                const locMatch = (monster.localisation || '').toLowerCase().includes(searchTerm);
                const lootMatch = monster.loots.some(loot => loot.nom.toLowerCase().includes(searchTerm));
                return nameMatch || locMatch || lootMatch;
            });
        }
        
        currentData = filteredData;
        renderCards(currentData);
    }

    searchInput.addEventListener('input', applyFiltersAndRender);
    optiCheckbox.addEventListener('change', applyFiltersAndRender);

});