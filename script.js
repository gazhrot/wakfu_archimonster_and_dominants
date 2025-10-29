document.addEventListener('DOMContentLoaded', () => {

    const cardContainer = document.getElementById('card-container');
    const searchInput = document.getElementById('searchInput');
    const monsterCount = document.getElementById('monster-count');
    const filterResetBtn = document.getElementById('filterReset');

    let allData = [];
    let currentData = [];

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

            const lootsHtml = monster.loots.map(loot => {
                const rarityKey = loot.rarity_key;
                const cleanName = loot.nom.replace(/ \((épique|relique|déco|ressource)\)/i, '');

                return `
                <a href="${loot.url}" target="_blank" class="loot-card rarity-${rarityKey}" title="${loot.nom}">
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
                    <h3 class="section-title">Loots</h3>
                    <div class="loots-grid">
                        ${lootsHtml}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="footer-item">
                        <span class="footer-label">Level</span>
                        <span class="footer-value">${monster.niveau_str || 'N/A'}</span>
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

    function applySearchAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            currentData = [...allData];
        } else {
            currentData = allData.filter(monster => {
                const nameMatch = monster.nom.toLowerCase().includes(searchTerm);
                const locMatch = (monster.localisation || '').toLowerCase().includes(searchTerm);
                const lootMatch = monster.loots.some(loot => loot.nom.toLowerCase().includes(searchTerm));
                return nameMatch || locMatch || lootMatch;
            });
        }
        renderCards(currentData);
    }

    searchInput.addEventListener('input', applySearchAndRender);

    filterResetBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentData = [...allData];
        renderCards(currentData);
    });

});