document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-url-form');
    const urlList = document.getElementById('url-list');
    const urlInput = document.getElementById('url');
    const urlSearchInput = document.getElementById('url-search');
    const statusFilterSelect = document.getElementById('status-filter');
    const deleteAllUrlsBtn = document.getElementById('delete-all-urls-btn');
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageNumber = document.getElementById('page-number');

    let urls = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    const extractBaseDomain = (url) => new URL(url).hostname;

    const daysUntilExpiration = (valid_to) => {
        const validToDate = new Date(valid_to);
        return Math.ceil((validToDate - new Date()) / (1000 * 60 * 60 * 24));
    };

    const showAlert = (message, type = 'error') => {
        const alertBox = document.createElement('div');
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        document.body.appendChild(alertBox);

        setTimeout(() => {
            alertBox.classList.add('fade-out');
            alertBox.addEventListener('animationend', () => alertBox.remove());
        }, 2000);
    };

    const filterUrls = () => {
        const searchQuery = urlSearchInput.value.toLowerCase();
        const statusFilter = statusFilterSelect.value;

        const filteredUrls = urls.filter(({ domain, status }) =>
            domain.toLowerCase().includes(searchQuery) &&
            (statusFilter === 'all' || status === statusFilter)
        );

        updateUrlList(filteredUrls);
    };

    const updateUrlList = (urlsToDisplay) => {
        urlList.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUrls = urlsToDisplay.slice(startIndex, startIndex + itemsPerPage);

        paginatedUrls.forEach(({ domain, status, valid_from, valid_to }) => {
            const li = document.createElement('li');
            const statusClass = status === 'Valid' ? 'valid' : status === 'Expired' ? 'expired' : 'expiring';
            const daysLeft = daysUntilExpiration(valid_to);
            const domainLink = `<a href="https://${domain}" target="_blank" class="domain-link">${domain}</a>`;

            li.innerHTML = `
                <span><strong>${domainLink}</strong>: Valid From: ${valid_from}, Valid To: ${valid_to} (${daysLeft} days left)</span>
                <span>
                    <span class="status ${statusClass}">${status}</span>
                    <button class="delete-btn" data-domain="${domain}">Delete</button>
                    <button class="dns-info-btn" data-domain="${domain}">DNS Info</button>
                </span>
            `;

            li.querySelector('.delete-btn').addEventListener('click', () => deleteUrl(domain, li));
            li.querySelector('.dns-info-btn').addEventListener('click', () => showDnsWhoisInfo(domain));
            urlList.appendChild(li);
        });

        pageNumber.textContent = `Page ${currentPage}`;

        const totalPages = Math.ceil(urlsToDisplay.length / itemsPerPage);
        pagination.style.display = totalPages > 1 ? 'block' : 'none';
    };

    const fetchUrls = async () => {
        try {
            const response = await fetch('/get_urls');
            const data = await response.json();
            urls = Object.entries(data).map(([domain, { status, valid_from, valid_to }]) => ({
                domain, status, valid_from, valid_to
            }));
            filterUrls();
        } catch (error) {
            handleError(error);
        }
    };

    const addUrl = async (url) => {
        const newDomain = extractBaseDomain(url);

        if (urls.some(url => url.domain === newDomain)) {
            highlightExistingUrl(newDomain);
            showAlert("This URL has already been added.");
            return;
        }

        try {
            const response = await fetch('/add_url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (result.message === 'URL added successfully') {
                const { status, valid_from, valid_to } = result.data;
                const newUrl = { domain: newDomain, status, valid_from, valid_to };
                urls.push(newUrl);
                filterUrls();
                highlightNewUrl(newUrl);
            } else {
                alert(result.message || 'Unknown error');
            }
        } catch (error) {
            handleError(error);
        }
    };

    const highlightNewUrl = (newUrl) => {
        const listItems = urlList.getElementsByTagName('li');
        Array.from(listItems).forEach(li => {
            if (li.querySelector('.domain-link').textContent === newUrl.domain) {
                li.classList.add('highlight');
                setTimeout(() => li.classList.remove('highlight'), 2000);
            }
        });
    };

    const highlightExistingUrl = (domain) => {
        const listItems = urlList.getElementsByTagName('li');
        Array.from(listItems).forEach(li => {
            if (li.querySelector('.domain-link').textContent === domain) {
                li.classList.add('highlight-error');
                setTimeout(() => li.classList.remove('highlight-error'), 2000);
            }
        });
    };

    const formatDnsWhoisInfo = (dnsInfo, whoisInfo) => {
        let formattedDnsInfo = "DNS Info:\n";
        if (typeof dnsInfo === 'string') {
            formattedDnsInfo += dnsInfo;
        } else {
            formattedDnsInfo += Object.entries(dnsInfo)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
        }

        let formattedWhoisInfo = "\n\nWHOIS Info:\n";
        if (typeof whoisInfo === 'string') {
            formattedWhoisInfo += whoisInfo;
        } else {
            formattedWhoisInfo += Object.entries(whoisInfo)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
        }

        return formattedDnsInfo + formattedWhoisInfo;
    };

    const showDnsWhoisInfo = async (domain) => {
        try {
            const response = await fetch('/get_dns_whois_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                const { dns_info, whois_info } = data;
                const formattedInfo = formatDnsWhoisInfo(dns_info, whois_info);
                const listItems = urlList.getElementsByTagName('li');
                const targetLi = Array.from(listItems).find(li => 
                    li.querySelector('.domain-link').textContent === domain
                );
    
                if (targetLi) {
                    const infoBlock = document.createElement('div');
                    infoBlock.className = 'dns-info-block';
    
                    const infoContainer = document.createElement('div');
                    infoContainer.className = 'info-container';
                    
                    const infoText = document.createElement('span');
                    infoText.textContent = formattedInfo;
                    infoContainer.appendChild(infoText);
    
                    const closeButton = document.createElement('button');
                    closeButton.className = 'close-button';
                    closeButton.innerHTML = '&times;';
                    closeButton.addEventListener('click', () => {
                        infoBlock.remove();
                    });
                    infoContainer.appendChild(closeButton);
    
                    infoBlock.appendChild(infoContainer);
                    targetLi.appendChild(infoBlock);
    
                    setTimeout(() => {
                        infoBlock.remove();
                    }, 60000);
                }
            } else {
                alert(data.error || 'Failed to retrieve DNS and WHOIS information');
            }
        } catch (error) {
            handleError(error);
        }
    };

    const deleteUrl = async (domain, li) => {
        try {
            const response = await fetch('/delete_url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });

            if (response.ok) {
                urls = urls.filter(url => url.domain !== domain);
                li.classList.add('deleted-highlight');

                setTimeout(() => {
                    li.remove();
                    const totalPages = Math.ceil(urls.length / itemsPerPage);

                    if (currentPage > totalPages) {
                        currentPage = totalPages;
                    }

                    if (urls.length === 0 || (currentPage - 1) * itemsPerPage >= urls.length) {
                        currentPage = Math.max(1, currentPage - 1);
                    }

                    filterUrls(true);
                }, 2000);
            } else {
                const error = await response.json();
                alert(error.error || 'Error occurred');
            }
        } catch (error) {
            handleError(error);
        }
    };

    const deleteAllUrls = async () => {
        try {
            const response = await fetch('/delete_all_urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                urls = [];
                updateUrlList([]);
            } else {
                const error = await response.json();
                alert(error.error || 'Error occurred while deleting all URLs');
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleError = (error) => {
        console.error('Error details:', error);
        alert("An error occurred. Please try again later.");
    };

    urlSearchInput.addEventListener('input', filterUrls);
    statusFilterSelect.addEventListener('change', filterUrls);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (url) {
            await addUrl(url);
            urlInput.value = '';
        } else {
            alert("Please enter a valid URL.");
        }
    });

    deleteAllUrlsBtn.addEventListener('click', deleteAllUrls);

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterUrls();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(urls.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            filterUrls();
        }
    });

    fetchUrls();
    setInterval(fetchUrls, 60000);
});