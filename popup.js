document.addEventListener("DOMContentLoaded", function() {
    // Element references
    const scrapeAllBtn = document.getElementById("scrapeAllBtn");
    const selectAllBtn = document.getElementById("selectAllBtn");
    const deselectAllBtn = document.getElementById("deselectAllBtn");
    const downloadJsonBtn = document.getElementById("downloadJsonBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");
    const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
    const downloadImagesBtn = document.getElementById("downloadImagesBtn");
    const contentTypesContainer = document.getElementById("contentTypes");
    const statusMessage = document.getElementById("statusMessage");
    const progressContainer = document.getElementById("progressContainer");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const headingCount = document.getElementById("headingCount");
    const paragraphCount = document.getElementById("paragraphCount");
    const linkCount = document.getElementById("linkCount");
    const imageCount = document.getElementById("imageCount");
    const filterHeading = document.getElementById("filterHeading");
    const filterParagraph = document.getElementById("filterParagraph");
    const filterLink = document.getElementById("filterLink");
    const filterImage = document.getElementById("filterImage");
    const filterText = document.getElementById("filterText");
    const filterList = document.getElementById("filterList");
    const filterTable = document.getElementById("filterTable");
    const filterCode = document.getElementById("filterCode");

    // State variables
    let selectedItems = [];
    let allContent = [];
    let filteredContent = [];

    // Initialize event listeners
    function initEventListeners() {
        scrapeAllBtn.addEventListener("click", scrapeEntirePage);
        selectAllBtn.addEventListener("click", selectAllItems);
        deselectAllBtn.addEventListener("click", deselectAllItems);
        downloadJsonBtn.addEventListener("click", () => downloadSelectedContent("json"));
        downloadCsvBtn.addEventListener("click", () => downloadSelectedContent("csv"));
        downloadHtmlBtn.addEventListener("click", () => downloadSelectedContent("html"));
        downloadImagesBtn.addEventListener("click", () => downloadSelectedContent("png"));

        // Filter change listeners
        [
            filterHeading, filterParagraph, filterLink, filterImage,
            filterText, filterList, filterTable, filterCode
        ].forEach(filter => {
            filter.addEventListener("change", handleFilterChange);
        });
    }

    // Handle filter changes
    function handleFilterChange() {
        if (allContent.length > 0) {
            filterContent();
            updateSelectedItems();
        }
    }

    // Filter content based on active filters
    function filterContent() {
        const activeFilters = getActiveFilters();
        filteredContent = allContent.filter(item => activeFilters[item.type]);
        displayContentTypes(filteredContent);
    }

    // Get currently active filters
    function getActiveFilters() {
        return {
            Heading: filterHeading.checked,
            Paragraph: filterParagraph.checked,
            Link: filterLink.checked,
            Image: filterImage.checked,
            Text: filterText.checked,
            List: filterList.checked,
            Table: filterTable.checked,
            Code: filterCode.checked
        };
    }

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case "content_detected":
                displayContentTypes(message.content);
                updateContentStats(message.content);
                break;
            case "scraped_data":
                allContent = message.data;
                displayContentTypes(allContent);
                updateContentStats(allContent);
                updateStatus("Content scraped successfully!", "success");
                hideProgress();
                break;
            case "scraping_progress":
                updateProgress(message.progress);
                break;
            case "error":
                updateStatus(message.message, "error");
                hideProgress();
                break;
        }
    });

    function scrapeEntirePage() {
        updateStatus("Scraping page content...", "info");
        showProgress();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: scrapeAllContent
            });
        });
    }

    // Select all visible (filtered) items
    function selectAllItems() {
        const activeFilters = getActiveFilters();
        document.querySelectorAll(".content-item").forEach(item => {
            if (activeFilters[item.dataset.type]) {
                item.classList.add("selected");
            }
        });
        updateSelectedItems();
    }

    // Deselect all items (including hidden ones)
    function deselectAllItems() {
        document.querySelectorAll(".content-item").forEach(item => {
            item.classList.remove("selected");
        });
        updateSelectedItems();
    }

    function updateContentStats(content) {
        const counts = {
            heading: 0,
            paragraph: 0,
            link: 0,
            image: 0,
            text: 0,
            list: 0,
            table: 0,
            code: 0
        };
    
        content.forEach(item => {
            switch(item.type) {
                case "Heading":
                    counts.heading++;
                    break;
                case "Paragraph":
                    counts.paragraph++;
                    break;
                case "Link":
                    counts.link++;
                    break;
                case "Image":
                    counts.image++;
                    break;
                case "Text":
                    counts.text++;
                    break;
                case "List":
                    counts.list++;
                    break;
                case "Table":
                    counts.table++;
                    break;
                case "Code":
                    counts.code++;
                    break;
            }
        });
    
        // Update the DOM elements
        headingCount.textContent = counts.heading;
        paragraphCount.textContent = counts.paragraph;
        linkCount.textContent = counts.link;
        imageCount.textContent = counts.image;
        textCount.textContent = counts.text;
        listCount.textContent = counts.list;
        tableCount.textContent = counts.table;
        codeCount.textContent = counts.code;
    }

    // Display content types in the UI
    function displayContentTypes(content) {
        contentTypesContainer.innerHTML = "";
        
        // Group content by type
        const contentGroups = {};
        content.forEach(item => {
            if (!contentGroups[item.type]) {
                contentGroups[item.type] = [];
            }
            contentGroups[item.type].push(item);
        });

        // Create UI for each content type
        for (const [type, items] of Object.entries(contentGroups)) {
            const typeHeader = document.createElement("div");
            typeHeader.className = "content-type-header";
            typeHeader.textContent = `${type} (${items.length})`;
            contentTypesContainer.appendChild(typeHeader);

            items.forEach((item, index) => {
                const contentItem = document.createElement("div");
                contentItem.className = "content-item";
                contentItem.dataset.type = item.type;
                contentItem.dataset.index = index;

                // Check if this item is already selected
                const isSelected = selectedItems.some(
                    selected => selected.content === item.content && selected.type === item.type
                );
                if (isSelected) {
                    contentItem.classList.add("selected");
                }

                const icon = document.createElement("span");
                icon.className = "content-icon";
                icon.innerHTML = getIconForType(item.type);
                contentItem.appendChild(icon);

                const preview = document.createElement("span");
                preview.className = "content-preview";
                
                // Special handling for different content types
                if (item.type === "List") {
                    preview.textContent = `List with ${item.items ? item.items.length : 0} items`;
                } else if (item.type === "Table") {
                    preview.textContent = `Table with ${item.rows ? item.rows.length : 0} rows`;
                } else {
                    preview.textContent = truncateText(item.content, 50);
                }
                
                preview.title = item.type === "List" || item.type === "Table" 
                    ? JSON.stringify(item.content, null, 2)
                    : item.content;
                contentItem.appendChild(preview);

                contentItem.addEventListener("click", () => {
                    contentItem.classList.toggle("selected");
                    updateSelectedItems();
                });

                contentTypesContainer.appendChild(contentItem);
            });
        }
    }

    function updateSelectedItems() {
        selectedItems = Array.from(document.querySelectorAll(".content-item.selected"))
            .map(el => {
                const type = el.dataset.type;
                const content = el.querySelector(".content-preview").title;
                // For complex types (List, Table), we need to find by type and exact match
                if (type === "List" || type === "Table") {
                    return allContent.find(item => 
                        item.type === type && 
                        JSON.stringify(item.content) === content
                    );
                }
                return allContent.find(item => item.type === type && item.content === content);
            })
            .filter(item => item !== undefined);
        
        updateButtonStates();
    }
    
    function updateButtonStates() {
        const activeFilters = getActiveFilters();
        const hasSelected = selectedItems.length > 0;
        
        const hasImages = selectedItems.some(item => 
            item.type === "Image" && activeFilters.Image
        );
        
        const hasOtherContent = selectedItems.some(item => 
            item.type !== "Image" && 
            ((item.type === "Heading" && activeFilters.Heading) ||
             (item.type === "Paragraph" && activeFilters.Paragraph) ||
             (item.type === "Link" && activeFilters.Link) ||
             (item.type === "Text" && activeFilters.Text) ||
             (item.type === "List" && activeFilters.List) ||
             (item.type === "Table" && activeFilters.Table) ||
             (item.type === "Code" && activeFilters.Code))
        );

        downloadJsonBtn.disabled = !hasSelected || !hasOtherContent;
        downloadCsvBtn.disabled = !hasSelected || !hasOtherContent;
        downloadHtmlBtn.disabled = !hasSelected || !hasOtherContent;
        downloadImagesBtn.disabled = !hasSelected || !hasImages;
    }

    function downloadSelectedContent(format) {
        if (selectedItems.length === 0) return;
        
        // Filter based on what's currently selected in the type filters
        const activeFilters = getActiveFilters();
    
        const filteredItems = selectedItems.filter(item => activeFilters[item.type]);
        
        if (filteredItems.length === 0) {
            updateStatus("No content selected matching current filters", "error");
            return;
        }
    
        if (format === "png") {
            const selectedImages = filteredItems.filter(item => item.type === "Image");
            if (selectedImages.length === 0) {
                updateStatus("No images selected for download", "error");
                return;
            }
            downloadImagesAsPNG(selectedImages);
        } else {
            downloadOtherContent(filteredItems, format);
        }
    }

    async function downloadImagesAsPNG(images) {
        updateStatus("Preparing image downloads...", "info");
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                updateStatus("No active tab found", "error");
                return;
            }
    
            const url = new URL(tab.url);
            let siteName = url.hostname.replace('www.', '').split('.')[0];
            siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            const dateStr = new Date().toISOString().split('T')[0];
    
            // Download images one by one
            let successCount = 0;
            for (let i = 0; i < images.length; i++) {
                try {
                    const image = images[i];
                    const result = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: fetchSingleImageAsBlob,
                        args: [image.content]
                    });
    
                    if (result?.[0]?.result) {
                        const blob = base64ToBlob(result[0].result, 'image/png');
                        const blobUrl = URL.createObjectURL(blob);
                        const filename = `${siteName}_${dateStr}_image_${i+1}.png`;
                        
                        await new Promise((resolve) => {
                            chrome.downloads.download({
                                url: blobUrl,
                                filename: filename,
                                saveAs: false,
                                conflictAction: 'uniquify'
                            }, () => {
                                URL.revokeObjectURL(blobUrl);
                                successCount++;
                                resolve();
                            });
                        });
                        
                        updateStatus(`Downloading (${i+1}/${images.length})`, "info");
                    }
                } catch (error) {
                    console.error(`Error downloading image ${i+1}:`, error);
                }
            }
    
            updateStatus(`Downloaded ${successCount}/${images.length} images`, 
                        successCount > 0 ? "success" : "error");
    
        } catch (error) {
            console.error("Image download error:", error);
            updateStatus(`Error: ${error.message}`, "error");
        }
    }
    
    function downloadOtherContent(content, format) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            
            const url = new URL(tabs[0].url);
            let siteName = url.hostname.replace('www.', '').split('.')[0];
            siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            const dateStr = new Date().toISOString().split('T')[0];
            
            let contentData, extension;
            
            switch (format) {
                case "json":
                    contentData = JSON.stringify(content, null, 2);
                    extension = "json";
                    break;
                case "html":
                    contentData = generateHTML(content);
                    extension = "html";
                    break;
                case "csv":
                default:
                    contentData = generateCSV(content);
                    extension = "csv";
            }
            
            const filename = `${siteName}_${dateStr}_scraped.${extension}`;
            const blob = new Blob([contentData], { type: `text/${extension};charset=utf-8` });
            const blobUrl = URL.createObjectURL(blob);
            
            chrome.downloads.download({
                url: blobUrl,
                filename: filename,
                saveAs: true
            });
            
            updateStatus(`Downloaded ${content.length} items as ${format.toUpperCase()}`, "success");
        });
    }

    function generateCSV(items) {
        let csv = "Type,Content,Source\n";
        items.forEach(item => {
            let content = item.content;
            
            // Handle complex content types
            if (item.type === "List") {
                content = item.items ? item.items.join(" | ") : "";
            } else if (item.type === "Table") {
                content = item.rows ? item.rows.map(row => row.join(" | ")).join("\n") : "";
            }
            
            csv += `"${item.type}","${escapeCsv(content)}","${escapeCsv(item.source || document.location.href)}"\n`;
        });
        return csv;
    }
    
    function generateHTML(items) {
        let html = `<!DOCTYPE html>
<html>
<head>
    <title>Scraped Content</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        .item { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .type { font-weight: bold; color: #3498db; }
        .content { margin: 10px 0; }
        .source { font-size: 0.8em; color: #777; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        ul, ol { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <h1>Scraped Content from ${document.location.href}</h1>
    <p>Saved on ${new Date().toLocaleString()}</p>`;

        items.forEach(item => {
            html += `
    <div class="item">
        <div class="type">${item.type}</div>
        <div class="content">${formatContent(item)}</div>
        <div class="source">Source: ${item.source || document.location.href}</div>
    </div>`;
        });

        html += `
</body>
</html>`;
        return html;
    }

    function formatContent(item) {
        if (item.type === "Image") {
            return `<img src="${item.content}" alt="${item.alt || 'Scraped image'}">`;
        } else if (item.type === "List") {
            const listType = item.ordered ? "ol" : "ul";
            let listItems = "";
            if (item.items) {
                listItems = item.items.map(li => `<li>${li.replace(/\n/g, "<br>")}</li>`).join("");
            }
            return `<${listType}>${listItems}</${listType}>`;
        } else if (item.type === "Table") {
            if (!item.rows || item.rows.length === 0) return "Empty table";
            
            let tableHtml = "<table><tbody>";
            item.rows.forEach(row => {
                tableHtml += "<tr>";
                row.forEach(cell => {
                    tableHtml += `<td>${cell.replace(/\n/g, "<br>")}</td>`;
                });
                tableHtml += "</tr>";
            });
            tableHtml += "</tbody></table>";
            return tableHtml;
        } else if (item.type === "Code") {
            return `<pre><code>${item.content}</code></pre>`;
        }
        return item.content.replace(/\n/g, "<br>");
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateStatus(message, type = "info") {
        statusMessage.textContent = message;
        statusMessage.className = "status-message status-" + type;
    }

    function showProgress() {
        progressContainer.style.display = "flex";
        progressFill.style.width = "0%";
        progressText.textContent = "0%";
    }

    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }

    function hideProgress() {
        progressContainer.style.display = "none";
    }

    // Helper functions
    function getIconForType(type) {
        const icons = {
            "Heading": "H",
            "Paragraph": "P",
            "Link": "🔗",
            "Image": "🖼️",
            "Text": "✏️",
            "List": "📋",
            "Table": "📊",
            "Code": "</>"
        };
        return icons[type] || "•";
    }

    function truncateText(text, length) {
        if (!text) return "";
        text = String(text);
        return text.length > length ? text.substring(0, length) + "..." : text;
    }

    function escapeCsv(text) {
        if (!text) return "";
        return text.replace(/"/g, '""').replace(/\n/g, " ");
    }

    function base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    }

    // Initialize the extension
    initEventListeners();
});

// Content script function to be injected
function scrapeAllContent() {
    const content = [];
    const totalElements = document.querySelectorAll("*").length;
    let processedElements = 0;
    
    function updateProgress() {
        processedElements++;
        const progress = Math.floor((processedElements / totalElements) * 100);
        chrome.runtime.sendMessage({
            action: "scraping_progress",
            progress: progress
        });
    }
    
    // Scrape headings
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
        content.push({
            type: "Heading",
            content: el.textContent.trim(),
            level: el.tagName.match(/\d/)?.[0] || "1",
            source: el.outerHTML
        });
        updateProgress();
    });
    
    // Scrape paragraphs
    document.querySelectorAll("p").forEach(el => {
        content.push({
            type: "Paragraph",
            content: el.textContent.trim(),
            source: el.outerHTML
        });
        updateProgress();
    });
    
    // Scrape links
    document.querySelectorAll("a").forEach(el => {
        if (el.href) {
            content.push({
                type: "Link",
                content: el.href,
                text: el.textContent.trim(),
                source: el.outerHTML
            });
        }
        updateProgress();
    });
    
    // Scrape images
    document.querySelectorAll("img").forEach(el => {
        content.push({
            type: "Image",
            content: el.src,
            alt: el.alt || "",
            source: el.outerHTML
        });
        updateProgress();
    });
    
    // Scrape lists
    document.querySelectorAll("ul, ol").forEach(el => {
        const items = Array.from(el.querySelectorAll("li")).map(li => li.textContent.trim());
        content.push({
            type: "List",
            ordered: el.tagName === "OL",
            items: items,
            source: el.outerHTML
        });
        updateProgress();
    });
    
    // Scrape tables
    document.querySelectorAll("table").forEach(el => {
        const rows = [];
        el.querySelectorAll("tr").forEach(tr => {
            const row = Array.from(tr.querySelectorAll("th, td")).map(cell => cell.textContent.trim());
            rows.push(row);
        });
        
        if (rows.length > 0) {
            content.push({
                type: "Table",
                rows: rows,
                source: el.outerHTML
            });
        }
        updateProgress();
    });
    
    // Scrape code blocks
    document.querySelectorAll("pre, code").forEach(el => {
        if (el.textContent.trim().length > 0) {
            content.push({
                type: "Code",
                content: el.textContent.trim(),
                source: el.outerHTML
            });
        }
        updateProgress();
    });
    
    // Scrape other text elements with significant content
    document.querySelectorAll("div, span, article, section, blockquote, aside, header, footer, main, nav").forEach(el => {
        const text = el.textContent.trim();
        if (text.length > 20 && 
            !el.querySelector("p, h1, h2, h3, h4, h5, h6, ul, ol, table, pre, code") &&
            el.children.length === 0) {
            content.push({
                type: "Text",
                content: text,
                source: el.outerHTML
            });
        }
        updateProgress();
    });
    
    chrome.runtime.sendMessage({
        action: "scraped_data",
        data: content
    });
}

function fetchSingleImageAsBlob(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                console.error("Image conversion error:", e);
                resolve(null);
            }
        };
        
        img.onerror = function() {
            console.error("Image load error:", url);
            resolve(null);
        };
        
        img.src = url;
    });
}